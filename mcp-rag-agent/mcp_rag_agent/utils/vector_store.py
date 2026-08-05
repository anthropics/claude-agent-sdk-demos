"""Simple FAISS-based vector store for document retrieval.

Loads markdown documents from a corpus directory, splits them into chunks,
embeds each chunk using a lightweight sentence-transformer model, and indexes
them with FAISS for fast nearest-neighbor search.
"""

import os
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class DocumentChunk:
    """A single chunk of text with metadata about its source."""
    text: str
    source_file: str
    heading: str
    chunk_index: int


@dataclass
class SearchResult:
    """A ranked search result containing a chunk and its relevance score."""
    chunk: DocumentChunk
    score: float  # cosine similarity (higher is better)


# ---------------------------------------------------------------------------
# Chunking helpers
# ---------------------------------------------------------------------------

def _split_by_headings(text: str, source_file: str) -> List[DocumentChunk]:
    """Split a markdown document into chunks along heading boundaries.

    Each chunk corresponds to the text under a heading (any level).  If a
    chunk exceeds ``MAX_CHUNK_CHARS`` it is further split into roughly equal
    sub-chunks so that embedding quality stays high.
    """
    MAX_CHUNK_CHARS = 1500

    # Split on markdown headings (lines starting with one or more '#')
    heading_pattern = re.compile(r"^(#{1,6})\s+(.+)$", re.MULTILINE)
    matches = list(heading_pattern.finditer(text))

    raw_sections: list[tuple[str, str]] = []

    if not matches:
        # No headings found - treat the whole document as one section
        raw_sections.append(("Document", text.strip()))
    else:
        # Text before the first heading (if any)
        preamble = text[: matches[0].start()].strip()
        if preamble:
            raw_sections.append(("Introduction", preamble))

        for i, match in enumerate(matches):
            heading = match.group(2).strip()
            start = match.end()
            end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
            body = text[start:end].strip()
            if body:
                raw_sections.append((heading, body))

    # Build chunks, splitting oversized sections
    chunks: list[DocumentChunk] = []
    idx = 0
    for heading, body in raw_sections:
        if len(body) <= MAX_CHUNK_CHARS:
            chunks.append(DocumentChunk(
                text=body, source_file=source_file,
                heading=heading, chunk_index=idx,
            ))
            idx += 1
        else:
            # Split on paragraph boundaries first, then by character limit
            paragraphs = [p.strip() for p in body.split("\n\n") if p.strip()]
            current = ""
            for para in paragraphs:
                if current and len(current) + len(para) + 2 > MAX_CHUNK_CHARS:
                    chunks.append(DocumentChunk(
                        text=current.strip(), source_file=source_file,
                        heading=heading, chunk_index=idx,
                    ))
                    idx += 1
                    current = para
                else:
                    current = f"{current}\n\n{para}" if current else para
            if current.strip():
                chunks.append(DocumentChunk(
                    text=current.strip(), source_file=source_file,
                    heading=heading, chunk_index=idx,
                ))
                idx += 1

    return chunks


# ---------------------------------------------------------------------------
# Vector store
# ---------------------------------------------------------------------------

class VectorStore:
    """FAISS-backed vector store for document chunks.

    Parameters
    ----------
    model_name : str
        Name of the sentence-transformer model to use for embeddings.
        Defaults to ``all-MiniLM-L6-v2`` which is small (~80 MB) and fast.
    """

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model = SentenceTransformer(model_name)
        self.dimension: int = self.model.get_sentence_embedding_dimension()
        self.index: Optional[faiss.IndexFlatIP] = None  # inner-product (cosine after normalization)
        self.chunks: List[DocumentChunk] = []

    # ------------------------------------------------------------------
    # Indexing
    # ------------------------------------------------------------------

    def load_corpus(self, corpus_dir: str | Path) -> int:
        """Load and index all ``.md`` files from *corpus_dir*.

        Returns the total number of chunks indexed.
        """
        corpus_path = Path(corpus_dir)
        if not corpus_path.is_dir():
            raise FileNotFoundError(f"Corpus directory not found: {corpus_path}")

        all_chunks: list[DocumentChunk] = []
        for md_file in sorted(corpus_path.glob("*.md")):
            text = md_file.read_text(encoding="utf-8")
            file_chunks = _split_by_headings(text, source_file=md_file.name)
            all_chunks.extend(file_chunks)

        if not all_chunks:
            raise ValueError(f"No markdown documents found in {corpus_path}")

        self.chunks = all_chunks

        # Embed and index
        texts = [c.text for c in self.chunks]
        embeddings = self.model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
        embeddings = np.array(embeddings, dtype=np.float32)

        self.index = faiss.IndexFlatIP(self.dimension)
        self.index.add(embeddings)

        return len(self.chunks)

    # ------------------------------------------------------------------
    # Search
    # ------------------------------------------------------------------

    def search(self, query: str, top_k: int = 5) -> List[SearchResult]:
        """Return the *top_k* most relevant chunks for *query*.

        Relevance is measured by cosine similarity between the query
        embedding and each chunk embedding.
        """
        if self.index is None or not self.chunks:
            raise RuntimeError("Vector store is empty. Call load_corpus() first.")

        query_vec = self.model.encode([query], normalize_embeddings=True)
        query_vec = np.array(query_vec, dtype=np.float32)

        scores, indices = self.index.search(query_vec, min(top_k, len(self.chunks)))

        results: list[SearchResult] = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < 0:
                continue
            results.append(SearchResult(chunk=self.chunks[idx], score=float(score)))

        return results

    def format_results(self, results: List[SearchResult]) -> str:
        """Format search results as a readable string for the LLM."""
        if not results:
            return "No results found."

        parts: list[str] = []
        for i, r in enumerate(results, 1):
            parts.append(
                f"--- Result {i} (score: {r.score:.3f}) ---\n"
                f"Source: {r.chunk.source_file} > {r.chunk.heading}\n\n"
                f"{r.chunk.text}"
            )
        return "\n\n".join(parts)

# MCP RAG Agent

A multi-agent retrieval-augmented generation (RAG) system that uses the Claude Agent SDK to orchestrate document retrieval and answer synthesis. A lead agent coordinates two specialized sub-agents: one for vector-based document retrieval (via an MCP tool server) and one for evaluating and scoring the retrieved chunks before producing a final, sourced answer.

## Quick Start

```bash
# Install dependencies
uv sync

# Set your API key
export ANTHROPIC_API_KEY="your-api-key"

# Run the agent
uv run python run.py
```

Then ask a question about Nexora Technologies, for example:

> "What products does Nexora offer and how are they priced?"

## Architecture

```
                          +-------------------+
                          |   Lead Agent      |
                          | (Orchestrator)    |
                          +--------+----------+
                                   |
                      Task tool    |    Task tool
                   +---------------+---------------+
                   |                               |
          +--------v---------+           +---------v--------+
          | Retrieval Agent  |           | Evaluator Agent  |
          |                  |           |                  |
          | Tools:           |           | Tools:           |
          |  - vector_search |           |  - Read          |
          |    (MCP)         |           |  - Write         |
          |  - Write         |           |                  |
          +--------+---------+           +---------+--------+
                   |                               |
                   |  MCP stdio                    |
          +--------v---------+                     |
          | Search Server    |                     |
          | (FAISS + sentence|                     |
          |  transformers)   |                     |
          +--------+---------+                     |
                   |                               |
          +--------v---------+           +---------v--------+
          | files/           |           | files/           |
          | retrieved_       |---------->| evaluation.md    |
          | chunks.md        |           |                  |
          +------------------+           +------------------+
```

### Agent Roles

| Agent | Tools | Purpose |
|-------|-------|---------|
| **Lead Agent** | `Task`, `Read` | Receives user queries, orchestrates retrieval and evaluation |
| **Retrieval Agent** | `vector_search` (MCP), `Write` | Searches the document corpus via FAISS vector similarity |
| **Evaluator Agent** | `Read`, `Write` | Scores retrieved chunks for relevance and synthesizes a sourced answer |

### MCP Search Server

The retrieval agent accesses documents through an MCP tool server (`search_server.py`) that:

1. Loads all `.md` files from the `corpus/` directory
2. Splits documents into chunks along heading boundaries
3. Embeds chunks using `all-MiniLM-L6-v2` (a lightweight sentence-transformer model)
4. Indexes embeddings with FAISS for fast cosine-similarity search
5. Exposes a `vector_search` tool over MCP stdio transport

The server is launched automatically as a subprocess when the agent starts.

## Sample Corpus

The demo includes a set of markdown documents about **Nexora Technologies**, a fictional enterprise software company:

| File | Contents |
|------|----------|
| `corpus/about.md` | Company overview, leadership, funding history |
| `corpus/products.md` | Product descriptions (Flow, Connect, Assist), features, pricing |
| `corpus/engineering.md` | Architecture, infrastructure, team structure, dev practices |
| `corpus/customers.md` | Customer base metrics, case studies |
| `corpus/security.md` | Certifications, encryption, access control, incident response |

You can replace or extend the corpus with your own `.md` files.

## Output Structure

```
files/
  retrieved_chunks.md    # Raw chunks from vector search
  evaluation.md          # Chunk scores + synthesized answer

logs/
  session_YYYYMMDD_HHMMSS/
    transcript.txt       # Human-readable conversation
    tool_calls.jsonl     # Structured tool usage log
```

## Example Queries

- "What products does Nexora offer?"
- "Tell me about the engineering team structure"
- "What security certifications does Nexora have?"
- "How did BrightPath Financial use Nexora?"
- "What is the company's total funding?"

## Configuration

### Using a different corpus

Point the search server at a different directory of markdown files:

```python
# In mcp_rag_agent/agent.py, modify CORPUS_DIR:
CORPUS_DIR = Path("/path/to/your/documents")
```

### Adjusting retrieval parameters

- **Chunk size**: Edit `MAX_CHUNK_CHARS` in `mcp_rag_agent/utils/vector_store.py` (default: 1500 characters)
- **Results per search**: Change `top_k` in the retrieval agent prompt (default: 5)
- **Embedding model**: Change `model_name` in the `VectorStore` constructor

## Dependencies

- [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk) - Agent orchestration
- [FAISS](https://github.com/facebookresearch/faiss) - Vector similarity search
- [sentence-transformers](https://www.sbert.net/) - Text embeddings
- [python-dotenv](https://github.com/theskumar/python-dotenv) - Environment variable loading

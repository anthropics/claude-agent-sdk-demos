"""Standalone MCP tool server that exposes vector search over the corpus.

This module runs as a subprocess MCP server (stdio transport).  The lead
agent's retrieval sub-agent connects to it and calls the ``vector_search``
tool to find document chunks relevant to a query.

Usage (standalone, for testing)::

    python -m mcp_rag_agent.tools.search_server --corpus ./corpus

The server reads the corpus directory, builds the FAISS index, and then
listens for JSON-RPC requests on stdin/stdout.
"""

import argparse
import json
import sys
from pathlib import Path

# Ensure the project root is on sys.path when run directly
_project_root = Path(__file__).resolve().parents[2]
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

from mcp_rag_agent.utils.vector_store import VectorStore


def _build_store(corpus_dir: str) -> VectorStore:
    """Build and return a VectorStore loaded from *corpus_dir*."""
    store = VectorStore()
    n = store.load_corpus(corpus_dir)
    print(f"[search_server] Indexed {n} chunks from {corpus_dir}", file=sys.stderr)
    return store


# ---------------------------------------------------------------------------
# Minimal MCP stdio server (JSON-RPC 2.0 over stdin/stdout)
# ---------------------------------------------------------------------------

def _read_message() -> dict | None:
    """Read one JSON-RPC message from stdin (Content-Length framing)."""
    # Read headers
    content_length = 0
    while True:
        line = sys.stdin.readline()
        if not line:
            return None  # EOF
        line = line.strip()
        if not line:
            break  # empty line separates headers from body
        if line.lower().startswith("content-length:"):
            content_length = int(line.split(":", 1)[1].strip())

    if content_length == 0:
        return None

    body = sys.stdin.read(content_length)
    return json.loads(body)


def _send_message(msg: dict):
    """Send a JSON-RPC message to stdout with Content-Length framing."""
    body = json.dumps(msg)
    header = f"Content-Length: {len(body)}\r\n\r\n"
    sys.stdout.write(header + body)
    sys.stdout.flush()


def _handle_initialize(request: dict) -> dict:
    """Handle the MCP initialize request."""
    return {
        "jsonrpc": "2.0",
        "id": request["id"],
        "result": {
            "protocolVersion": "2024-11-05",
            "capabilities": {"tools": {"listChanged": False}},
            "serverInfo": {"name": "rag-search-server", "version": "0.1.0"},
        },
    }


def _handle_tools_list(request: dict) -> dict:
    """Return the list of available tools."""
    return {
        "jsonrpc": "2.0",
        "id": request["id"],
        "result": {
            "tools": [
                {
                    "name": "vector_search",
                    "description": (
                        "Search the document corpus for chunks relevant to a "
                        "natural-language query. Returns the top-k most "
                        "similar document chunks with similarity scores."
                    ),
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "The search query in natural language.",
                            },
                            "top_k": {
                                "type": "integer",
                                "description": "Number of results to return (default 5).",
                                "default": 5,
                            },
                        },
                        "required": ["query"],
                    },
                }
            ]
        },
    }


def _handle_tools_call(request: dict, store: VectorStore) -> dict:
    """Execute a tool call."""
    params = request.get("params", {})
    tool_name = params.get("name", "")
    arguments = params.get("arguments", {})

    if tool_name != "vector_search":
        return {
            "jsonrpc": "2.0",
            "id": request["id"],
            "result": {
                "content": [{"type": "text", "text": f"Unknown tool: {tool_name}"}],
                "isError": True,
            },
        }

    query = arguments.get("query", "")
    top_k = arguments.get("top_k", 5)

    results = store.search(query, top_k=top_k)
    formatted = store.format_results(results)

    return {
        "jsonrpc": "2.0",
        "id": request["id"],
        "result": {
            "content": [{"type": "text", "text": formatted}],
            "isError": False,
        },
    }


def serve(corpus_dir: str):
    """Run the MCP server loop."""
    store = _build_store(corpus_dir)

    while True:
        msg = _read_message()
        if msg is None:
            break

        method = msg.get("method", "")

        if method == "initialize":
            _send_message(_handle_initialize(msg))
        elif method == "notifications/initialized":
            pass  # notification, no response needed
        elif method == "tools/list":
            _send_message(_handle_tools_list(msg))
        elif method == "tools/call":
            _send_message(_handle_tools_call(msg, store))
        else:
            # Unknown method -- return error
            if "id" in msg:
                _send_message({
                    "jsonrpc": "2.0",
                    "id": msg["id"],
                    "error": {
                        "code": -32601,
                        "message": f"Method not found: {method}",
                    },
                })


def main():
    parser = argparse.ArgumentParser(description="RAG search MCP server")
    parser.add_argument(
        "--corpus",
        type=str,
        default=str(Path(__file__).resolve().parents[2] / "corpus"),
        help="Path to the corpus directory containing .md files",
    )
    args = parser.parse_args()
    serve(args.corpus)


if __name__ == "__main__":
    main()

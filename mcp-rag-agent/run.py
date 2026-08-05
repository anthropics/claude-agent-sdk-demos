#!/usr/bin/env python3
"""Convenience entry point for the MCP RAG agent.

Usage::

    python run.py

Or equivalently::

    uv run python mcp_rag_agent/agent.py
"""

import asyncio

from mcp_rag_agent.agent import chat

if __name__ == "__main__":
    asyncio.run(chat())

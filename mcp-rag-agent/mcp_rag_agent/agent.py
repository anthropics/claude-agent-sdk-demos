"""Entry point for the MCP RAG agent.

Starts an interactive chat session backed by a lead orchestrator agent that
delegates to two subagents:

1. **Retrieval agent** -- uses an MCP tool server to vector-search a document
   corpus and writes the top results to ``files/retrieved_chunks.md``.
2. **Evaluator agent** -- reads the retrieved chunks, scores them for
   relevance, and produces a sourced answer in ``files/evaluation.md``.

The MCP search server is started as a subprocess automatically; no manual
setup beyond ``uv sync`` and an ``ANTHROPIC_API_KEY`` is required.
"""

import asyncio
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from claude_agent_sdk import (
    ClaudeSDKClient,
    ClaudeAgentOptions,
    AgentDefinition,
    HookMatcher,
)

from mcp_rag_agent.utils.subagent_tracker import SubagentTracker
from mcp_rag_agent.utils.transcript import setup_session, TranscriptWriter
from mcp_rag_agent.utils.message_handler import process_assistant_message

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

load_dotenv()

PROJECT_ROOT = Path(__file__).resolve().parents[1]
PROMPTS_DIR = Path(__file__).parent / "prompts"
CORPUS_DIR = PROJECT_ROOT / "corpus"


def load_prompt(filename: str) -> str:
    """Load a prompt template from the prompts directory."""
    prompt_path = PROMPTS_DIR / filename
    with open(prompt_path, "r", encoding="utf-8") as fh:
        return fh.read().strip()


# ---------------------------------------------------------------------------
# Main chat loop
# ---------------------------------------------------------------------------

async def chat():
    """Run the interactive RAG chat session."""

    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("\nError: ANTHROPIC_API_KEY not found.")
        print("Set it in a .env file or export it in your shell.")
        print("Get your key at: https://console.anthropic.com/settings/keys\n")
        return

    # Ensure output directories exist
    files_dir = Path("files")
    files_dir.mkdir(exist_ok=True)

    # Session logging
    transcript_file, session_dir = setup_session()
    transcript = TranscriptWriter(transcript_file)

    # Load agent prompts
    lead_prompt = load_prompt("lead_agent.txt")
    retrieval_prompt = load_prompt("retrieval_agent.txt")
    evaluator_prompt = load_prompt("evaluator_agent.txt")

    # Subagent tracker
    tracker = SubagentTracker(transcript_writer=transcript, session_dir=session_dir)

    # ------------------------------------------------------------------
    # MCP server configuration
    # ------------------------------------------------------------------
    # The search server is launched as a subprocess by the SDK.  It loads
    # the corpus, builds the FAISS index, and exposes the ``vector_search``
    # tool over MCP stdio transport.
    search_server_cmd = [
        sys.executable,
        "-m", "mcp_rag_agent.tools.search_server",
        "--corpus", str(CORPUS_DIR),
    ]

    mcp_servers = {
        "rag-search": {
            "command": search_server_cmd[0],
            "args": search_server_cmd[1:],
        }
    }

    # ------------------------------------------------------------------
    # Agent definitions
    # ------------------------------------------------------------------
    agents = {
        "retrieval": AgentDefinition(
            description=(
                "Use this agent to search the document corpus for information "
                "relevant to the user's question. The retrieval agent has "
                "access to the vector_search MCP tool which performs semantic "
                "search over the indexed documents. It saves results to "
                "files/retrieved_chunks.md for the evaluator."
            ),
            tools=["mcp__rag-search__vector_search", "Write"],
            prompt=retrieval_prompt,
            model="haiku",
        ),
        "evaluator": AgentDefinition(
            description=(
                "Use this agent AFTER the retrieval agent has finished. The "
                "evaluator reads the retrieved chunks from "
                "files/retrieved_chunks.md, scores each chunk for relevance, "
                "and synthesizes a final answer with source citations. Saves "
                "the evaluation and answer to files/evaluation.md."
            ),
            tools=["Read", "Write"],
            prompt=evaluator_prompt,
            model="haiku",
        ),
    }

    # ------------------------------------------------------------------
    # Hooks
    # ------------------------------------------------------------------
    hooks = {
        "PreToolUse": [
            HookMatcher(matcher=None, hooks=[tracker.pre_tool_use_hook])
        ],
        "PostToolUse": [
            HookMatcher(matcher=None, hooks=[tracker.post_tool_use_hook])
        ],
    }

    # ------------------------------------------------------------------
    # SDK client
    # ------------------------------------------------------------------
    options = ClaudeAgentOptions(
        permission_mode="bypassPermissions",
        system_prompt=lead_prompt,
        allowed_tools=["Task", "Read"],
        agents=agents,
        hooks=hooks,
        model="haiku",
        mcp_servers=mcp_servers,
    )

    print("\n" + "=" * 50)
    print("  MCP RAG Agent")
    print("=" * 50)
    print("\nAsk questions about Nexora Technologies.")
    print("The agent retrieves relevant documents and")
    print("synthesizes an evaluated, sourced answer.")
    print("\nType 'exit' to quit.\n")

    try:
        async with ClaudeSDKClient(options=options) as client:
            while True:
                try:
                    user_input = input("\nYou: ").strip()
                except (EOFError, KeyboardInterrupt):
                    break

                if not user_input or user_input.lower() in ("exit", "quit", "q"):
                    break

                transcript.write_to_file(f"\nYou: {user_input}\n")

                # Send query to the lead agent
                await client.query(prompt=user_input)

                transcript.write("\nAgent: ", end="")

                async for msg in client.receive_response():
                    if type(msg).__name__ == "AssistantMessage":
                        process_assistant_message(msg, tracker, transcript)

                transcript.write("\n")
    finally:
        transcript.write("\n\nGoodbye!\n")
        transcript.close()
        tracker.close()
        print(f"\nSession logs saved to: {session_dir}")
        print(f"  - Transcript: {transcript_file}")
        print(f"  - Tool calls: {session_dir / 'tool_calls.jsonl'}")


if __name__ == "__main__":
    asyncio.run(chat())

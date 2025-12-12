"""Entry point for Wide Research agent - researches lists of items with equal quality guarantee."""

import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions, AgentDefinition, HookMatcher

from research_agent.utils.subagent_tracker import SubagentTracker
from research_agent.utils.transcript import setup_session, TranscriptWriter
from research_agent.utils.message_handler import process_assistant_message

# Load environment variables
load_dotenv()

# Paths to prompt files
PROMPTS_DIR = Path(__file__).parent / "prompts"


def load_prompt(filename: str) -> str:
    """Load a prompt from the prompts directory."""
    prompt_path = PROMPTS_DIR / filename
    with open(prompt_path, "r", encoding="utf-8") as f:
        return f.read().strip()


async def chat():
    """Start interactive chat with the Wide Research agent."""

    # Check API key first, before creating any files
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("\nError: ANTHROPIC_API_KEY not found.")
        print("Set it in a .env file or export it in your shell.")
        print("Get your key at: https://console.anthropic.com/settings/keys\n")
        return

    # Setup session directory and transcript
    transcript_file, session_dir = setup_session()

    # Create transcript writer
    transcript = TranscriptWriter(transcript_file)

    # Load Wide Research prompts
    lead_agent_prompt = load_prompt("lead_agent_wide.txt")
    researcher_prompt = load_prompt("researcher_wide.txt")
    report_writer_prompt = load_prompt("report_writer_wide.txt")

    # Initialize subagent tracker with transcript writer and session directory
    tracker = SubagentTracker(transcript_writer=transcript, session_dir=session_dir)

    # Define specialized subagents for Wide Research
    agents = {
        "researcher": AgentDefinition(
            description=(
                "Use this agent to research ONE specific item from a list. "
                "Each researcher is dedicated to a single item (company, person, product, paper, etc.) "
                "and ensures equal quality regardless of item position in the list. "
                "Uses web search to find comprehensive information and writes findings to "
                "files/research_notes/. Prevents the 'fabrication threshold' problem by giving "
                "each item dedicated attention with a fresh context window."
            ),
            tools=["WebSearch", "Write"],
            prompt=researcher_prompt,
            model="haiku"
        ),
        "report-writer": AgentDefinition(
            description=(
                "Use this agent to aggregate research findings from multiple items into a "
                "comprehensive multi-section report. Creates: 1) Individual summaries for each item, "
                "2) Comparative analysis across all items, 3) Overall synthesis and insights. "
                "Reads research from files/research_notes/ and creates reports in files/reports/. "
                "Ensures equal representation for all items in the final report."
            ),
            tools=["Skill", "Write", "Glob", "Read"],
            prompt=report_writer_prompt,
            model="haiku"
        )
    }

    # Set up hooks for tracking
    hooks = {
        'PreToolUse': [
            HookMatcher(
                matcher=None,  # Match all tools
                hooks=[tracker.pre_tool_use_hook]
            )
        ],
        'PostToolUse': [
            HookMatcher(
                matcher=None,  # Match all tools
                hooks=[tracker.post_tool_use_hook]
            )
        ]
    }

    options = ClaudeAgentOptions(
        permission_mode="bypassPermissions",
        setting_sources=["project"],  # Load skills from project .claude directory
        system_prompt=lead_agent_prompt,
        allowed_tools=["Task"],
        agents=agents,
        hooks=hooks,
        model="haiku"
    )

    print("\n=== Wide Research Agent ===")
    print("Provide a list of items (companies, papers, products, etc.) to research.")
    print("Each item gets a dedicated researcher - ensuring equal quality from item #1 to #100.")
    print("\nExamples:")
    print('  "Research Apple, Microsoft, Google, Amazon"')
    print('  "Compare quantum computing at IBM, Google, and Microsoft"')
    print('  "Analyze these SaaS companies: Salesforce, HubSpot, Zendesk"')
    print(f"\nRegistered subagents: {', '.join(agents.keys())}")
    print(f"Session logs: {session_dir}")
    print("Type 'exit' or 'quit' to end.\n")

    try:
        async with ClaudeSDKClient(options=options) as client:
            while True:
                # Get input
                try:
                    user_input = input("\nYou: ").strip()
                except (EOFError, KeyboardInterrupt):
                    break

                if not user_input or user_input.lower() in ["exit", "quit", "q"]:
                    break

                # Write user input to transcript (file only, not console)
                transcript.write_to_file(f"\nYou: {user_input}\n")

                # Send to agent
                await client.query(prompt=user_input)

                transcript.write("\nAgent: ", end="")

                # Stream and process response
                async for msg in client.receive_response():
                    if type(msg).__name__ == 'AssistantMessage':
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

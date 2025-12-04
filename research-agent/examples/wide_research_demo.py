"""Demo script showing how to use Wide Research mode programmatically."""

import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions, AgentDefinition, HookMatcher

# Load environment variables
load_dotenv()

# Paths
RESEARCH_AGENT_DIR = Path(__file__).parent.parent / "research_agent"
PROMPTS_DIR = RESEARCH_AGENT_DIR / "prompts"


def load_prompt(filename: str) -> str:
    """Load a prompt from the prompts directory."""
    prompt_path = PROMPTS_DIR / filename
    with open(prompt_path, "r", encoding="utf-8") as f:
        return f.read().strip()


async def run_wide_research(query: str):
    """Run a Wide Research query and return the result.

    Args:
        query: Research query with a list of items
               Example: "Research Apple, Microsoft, Google"

    Returns:
        Path to the generated report
    """
    # Check API key
    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise ValueError("ANTHROPIC_API_KEY not found in environment")

    # Load Wide Research prompts
    lead_agent_prompt = load_prompt("lead_agent_wide.txt")
    researcher_prompt = load_prompt("researcher_wide.txt")
    report_writer_prompt = load_prompt("report_writer_wide.txt")

    # Define agents
    agents = {
        "researcher": AgentDefinition(
            description="Research individual items from a list",
            tools=["WebSearch", "Write"],
            prompt=researcher_prompt,
            model="haiku"
        ),
        "report-writer": AgentDefinition(
            description="Aggregate multi-item research",
            tools=["Skill", "Write", "Glob", "Read"],
            prompt=report_writer_prompt,
            model="haiku"
        )
    }

    # Configure client
    options = ClaudeAgentOptions(
        permission_mode="bypassPermissions",
        setting_sources=["project"],
        system_prompt=lead_agent_prompt,
        allowed_tools=["Task"],
        agents=agents,
        hooks={},
        model="haiku"
    )

    # Run research
    print(f"\n{'='*60}")
    print(f"Wide Research Query: {query}")
    print(f"{'='*60}\n")

    async with ClaudeSDKClient(options=options) as client:
        await client.query(prompt=query)

        # Collect response
        full_response = []
        async for msg in client.receive_response():
            if type(msg).__name__ == 'AssistantMessage':
                for block in msg.content:
                    if block.type == "text":
                        print(block.text)
                        full_response.append(block.text)

    print(f"\n{'='*60}")
    print("Research complete!")
    print(f"{'='*60}\n")

    return "\n".join(full_response)


async def main():
    """Run demo examples."""
    print("\n" + "="*60)
    print("WIDE RESEARCH MODE - DEMO EXAMPLES")
    print("="*60)

    # Example 1: Small list (3 items)
    print("\n### Example 1: Research 3 tech companies ###")
    example1 = "Research Apple, Microsoft, and Google"
    await run_wide_research(example1)

    # Example 2: Medium list (5 items)
    print("\n### Example 2: Compare 5 AI companies ###")
    example2 = "Compare AI efforts at OpenAI, Anthropic, Google, Microsoft, and Meta"
    await run_wide_research(example2)

    # Example 3: Specific aspect
    print("\n### Example 3: Research specific aspect ###")
    example3 = "Research quantum computing efforts at IBM, Google, and Microsoft"
    await run_wide_research(example3)


if __name__ == "__main__":
    # Run examples
    asyncio.run(main())

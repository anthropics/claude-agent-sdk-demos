"""Minimal Claude Agent SDK example for Python."""

import asyncio

from claude_agent_sdk import AssistantMessage, TextBlock, query


async def main() -> None:
    """Ask Claude one question and print only assistant text blocks."""
    async for message in query(
        prompt="Hello, Claude! Please introduce yourself in one sentence.",
    ):
        if isinstance(message, AssistantMessage):
            for block in message.content:
                if isinstance(block, TextBlock):
                    print("Claude says:", block.text)


if __name__ == "__main__":
    asyncio.run(main())

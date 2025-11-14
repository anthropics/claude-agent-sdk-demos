#!/usr/bin/env python3
"""Simple test script to verify Wide Research mode works."""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from research_agent.agent_wide import chat


async def main():
    """Run a simple interactive test."""
    print("\n" + "="*60)
    print("WIDE RESEARCH - SIMPLE TEST")
    print("="*60)
    print("\nThis will start the Wide Research agent.")
    print("\nSuggested test queries:")
    print("  1. Research Apple, Microsoft, and Google")
    print("  2. Compare AI at OpenAI, Anthropic, and Google")
    print("  3. Analyze Tesla, Ford, and GM")
    print("\nType 'exit' to quit.")
    print("="*60 + "\n")

    # Run the chat interface
    await chat()


if __name__ == "__main__":
    asyncio.run(main())

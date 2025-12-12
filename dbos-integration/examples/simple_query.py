"""
Simple example: Query Claude within a DBOS workflow

This demonstrates the basic pattern of accumulating a Claude stream
within a DBOS step and returning the complete response for checkpointing.
"""

import asyncio
import os
from typing import Any

from dbos import DBOS
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions


def extract_response_text(messages: list[Any]) -> str:
    """
    Extract text from Claude SDK message objects.

    Args:
        messages: List of message objects from Claude SDK stream

    Returns:
        Complete response text
    """
    text_parts = []

    for msg in messages:
        if type(msg).__name__ == 'AssistantMessage':
            for block in msg.content:
                if type(block).__name__ == 'TextBlock':
                    text_parts.append(block.text)

    return ''.join(text_parts)


@DBOS.step()
async def query_claude_step(prompt: str) -> str:
    """
    DBOS Step: Query Claude and accumulate the stream.

    This step accumulates the entire streaming response from Claude
    before returning. DBOS will checkpoint the workflow only when
    this step completes, ensuring efficient database usage.

    Args:
        prompt: The prompt to send to Claude

    Returns:
        Complete response text from Claude

    Note:
        The streaming happens internally, but only the final result
        is returned to the workflow for checkpointing.
    """
    messages = []

    # Get API key from environment
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY environment variable not set")

    # Create options for Claude SDK
    options = ClaudeAgentOptions(
        api_key=api_key,
        model="claude-sonnet-4-5-20250929",
    )

    # Accumulate the entire stream
    async with ClaudeSDKClient(options=options) as client:
        await client.query(prompt=prompt)

        # Stream responses but accumulate them
        async for msg in client.receive_response():
            messages.append(msg)

    # Extract complete text from messages
    response_text = extract_response_text(messages)

    return response_text


@DBOS.workflow()
async def ask_claude_workflow(question: str) -> str:
    """
    DBOS Workflow: Simple question-answering workflow.

    This workflow demonstrates the basic pattern:
    1. Workflow calls a step
    2. Step accumulates the Claude stream
    3. Step returns complete response
    4. Workflow checkpoints with the complete response

    Args:
        question: Question to ask Claude

    Returns:
        Claude's complete response

    Example:
        >>> result = await ask_claude_workflow("What is asyncio?")
        >>> print(result)
    """
    # Query Claude (step will handle streaming internally)
    response = await query_claude_step(question)

    # Checkpoint happens here with the complete response
    return response


async def main():
    """
    Main function for standalone execution.

    This demonstrates how to run DBOS workflows outside
    of the DBOS server runtime (useful for testing).
    """
    # Initialize DBOS
    # In production, this would be configured via dbos-config.yaml
    DBOS.init()

    # Example question
    question = "Explain Python's asyncio in one paragraph."

    print(f"Question: {question}\n")
    print("Querying Claude...\n")

    # Run the workflow
    result = await ask_claude_workflow(question)

    print("Response:")
    print("=" * 60)
    print(result)
    print("=" * 60)


if __name__ == "__main__":
    # Run in asyncio event loop
    asyncio.run(main())

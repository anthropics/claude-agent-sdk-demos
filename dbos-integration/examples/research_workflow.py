"""
Advanced example: Multi-step research workflow with DBOS + Claude

This demonstrates:
- Multiple Claude queries in a workflow
- Sequential step execution with checkpoints
- Error handling and state management
- Complex workflow orchestration
"""

import asyncio
import json
import os
from typing import Any

from dbos import DBOS
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions


def extract_response_text(messages: list[Any]) -> str:
    """Extract text from Claude SDK message objects."""
    text_parts = []

    for msg in messages:
        if type(msg).__name__ == 'AssistantMessage':
            for block in msg.content:
                if type(block).__name__ == 'TextBlock':
                    text_parts.append(block.text)

    return ''.join(text_parts)


async def query_claude_helper(prompt: str) -> str:
    """
    Helper function to query Claude and accumulate stream.

    This is extracted as a helper so multiple steps can reuse it.
    """
    messages = []

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY environment variable not set")

    options = ClaudeAgentOptions(
        api_key=api_key,
        model="claude-sonnet-4-5-20250929",
    )

    async with ClaudeSDKClient(options=options) as client:
        await client.query(prompt=prompt)
        async for msg in client.receive_response():
            messages.append(msg)

    return extract_response_text(messages)


@DBOS.step()
async def generate_research_questions_step(topic: str) -> list[str]:
    """
    Step 1: Generate research questions for a topic.

    This step asks Claude to break down a topic into specific
    research questions. The stream is accumulated and the complete
    list is returned for checkpointing.

    Args:
        topic: Research topic

    Returns:
        List of research questions
    """
    prompt = f"""
You are a research assistant. Given the topic "{topic}", generate 3 specific
research questions that would help understand this topic comprehensively.

Return ONLY a JSON array of strings, like this:
["Question 1?", "Question 2?", "Question 3?"]
"""

    response = await query_claude_helper(prompt)

    # Parse the JSON response
    try:
        # Extract JSON from response (Claude might add explanation)
        json_start = response.find('[')
        json_end = response.rfind(']') + 1
        json_str = response[json_start:json_end]
        questions = json.loads(json_str)
        return questions
    except (json.JSONDecodeError, ValueError) as e:
        print(f"Failed to parse questions: {e}")
        # Fallback: return a default question
        return [f"What is {topic}?"]


@DBOS.step()
async def research_question_step(question: str) -> str:
    """
    Step 2: Research a specific question.

    This step is called multiple times (once per question).
    Each invocation is a separate step with its own checkpoint.

    Args:
        question: Research question to answer

    Returns:
        Answer to the question
    """
    prompt = f"""
You are a research assistant. Provide a concise but comprehensive answer
to this question:

{question}

Limit your response to 2-3 paragraphs.
"""

    response = await query_claude_helper(prompt)
    return response


@DBOS.step()
async def synthesize_report_step(topic: str, qa_pairs: list[dict]) -> str:
    """
    Step 3: Synthesize final report from research.

    This step takes all the Q&A pairs and asks Claude to create
    a cohesive report.

    Args:
        topic: Original research topic
        qa_pairs: List of {"question": "...", "answer": "..."} dicts

    Returns:
        Final synthesized report
    """
    # Build the prompt with all Q&A pairs
    qa_text = "\n\n".join([
        f"Q: {pair['question']}\nA: {pair['answer']}"
        for pair in qa_pairs
    ])

    prompt = f"""
You are a research assistant. Based on the following research questions and answers
about "{topic}", create a cohesive, well-structured report.

Research findings:
{qa_text}

Please synthesize this information into a comprehensive report with:
1. An introduction
2. Key findings organized by theme
3. A conclusion

Keep the report concise but informative (4-5 paragraphs total).
"""

    report = await query_claude_helper(prompt)
    return report


@DBOS.workflow()
async def research_workflow(topic: str) -> dict:
    """
    Main research workflow.

    This workflow demonstrates multiple checkpoints:
    1. After generating questions → checkpoint
    2. After each question is researched → checkpoint
    3. After final synthesis → checkpoint

    If the workflow is interrupted at any point, DBOS will resume
    from the last checkpoint, avoiding redundant Claude API calls.

    Args:
        topic: Research topic

    Returns:
        Dictionary with questions, answers, and final report

    Example:
        >>> result = await research_workflow("Python asyncio")
        >>> print(result['report'])
    """
    print(f"\n{'='*60}")
    print(f"Starting research workflow for: {topic}")
    print(f"{'='*60}\n")

    # Step 1: Generate research questions
    print("Step 1: Generating research questions...")
    questions = await generate_research_questions_step(topic)
    print(f"Generated {len(questions)} questions:")
    for i, q in enumerate(questions, 1):
        print(f"  {i}. {q}")
    print()

    # Checkpoint happens here - questions are saved

    # Step 2: Research each question
    print("Step 2: Researching each question...")
    qa_pairs = []

    for i, question in enumerate(questions, 1):
        print(f"  Researching question {i}/{len(questions)}...")
        answer = await research_question_step(question)
        qa_pairs.append({
            "question": question,
            "answer": answer
        })
        # Checkpoint happens after each question

    print()

    # Step 3: Synthesize final report
    print("Step 3: Synthesizing final report...")
    report = await synthesize_report_step(topic, qa_pairs)

    # Final checkpoint with complete results

    print(f"\n{'='*60}")
    print("Research workflow completed!")
    print(f"{'='*60}\n")

    return {
        "topic": topic,
        "questions": questions,
        "qa_pairs": qa_pairs,
        "report": report
    }


@DBOS.workflow()
async def parallel_research_workflow(topic: str) -> dict:
    """
    Advanced workflow: Research questions in parallel.

    This demonstrates how to run multiple steps concurrently
    while still maintaining DBOS checkpointing guarantees.

    Args:
        topic: Research topic

    Returns:
        Dictionary with questions, answers, and final report
    """
    print(f"\n{'='*60}")
    print(f"Starting PARALLEL research workflow for: {topic}")
    print(f"{'='*60}\n")

    # Step 1: Generate research questions
    print("Step 1: Generating research questions...")
    questions = await generate_research_questions_step(topic)
    print(f"Generated {len(questions)} questions\n")

    # Step 2: Research questions IN PARALLEL
    print("Step 2: Researching questions in parallel...")

    # Create tasks for parallel execution
    research_tasks = [
        research_question_step(question)
        for question in questions
    ]

    # Wait for all to complete
    answers = await asyncio.gather(*research_tasks)

    # Build Q&A pairs
    qa_pairs = [
        {"question": q, "answer": a}
        for q, a in zip(questions, answers)
    ]

    print(f"Completed {len(qa_pairs)} research tasks\n")

    # Step 3: Synthesize final report
    print("Step 3: Synthesizing final report...")
    report = await synthesize_report_step(topic, qa_pairs)

    print(f"\n{'='*60}")
    print("Parallel research workflow completed!")
    print(f"{'='*60}\n")

    return {
        "topic": topic,
        "questions": questions,
        "qa_pairs": qa_pairs,
        "report": report
    }


async def main():
    """Main function for standalone execution."""
    # Initialize DBOS
    DBOS.init()

    # Choose a research topic
    topic = "Python's asyncio and event loops"

    # Option 1: Sequential research (safer, clearer checkpoints)
    result = await research_workflow(topic)

    # Option 2: Parallel research (faster, but more concurrent API calls)
    # result = await parallel_research_workflow(topic)

    # Display results
    print("\n" + "=" * 60)
    print("FINAL REPORT")
    print("=" * 60)
    print(f"\nTopic: {result['topic']}\n")

    print("Questions Researched:")
    for i, q in enumerate(result['questions'], 1):
        print(f"  {i}. {q}")

    print(f"\n{'-'*60}\n")
    print(result['report'])
    print(f"\n{'-'*60}\n")

    print(f"\nTotal Q&A pairs: {len(result['qa_pairs'])}")


if __name__ == "__main__":
    asyncio.run(main())

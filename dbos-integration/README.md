# DBOS + Claude Agent SDK Integration

This example demonstrates how to integrate [DBOS](https://docs.dbos.dev/) with the [Claude Agent SDK](https://docs.anthropic.com/en/docs/claude-code/sdk/sdk-overview), addressing the async/await and streaming challenges that arise when combining these two frameworks.

## The Challenge

Both DBOS and the Claude Agent SDK rely heavily on Python's `asyncio`. Integrating them requires careful handling of:

1. **Event Loop Management**: Both frameworks need to work within the same event loop
2. **Streaming Responses**: The Claude SDK often streams responses (`async for message in query(...)`), which is inherently difficult to checkpoint
3. **State Persistence**: DBOS checkpoints workflow state, but saving after every streamed token would be inefficient

## The Solution

The recommended pattern is to **accumulate the stream within a DBOS Step** and return the full message to the Workflow only upon completion. This approach:

- ✅ Ensures efficient database usage (one checkpoint per complete message)
- ✅ Maintains DBOS's durability guarantees
- ✅ Allows the workflow to resume correctly if interrupted
- ✅ Keeps the streaming logic encapsulated in the step

### Architecture Pattern

```
┌─────────────────────────────────────────────┐
│           DBOS Workflow                     │
│  (Orchestrates, handles checkpoints)        │
│                                             │
│  @DBOS.workflow()                           │
│  async def research_workflow(query):        │
│      result = await query_claude(query) ←───┼── Checkpoint happens here
│      return result                          │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│           DBOS Step                         │
│  (Accumulates stream, returns complete)     │
│                                             │
│  @DBOS.step()                               │
│  async def query_claude(query):             │
│      messages = []                          │
│      async for msg in client.stream(...):   │← Accumulate
│          messages.append(msg)               │
│      return extract_text(messages)      ────┼── Return complete result
└─────────────────────────────────────────────┘
```

## Key Patterns

### ✅ DO: Accumulate Stream in Step

```python
from dbos import DBOS
from claude_agent_sdk import ClaudeSDKClient

@DBOS.step()
async def query_claude_step(prompt: str) -> str:
    """
    Step accumulates the entire stream before returning.
    Checkpoint only happens when the step completes.
    """
    messages = []

    async with ClaudeSDKClient() as client:
        await client.query(prompt=prompt)
        async for msg in client.receive_response():
            messages.append(msg)

    # Extract and return complete response
    return extract_response_text(messages)

@DBOS.workflow()
async def claude_workflow(user_query: str) -> str:
    """
    Workflow orchestrates steps and gets checkpointed.
    """
    # This checkpoint includes the complete Claude response
    response = await query_claude_step(user_query)
    return response
```

### ❌ DON'T: Checkpoint on Every Token

```python
# This is inefficient - don't do this!
@DBOS.step()
async def inefficient_streaming(prompt: str):
    async for msg in client.receive_response():
        # Attempting to checkpoint after every message
        await DBOS.checkpoint(msg)  # Too many DB writes!
```

## Examples

### Basic Example: Simple Query

See [`examples/simple_query.py`](./examples/simple_query.py) for a minimal example of querying Claude within a DBOS workflow.

```python
@DBOS.workflow()
async def ask_claude(question: str) -> str:
    return await query_claude_step(question)
```

### Advanced Example: Multi-Step Research

See [`examples/research_workflow.py`](./examples/research_workflow.py) for a more complex example showing:
- Multiple Claude queries in sequence
- Error handling and retries
- State management across steps

```python
@DBOS.workflow()
async def research_workflow(topic: str) -> dict:
    # Step 1: Generate research questions
    questions = await generate_questions_step(topic)

    # Step 2: Research each question (parallelizable)
    answers = []
    for q in questions:
        answer = await research_question_step(q)
        answers.append(answer)

    # Step 3: Synthesize final report
    report = await synthesize_report_step(topic, answers)

    return report
```

## Setup

### Prerequisites

- Python 3.11+
- PostgreSQL (for DBOS)
- Anthropic API key

### Installation

```bash
cd dbos-integration
pip install -e .
```

### Configuration

1. Create a `.env` file:

```env
ANTHROPIC_API_KEY=your-api-key-here
```

2. Configure DBOS (`dbos-config.yaml`):

```yaml
database:
  hostname: localhost
  port: 5432
  username: postgres
  password: ${DBOS_PASSWORD}
  app_db_name: dbos_claude_demo
```

3. Initialize the database:

```bash
dbos migrate
```

### Running Examples

```bash
# Simple query example
python examples/simple_query.py

# Research workflow example
python examples/research_workflow.py
```

## Event Loop Considerations

### DBOS Runtime

DBOS provides its own async runtime. When using `dbos start`, the event loop is managed for you:

```bash
dbos start
```

This starts a web server where workflows can be invoked via HTTP endpoints.

### Standalone Execution

For testing or standalone scripts, use `asyncio.run()`:

```python
import asyncio
from dbos import DBOS

async def main():
    # Initialize DBOS
    DBOS.init()

    # Run workflow
    result = await my_workflow("input")
    print(result)

if __name__ == "__main__":
    asyncio.run(main())
```

## Error Handling

DBOS automatically retries failed steps. Ensure your Claude API calls are idempotent or handle retries gracefully:

```python
@DBOS.step()
async def query_claude_with_retry(prompt: str, max_retries: int = 3) -> str:
    """
    DBOS will retry this step if it fails.
    The Claude SDK client should be created fresh on each attempt.
    """
    messages = []

    async with ClaudeSDKClient() as client:
        await client.query(prompt=prompt)
        async for msg in client.receive_response():
            messages.append(msg)

    return extract_response_text(messages)
```

## Performance Considerations

### Streaming Delay

Since we accumulate the entire response before checkpointing, there's a delay before the workflow can checkpoint. For very long Claude responses, consider:

1. **Breaking into smaller prompts**: Instead of one long query, use multiple smaller steps
2. **Partial checkpoints**: For extremely long operations, you could checkpoint intermediate results every N tokens (though this increases DB load)

### Database Load

Each completed step writes to the database. Design workflows to balance:
- **Granularity**: Smaller steps = more checkpoints = easier recovery but more DB writes
- **Efficiency**: Larger steps = fewer checkpoints = less DB overhead but longer replay on failure

## Comparison with Other Patterns

### vs. Real-time Streaming to User

If you need real-time streaming to end users while maintaining DBOS durability:

```python
@DBOS.step()
async def query_claude_with_callback(
    prompt: str,
    on_token: callable = None
) -> str:
    """
    Optionally call on_token for real-time updates,
    but still accumulate and return complete response.
    """
    messages = []
    complete_text = ""

    async with ClaudeSDKClient() as client:
        await client.query(prompt=prompt)
        async for msg in client.receive_response():
            messages.append(msg)

            # Optional: Stream to user in real-time
            if on_token and hasattr(msg, 'text'):
                on_token(msg.text)
                complete_text += msg.text

    # Still return complete result for checkpoint
    return complete_text
```

### vs. Manual Checkpointing

DBOS handles checkpointing automatically. You don't need to manually save state:

```python
# ❌ Don't do this - DBOS handles it
@DBOS.step()
async def manual_checkpoint(prompt: str):
    result = await query_claude(prompt)
    await save_to_database(result)  # Redundant!
    return result

# ✅ Do this - let DBOS handle it
@DBOS.step()
async def auto_checkpoint(prompt: str):
    return await query_claude(prompt)  # Automatically checkpointed
```

## Troubleshooting

### Event Loop Errors

**Issue**: `RuntimeError: This event loop is already running`

**Solution**: Ensure you're not nesting `asyncio.run()` calls or mixing sync/async contexts improperly.

### Connection Pooling

**Issue**: Too many database connections

**Solution**: DBOS manages connection pooling. Ensure you're not creating multiple DBOS instances.

### Claude API Rate Limits

**Issue**: Rate limit errors during workflow execution

**Solution**: DBOS will retry failed steps. Consider implementing exponential backoff:

```python
from dbos import SetWorkflowID
import time

@DBOS.step()
async def query_with_backoff(prompt: str, attempt: int = 0) -> str:
    try:
        return await query_claude_step(prompt)
    except RateLimitError:
        if attempt < 3:
            await asyncio.sleep(2 ** attempt)  # Exponential backoff
            return await query_with_backoff(prompt, attempt + 1)
        raise
```

## Resources

- [DBOS Documentation](https://docs.dbos.dev/)
- [Claude Agent SDK Documentation](https://docs.anthropic.com/en/docs/claude-code/sdk/sdk-overview)
- [Python asyncio Guide](https://docs.python.org/3/library/asyncio.html)

## License

MIT - This is sample code for demonstration purposes.

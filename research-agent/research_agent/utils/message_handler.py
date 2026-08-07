"""Message handling for processing agent responses."""

from typing import Any


# Track if a tool was just used (for formatting)
_tool_just_used = False


def process_assistant_message(msg: Any, tracker: Any, transcript: Any) -> None:
    """Process an AssistantMessage and write output to transcript.

    Args:
        msg: AssistantMessage to process
        tracker: SubagentTracker instance
        transcript: TranscriptWriter instance
    """
    global _tool_just_used

    # Update tracker context with parent_tool_use_id from message
    parent_id = getattr(msg, 'parent_tool_use_id', None)
    tracker.set_current_context(parent_id)

    for block in msg.content:
        block_type = type(block).__name__

        if block_type == 'TextBlock':
            # Add newline if a tool was just used
            if _tool_just_used:
                transcript.write("\n", end="")
                _tool_just_used = False
            transcript.write(block.text, end="")

        elif block_type == 'ToolUseBlock':
            # Mark that a tool was used
            _tool_just_used = True

            # Only handle the subagent-spawning tool. Recent CLI versions renamed
            # it from 'Task' to 'Agent'; accept both.
            if block.name in ('Task', 'Agent'):
                subagent_type = block.input.get('subagent_type', 'unknown')
                description = block.input.get('description', 'no description')
                prompt = block.input.get('prompt', '')

                # Register with tracker and get the subagent ID
                subagent_id = tracker.register_subagent_spawn(
                    tool_use_id=block.id,
                    subagent_type=subagent_type,
                    description=description,
                    prompt=prompt
                )

                # User-facing output with subagent ID
                transcript.write(f"\n\n[🚀 Spawning {subagent_id}: {description}]\n", end="")

"""Comprehensive tracking system for subagent tool calls using hooks and message stream."""

import json
import logging
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
from collections import defaultdict

logger = logging.getLogger(__name__)


@dataclass
class ToolCallRecord:
    """Record of a single tool call."""
    timestamp: str
    tool_name: str
    tool_input: Dict[str, Any]
    tool_use_id: str
    subagent_type: str
    parent_tool_use_id: Optional[str] = None
    tool_output: Optional[Any] = None
    error: Optional[str] = None


@dataclass
class SubagentSession:
    """Information about a subagent execution session."""
    subagent_type: str
    parent_tool_use_id: str
    spawned_at: str
    description: str
    prompt_preview: str
    subagent_id: str  # Unique identifier like "RESEARCHER-1"
    tool_calls: List[ToolCallRecord] = field(default_factory=list)


class SubagentTracker:
    """
    Tracks all tool calls made by subagents using both hooks and message stream parsing.

    This tracker:
    1. Monitors the message stream to detect subagent spawns via Task tool
    2. Uses hooks (PreToolUse/PostToolUse) to capture all tool invocations
    3. Associates tool calls with their originating subagent
    4. Logs tool usage to console and transcript files
    """

    def __init__(self, transcript_writer=None, session_dir: Optional[Path] = None):
        # Map: parent_tool_use_id -> SubagentSession
        self.sessions: Dict[str, SubagentSession] = {}

        # Map: tool_use_id -> ToolCallRecord (for efficient lookup in post hook)
        self.tool_call_records: Dict[str, ToolCallRecord] = {}

        # Current execution context (from message stream)
        self._current_parent_id: Optional[str] = None

        # Counter for each subagent type to create unique IDs
        self.subagent_counters: Dict[str, int] = defaultdict(int)

        # Transcript writer for logging clean output
        self.transcript_writer = transcript_writer

        # Tool call detail log (JSONL format)
        self.tool_log_file = None
        if session_dir:
            tool_log_path = session_dir / "tool_calls.jsonl"
            self.tool_log_file = open(tool_log_path, "w", encoding="utf-8")

        logger.debug("SubagentTracker initialized")

    def register_subagent_spawn(
        self,
        tool_use_id: str,
        subagent_type: str,
        description: str,
        prompt: str
    ) -> str:
        """
        Register a new subagent spawn detected from the message stream.

        Args:
            tool_use_id: The ID of the Task tool use block
            subagent_type: Type of subagent (e.g., 'researcher', 'report-writer')
            description: Brief description of the task
            prompt: The full prompt given to the subagent

        Returns:
            The generated subagent_id (e.g., 'RESEARCHER-1')
        """
        # Increment counter for this subagent type and create unique ID
        self.subagent_counters[subagent_type] += 1
        subagent_id = f"{subagent_type.upper()}-{self.subagent_counters[subagent_type]}"

        session = SubagentSession(
            subagent_type=subagent_type,
            parent_tool_use_id=tool_use_id,
            spawned_at=datetime.now().isoformat(),
            description=description,
            prompt_preview=prompt[:200] + "..." if len(prompt) > 200 else prompt,
            subagent_id=subagent_id
        )

        self.sessions[tool_use_id] = session
        logger.info(f"{'='*60}")
        logger.info(f"🚀 SUBAGENT SPAWNED: {subagent_id}")
        logger.info(f"{'='*60}")
        logger.info(f"Task: {description}")
        logger.info(f"{'='*60}")

        return subagent_id

    def set_current_context(self, parent_tool_use_id: Optional[str]):
        """
        Update the current execution context from message stream.

        Args:
            parent_tool_use_id: The parent tool use ID from the current message
        """
        self._current_parent_id = parent_tool_use_id

    def _log_tool_use(self, agent_label: str, tool_name: str, tool_input: Dict[str, Any] = None):
        """
        Helper method to log tool use to console, transcript, and detailed log.

        Args:
            agent_label: Label for the agent (e.g., "RESEARCHER-1", "MAIN AGENT")
            tool_name: Name of the tool being used
            tool_input: Optional tool input parameters for detailed logging
        """
        # Console and transcript: brief message
        message = f"\n[{agent_label}] → {tool_name}"
        logger.info(message.strip())
        if self.transcript_writer:
            self.transcript_writer.write(message)
        else:
            print(message, flush=True)

        # Transcript file only: add input details
        if self.transcript_writer and tool_input:
            detail = self._format_tool_input(tool_input)
            if detail:
                self.transcript_writer.write_to_file(f"    Input: {detail}\n")

    def _format_tool_input(self, tool_input: Dict[str, Any], max_length: int = 100) -> str:
        """Format tool input for human-readable logging."""
        if not tool_input:
            return ""

        # WebSearch: show query
        if 'query' in tool_input:
            query = str(tool_input['query'])
            return f"query='{query if len(query) <= max_length else query[:max_length] + '...'}'"

        # Write: show file path and content size
        if 'file_path' in tool_input and 'content' in tool_input:
            filename = Path(tool_input['file_path']).name
            return f"file='{filename}' ({len(tool_input['content'])} chars)"

        # Read/Glob: show path or pattern
        if 'file_path' in tool_input:
            return f"path='{tool_input['file_path']}'"
        if 'pattern' in tool_input:
            return f"pattern='{tool_input['pattern']}'"

        # Task: show subagent spawn
        if 'subagent_type' in tool_input:
            return f"spawn={tool_input.get('subagent_type', '')} ({tool_input.get('description', '')})"

        # Fallback: generic (truncated)
        return str(tool_input)[:max_length]

    def _log_to_jsonl(self, log_entry: Dict[str, Any]):
        """Write structured log entry to JSONL file."""
        if self.tool_log_file:
            self.tool_log_file.write(json.dumps(log_entry) + "\n")
            self.tool_log_file.flush()

    async def pre_tool_use_hook(self, hook_input, tool_use_id, context):
        """Hook callback for PreToolUse events - captures tool calls."""
        tool_name = hook_input['tool_name']
        tool_input = hook_input['tool_input']
        timestamp = datetime.now().isoformat()

        # Determine agent context
        is_subagent = self._current_parent_id and self._current_parent_id in self.sessions

        if is_subagent:
            session = self.sessions[self._current_parent_id]
            agent_id = session.subagent_id
            agent_type = session.subagent_type

            # Create and store record for subagent
            record = ToolCallRecord(
                timestamp=timestamp,
                tool_name=tool_name,
                tool_input=tool_input,
                tool_use_id=tool_use_id,
                subagent_type=agent_type,
                parent_tool_use_id=self._current_parent_id
            )
            session.tool_calls.append(record)
            self.tool_call_records[tool_use_id] = record

            # Log
            self._log_tool_use(agent_id, tool_name, tool_input)
            self._log_to_jsonl({
                "event": "tool_call_start",
                "timestamp": timestamp,
                "tool_use_id": tool_use_id,
                "agent_id": agent_id,
                "agent_type": agent_type,
                "tool_name": tool_name,
                "tool_input": tool_input,
                "parent_tool_use_id": self._current_parent_id
            })
        else:
            # Main agent tool call. Record it too so the post hook can report its
            # result -- subagent spawns fail silently otherwise.
            record = ToolCallRecord(
                timestamp=timestamp,
                tool_name=tool_name,
                tool_input=tool_input,
                tool_use_id=tool_use_id,
                subagent_type="lead"
            )
            self.tool_call_records[tool_use_id] = record

            # Spawns are already announced by the message stream handler.
            if tool_name not in ('Task', 'Agent'):
                self._log_tool_use("MAIN AGENT", tool_name, tool_input)
            self._log_to_jsonl({
                "event": "tool_call_start",
                "timestamp": timestamp,
                "tool_use_id": tool_use_id,
                "agent_id": "MAIN_AGENT",
                "agent_type": "lead",
                "tool_name": tool_name,
                "tool_input": tool_input
            })

        return {'continue_': True}

    async def post_tool_use_hook(self, hook_input, tool_use_id, context):
        """Hook callback for PostToolUse events - captures tool results."""
        tool_response = hook_input.get('tool_response')
        record = self.tool_call_records.get(tool_use_id)

        if not record:
            return {'continue_': True}

        # Update record with output
        record.tool_output = tool_response

        # Check for errors
        error = tool_response.get('error') if isinstance(tool_response, dict) else None
        if error:
            record.error = error
            session = self.sessions.get(record.parent_tool_use_id)
            if session:
                logger.warning(f"[{session.subagent_id}] Tool {record.tool_name} error: {error}")

        # Get agent info for logging
        session = self.sessions.get(record.parent_tool_use_id)
        agent_id = session.subagent_id if session else "MAIN_AGENT"
        agent_type = session.subagent_type if session else "lead"

        # Log completion to JSONL
        self._log_to_jsonl({
            "event": "tool_call_complete",
            "timestamp": datetime.now().isoformat(),
            "tool_use_id": tool_use_id,
            "agent_id": agent_id,
            "agent_type": agent_type,
            "tool_name": record.tool_name,
            "success": error is None,
            "error": error,
            "output_size": len(str(tool_response)) if tool_response else 0
        })

        return {'continue_': True}

    def close(self):
        """Close the tool log file."""
        if self.tool_log_file:
            self.tool_log_file.close()

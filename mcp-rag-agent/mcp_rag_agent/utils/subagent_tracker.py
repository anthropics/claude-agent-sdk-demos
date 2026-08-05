"""Tracking system for subagent tool calls using SDK hooks."""

import json
import logging
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
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
    """Metadata for a running subagent session."""
    subagent_type: str
    parent_tool_use_id: str
    spawned_at: str
    description: str
    prompt_preview: str
    subagent_id: str
    tool_calls: List[ToolCallRecord] = field(default_factory=list)


class SubagentTracker:
    """Tracks tool calls made by subagents via PreToolUse / PostToolUse hooks.

    Monitors the message stream to detect subagent spawns, associates every
    tool call with the originating subagent, and writes structured logs.
    """

    def __init__(self, transcript_writer=None, session_dir: Optional[Path] = None):
        self.sessions: Dict[str, SubagentSession] = {}
        self.tool_call_records: Dict[str, ToolCallRecord] = {}
        self._current_parent_id: Optional[str] = None
        self.subagent_counters: Dict[str, int] = defaultdict(int)
        self.transcript_writer = transcript_writer

        self.tool_log_file = None
        if session_dir:
            tool_log_path = session_dir / "tool_calls.jsonl"
            self.tool_log_file = open(tool_log_path, "w", encoding="utf-8")

    # ------------------------------------------------------------------
    # Public helpers
    # ------------------------------------------------------------------

    def register_subagent_spawn(
        self,
        tool_use_id: str,
        subagent_type: str,
        description: str,
        prompt: str,
    ) -> str:
        """Register a new subagent spawn and return its unique ID."""
        self.subagent_counters[subagent_type] += 1
        subagent_id = f"{subagent_type.upper()}-{self.subagent_counters[subagent_type]}"

        session = SubagentSession(
            subagent_type=subagent_type,
            parent_tool_use_id=tool_use_id,
            spawned_at=datetime.now().isoformat(),
            description=description,
            prompt_preview=prompt[:200] + "..." if len(prompt) > 200 else prompt,
            subagent_id=subagent_id,
        )
        self.sessions[tool_use_id] = session
        return subagent_id

    def set_current_context(self, parent_tool_use_id: Optional[str]):
        """Update the current execution context from the message stream."""
        self._current_parent_id = parent_tool_use_id

    # ------------------------------------------------------------------
    # Hooks
    # ------------------------------------------------------------------

    async def pre_tool_use_hook(self, hook_input, tool_use_id, context):
        """PreToolUse hook -- log the start of a tool call."""
        tool_name = hook_input["tool_name"]
        tool_input = hook_input["tool_input"]
        timestamp = datetime.now().isoformat()

        is_subagent = (
            self._current_parent_id
            and self._current_parent_id in self.sessions
        )

        if is_subagent:
            session = self.sessions[self._current_parent_id]
            record = ToolCallRecord(
                timestamp=timestamp,
                tool_name=tool_name,
                tool_input=tool_input,
                tool_use_id=tool_use_id,
                subagent_type=session.subagent_type,
                parent_tool_use_id=self._current_parent_id,
            )
            session.tool_calls.append(record)
            self.tool_call_records[tool_use_id] = record

            self._log_tool_use(session.subagent_id, tool_name, tool_input)
            self._log_to_jsonl({
                "event": "tool_call_start",
                "timestamp": timestamp,
                "tool_use_id": tool_use_id,
                "agent_id": session.subagent_id,
                "agent_type": session.subagent_type,
                "tool_name": tool_name,
                "parent_tool_use_id": self._current_parent_id,
            })
        elif tool_name != "Task":
            self._log_tool_use("MAIN AGENT", tool_name, tool_input)
            self._log_to_jsonl({
                "event": "tool_call_start",
                "timestamp": timestamp,
                "tool_use_id": tool_use_id,
                "agent_id": "MAIN_AGENT",
                "agent_type": "lead",
                "tool_name": tool_name,
            })

        return {"continue_": True}

    async def post_tool_use_hook(self, hook_input, tool_use_id, context):
        """PostToolUse hook -- log tool call completion."""
        tool_response = hook_input.get("tool_response")
        record = self.tool_call_records.get(tool_use_id)
        if not record:
            return {"continue_": True}

        record.tool_output = tool_response
        error = tool_response.get("error") if isinstance(tool_response, dict) else None
        if error:
            record.error = error

        session = self.sessions.get(record.parent_tool_use_id)
        agent_id = session.subagent_id if session else "MAIN_AGENT"
        agent_type = session.subagent_type if session else "lead"

        self._log_to_jsonl({
            "event": "tool_call_complete",
            "timestamp": datetime.now().isoformat(),
            "tool_use_id": tool_use_id,
            "agent_id": agent_id,
            "agent_type": agent_type,
            "tool_name": record.tool_name,
            "success": error is None,
            "error": error,
            "output_size": len(str(tool_response)) if tool_response else 0,
        })

        return {"continue_": True}

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _log_tool_use(self, agent_label: str, tool_name: str, tool_input: Dict[str, Any] = None):
        message = f"\n[{agent_label}] -> {tool_name}"
        logger.info(message.strip())
        if self.transcript_writer:
            self.transcript_writer.write(message)
        else:
            print(message, flush=True)

        if self.transcript_writer and tool_input:
            detail = self._format_tool_input(tool_input)
            if detail:
                self.transcript_writer.write_to_file(f"    Input: {detail}\n")

    def _format_tool_input(self, tool_input: Dict[str, Any], max_length: int = 120) -> str:
        if not tool_input:
            return ""
        if "query" in tool_input:
            q = str(tool_input["query"])
            return f"query='{q[:max_length]}'"
        if "subagent_type" in tool_input:
            return f"spawn={tool_input.get('subagent_type', '')} ({tool_input.get('description', '')})"
        return str(tool_input)[:max_length]

    def _log_to_jsonl(self, entry: Dict[str, Any]):
        if self.tool_log_file:
            self.tool_log_file.write(json.dumps(entry) + "\n")
            self.tool_log_file.flush()

    def close(self):
        """Close the tool-log file handle."""
        if self.tool_log_file:
            self.tool_log_file.close()

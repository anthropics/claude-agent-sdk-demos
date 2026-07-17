"""Deterministic tripwire for dangerous tool calls.

The safety gate must not depend on the model labeling its own actions as risky:
a single mislabel would silently disable the gate. So the check is plain keyword
matching over the tool input — deliberately blunt and over-broad. A false
"needs human" is cheap; a false auto-approve is not.
"""

import json
import sys
from typing import Any

from claude_agent_sdk import (
    PermissionResultAllow,
    PermissionResultDeny,
    ToolPermissionContext,
)

# Read-only tools pass the gate without a keyword scan — reading a file named
# "deploy_notes.md" is not a dangerous action. Everything else (Bash, Edit,
# Write, ...) gets the blunt scan below. Note they still ROUTE through the gate
# (nothing is pre-approved), so this policy lives in one auditable place.
READ_ONLY_TOOLS = {"Read", "Grep", "Glob"}

# Editable, "fix it with a hammer" keyword list.
DANGER_KEYWORDS = [
    "rm -",
    "delete",
    "drop",
    "truncate",
    "wipe",
    "format",
    "restart",
    "reboot",
    "shutdown",
    "kill",
    "deploy",
    "push",
    "publish",
    "send",
    "curl",
    "password",
    "secret",
    "token",
    "credential",
    ".env",
]


def is_high_risk(tool_name: str, tool_input: dict[str, Any]) -> tuple[bool, str]:
    """Return (hit, keyword). Scans the serialized tool input, not model prose."""
    haystack = json.dumps(tool_input).lower()
    for kw in DANGER_KEYWORDS:
        if kw in haystack:
            return True, kw
    return False, ""


async def tripwire_gate(
    tool_name: str,
    tool_input: dict[str, Any],
    context: ToolPermissionContext,
) -> PermissionResultAllow | PermissionResultDeny:
    """canUseTool callback: deterministic tripwire + human confirmation.

    - Safe calls are allowed automatically.
    - A tripwire hit requires a human "y" on stdin.
    - Non-interactive runs fail closed: the call is denied.
    """
    if tool_name in READ_ONLY_TOOLS:
        return PermissionResultAllow()

    hit, keyword = is_high_risk(tool_name, tool_input)
    if not hit:
        return PermissionResultAllow()

    summary = tool_input.get("command") or json.dumps(tool_input)[:200]
    print(f"\n🚨 TRIPWIRE hit on keyword '{keyword}':")
    print(f"   {tool_name}: {summary}")

    if not sys.stdin.isatty():
        print("   Non-interactive run -> DENIED (fail closed).")
        return PermissionResultDeny(
            message=(
                f"Blocked by tripwire (keyword '{keyword}'). A human must run this "
                "step manually or re-run the demo interactively to approve it."
            )
        )

    answer = input("   Approve this action? [y/N] ").strip().lower()
    if answer == "y":
        print("   Approved by human.")
        return PermissionResultAllow()
    print("   Denied by human.")
    return PermissionResultDeny(
        message=f"A human declined this action (tripwire keyword '{keyword}')."
    )

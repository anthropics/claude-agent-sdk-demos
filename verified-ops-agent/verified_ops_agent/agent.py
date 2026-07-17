"""Verified Ops Agent — propose, adversarially verify, apply behind a tripwire.

Pipeline (one run, three stages):

1. PROPOSE — an ops agent (ClaudeSDKClient) investigates a simulated incident
   with read-only tools and produces a structured diagnosis + fix proposal.
2. VERIFY — a fresh-context adversarial verifier tries to REFUTE the proposal
   (default-refute, fail-closed verdict parsing). See verifier.py.
3. APPLY — only if the verdict is CONFIRMED, the same ops session applies the
   fix. Every tool call passes through a deterministic keyword tripwire
   (canUseTool callback): dangerous actions require a human "y", and
   non-interactive runs fail closed. See tripwire.py.
"""

import asyncio
import os
import shutil
import sys
import tempfile
from pathlib import Path

from claude_agent_sdk import (
    AssistantMessage,
    ClaudeAgentOptions,
    ClaudeSDKClient,
    HookContext,
    HookMatcher,
    TextBlock,
    ToolUseBlock,
)
from dotenv import load_dotenv

from verified_ops_agent.tripwire import tripwire_gate
from verified_ops_agent.verifier import adversarial_verify

load_dotenv()

SAMPLE_INCIDENT = Path(__file__).parent.parent / "sample_incident"

OPS_SYSTEM = (
    "You are an ops agent handling a production incident. Work only inside the "
    "current directory; it contains the incident evidence (logs, config, notes). "
    "Be precise and cite the specific lines that support your conclusions."
)

INVESTIGATE_PROMPT = (
    "Users report 500s and timeouts on the orders API. Investigate the evidence "
    "in the current directory and produce a proposal in EXACTLY this format:\n\n"
    "DIAGNOSIS: <root cause, one or two sentences, citing evidence>\n"
    "FIX: <the config/code change to make>\n"
    "FOLLOW-UP: <any command that must run afterwards>\n\n"
    "Do NOT change anything yet — investigation only."
)

APPLY_PROMPT = (
    "An independent adversarial verifier CONFIRMED your proposal. Apply the fix "
    "now: make the config change, then run the follow-up command."
)


async def audit_hook(input_data, tool_use_id, context: HookContext):
    """PreToolUse hook: print an audit line for every tool call."""
    tool = input_data.get("tool_name", "?")
    detail = input_data.get("tool_input", {})
    brief = detail.get("command") or detail.get("file_path") or detail.get("pattern") or ""
    print(f"   [audit] {tool} {brief}")
    return {}


def collect_text(message) -> str:
    if isinstance(message, AssistantMessage):
        return "".join(b.text for b in message.content if isinstance(b, TextBlock))
    return ""


async def main() -> int:
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("Error: ANTHROPIC_API_KEY not set. See .env.example.")
        return 1

    # Work on a scratch copy so the demo is repeatable.
    workdir = Path(tempfile.mkdtemp(prefix="verified-ops-")) / "incident"
    shutil.copytree(SAMPLE_INCIDENT, workdir)
    print(f"Incident copied to {workdir}\n")

    options = ClaudeAgentOptions(
        system_prompt=OPS_SYSTEM,
        # Deliberately no allowed_tools: pre-approving a tool would bypass
        # can_use_tool, so EVERY call routes through the tripwire gate instead.
        disallowed_tools=["WebSearch", "WebFetch", "Task"],
        can_use_tool=tripwire_gate,  # deterministic gate on every tool call
        hooks={"PreToolUse": [HookMatcher(matcher=None, hooks=[audit_hook])]},
        setting_sources=[],  # hermetic: don't load user/project settings
        cwd=str(workdir),
        model="sonnet",
        max_turns=30,
    )

    async with ClaudeSDKClient(options=options) as ops:
        # ── Stage 1: PROPOSE ────────────────────────────────────────────
        print("=" * 60)
        print("STAGE 1 — PROPOSE (ops agent investigates, read-only)")
        print("=" * 60)
        await ops.query(INVESTIGATE_PROMPT)
        proposal_parts = []
        async for message in ops.receive_response():
            text = collect_text(message)
            if text:
                proposal_parts.append(text)
        proposal = "\n".join(proposal_parts).strip()
        print(f"\n{proposal}\n")

        # ── Stage 2: VERIFY (fresh context, tries to refute) ────────────
        print("=" * 60)
        print("STAGE 2 — ADVERSARIAL VERIFY (independent, default-refute)")
        print("=" * 60)
        verdict = await adversarial_verify(proposal, incident_dir=str(workdir))
        label = "CONFIRMED ✅" if verdict.confirmed else "REFUTED ❌"
        print(f"\nVerdict: {label}")
        print(f"Reason:  {verdict.reason}\n")

        if not verdict.confirmed:
            print("Proposal refuted — nothing is applied. A human should review.")
            return 2

        # ── Stage 3: APPLY (behind the deterministic tripwire) ──────────
        print("=" * 60)
        print("STAGE 3 — APPLY (tripwire guards every tool call)")
        print("=" * 60)
        await ops.query(APPLY_PROMPT)
        async for message in ops.receive_response():
            text = collect_text(message)
            if text:
                print(text)

    print(f"\nDone. Inspect the result in {workdir}")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))

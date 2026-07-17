"""Adversarial verifier: a fresh-context skeptic that tries to REFUTE the proposal.

Two deliberate design choices, both borrowed from running this pattern in
production multi-agent systems:

1. **Default to refute.** A verifier prompted neutrally ("evaluate this") passes
   almost everything. The burden of proof sits on the proposal: if the verifier
   cannot establish it is correct and supported by the evidence on disk, the
   verdict is REFUTED.
2. **Fail closed.** The verdict is parsed from a strict one-line format. If the
   output does not parse, we treat it as REFUTED — an unparseable verdict must
   never turn into an approval.
"""

import re
from dataclasses import dataclass

from claude_agent_sdk import AssistantMessage, ClaudeAgentOptions, TextBlock, query

VERIFIER_SYSTEM = (
    "You are an adversarial verifier reviewing an ops incident diagnosis. Your job "
    "is to REFUTE the proposal, not to be agreeable. Independently re-examine the "
    "evidence with your own tools: check that the diagnosis matches the logs, that "
    "the proposed fix addresses the root cause, and that it would not make things "
    "worse. The burden of proof is on the proposal: if you cannot establish that it "
    "is correct and well-supported by the files on disk, refute it. When genuinely "
    "uncertain, refute.\n\n"
    "End your reply with EXACTLY one line in this format (nothing after it):\n"
    "VERDICT: CONFIRMED | <one-sentence reason>\n"
    "or\n"
    "VERDICT: REFUTED | <one-sentence reason>"
)

VERDICT_RE = re.compile(r"^VERDICT:\s*(CONFIRMED|REFUTED)\s*\|\s*(.+)$", re.MULTILINE)


@dataclass
class Verdict:
    confirmed: bool
    reason: str


def parse_verdict(text: str) -> Verdict:
    """Deterministic, fail-closed parsing: no match -> REFUTED."""
    matches = VERDICT_RE.findall(text)
    if not matches:
        return Verdict(confirmed=False, reason="unparseable verdict (fail closed)")
    label, reason = matches[-1]  # last verdict line wins
    return Verdict(confirmed=(label == "CONFIRMED"), reason=reason.strip())


async def adversarial_verify(proposal: str, incident_dir: str) -> Verdict:
    """Run a fresh-context, read-only verifier agent over the same evidence."""
    options = ClaudeAgentOptions(
        system_prompt=VERIFIER_SYSTEM,
        allowed_tools=["Read", "Grep", "Glob"],
        disallowed_tools=["WebSearch", "WebFetch", "Task", "Bash", "Edit", "Write"],
        permission_mode="default",  # read-only tools need no approval
        setting_sources=[],  # hermetic: don't load user/project settings
        cwd=incident_dir,
        model="sonnet",
        max_turns=15,
    )
    prompt = (
        "PROPOSAL UNDER REVIEW (from a separate ops agent — you have NO shared "
        f"context with it):\n\n{proposal}\n\n"
        "Try to refute this proposal against the evidence in the current "
        "directory. Then output your verdict line."
    )

    text_parts: list[str] = []
    async for message in query(prompt=prompt, options=options):
        if isinstance(message, AssistantMessage):
            for block in message.content:
                if isinstance(block, TextBlock):
                    text_parts.append(block.text)
    return parse_verdict("\n".join(text_parts))

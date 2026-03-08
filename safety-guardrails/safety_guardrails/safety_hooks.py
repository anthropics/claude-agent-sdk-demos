"""Safety scanning hooks for Claude Agent SDK using Sentinel AI.

These hooks intercept tool calls and agent responses to scan for:
- Prompt injection attempts
- PII (personally identifiable information)
- Harmful or dangerous content
- Toxicity and hate speech
- Hallucination indicators
"""

from datetime import datetime
from sentinel.core import SentinelGuard, RiskLevel


# ANSI color codes for terminal output
RED = "\033[91m"
YELLOW = "\033[93m"
GREEN = "\033[92m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"


def create_guard() -> SentinelGuard:
    """Create a Sentinel guard with safety scanners enabled.

    Returns a guard configured with prompt injection, PII, harmful content,
    toxicity, and hallucination scanners. The block threshold is set to HIGH,
    meaning only high-risk or critical findings will block execution.
    """
    return SentinelGuard.default()


def format_findings(result) -> str:
    """Format scan findings into a readable string for logging."""
    lines = []
    for finding in result.findings:
        risk_color = RED if finding.risk >= RiskLevel.HIGH else YELLOW
        lines.append(
            f"  {risk_color}[{finding.risk.value.upper()}]{RESET} "
            f"{finding.scanner}: {finding.description}"
        )
    return "\n".join(lines)


def log_scan(direction: str, text_preview: str, result) -> None:
    """Log a scan result to the console."""
    preview = text_preview[:80] + "..." if len(text_preview) > 80 else text_preview
    timestamp = datetime.now().strftime("%H:%M:%S")

    if result.blocked:
        print(f"\n{RED}{BOLD}[{timestamp}] BLOCKED {direction}{RESET}")
        print(f"  Text: {preview}")
        print(format_findings(result))
        print(f"  {RED}Latency: {result.latency_ms:.2f}ms{RESET}")
    elif result.findings:
        print(f"\n{YELLOW}[{timestamp}] WARNING {direction}{RESET}")
        print(f"  Text: {preview}")
        print(format_findings(result))
        print(f"  {YELLOW}Latency: {result.latency_ms:.2f}ms{RESET}")
    else:
        print(f"\n{GREEN}[{timestamp}] SAFE {direction}{RESET} ({result.latency_ms:.2f}ms)")


def create_safety_hooks(guard: SentinelGuard) -> dict:
    """Create PreToolUse and PostToolUse hook functions for safety scanning.

    Args:
        guard: A configured SentinelGuard instance.

    Returns:
        A dict with 'pre_tool_use' and 'post_tool_use' async hook functions.
    """

    async def pre_tool_use_hook(hook_input, tool_use_id, context):
        """Scan inputs before tool execution.

        Checks user prompts and tool inputs for prompt injection, PII, and
        harmful content. Blocks execution if high-risk content is detected.
        PII is automatically redacted when found.
        """
        tool_name = hook_input.get("tool_name", "")
        tool_input = hook_input.get("tool_input", {})

        # Extract text content to scan from various tool input formats
        text_to_scan = ""
        if isinstance(tool_input, dict):
            # Check common fields that contain user-provided text
            for field in ("prompt", "query", "content", "command", "text"):
                if field in tool_input:
                    text_to_scan += str(tool_input[field]) + " "

        text_to_scan = text_to_scan.strip()
        if not text_to_scan:
            return {"continue_": True}

        # Run safety scan
        result = guard.scan(text_to_scan)
        log_scan(f"INPUT ({tool_name})", text_to_scan, result)

        # Block if high-risk content detected
        if result.blocked:
            return {
                "decision": "block",
                "reason": (
                    f"Safety scan blocked this input. "
                    f"Risk: {result.risk.value}. "
                    f"Findings: {'; '.join(f.description for f in result.findings)}"
                ),
            }

        # If PII was found and redacted, substitute the redacted text
        if result.redacted_text and isinstance(tool_input, dict):
            for field in ("prompt", "query", "content", "text"):
                if field in tool_input:
                    tool_input[field] = result.redacted_text

        return {"continue_": True}

    async def post_tool_use_hook(hook_input, tool_use_id, context):
        """Scan outputs after tool execution.

        Checks agent responses for harmful content, PII leakage,
        and hallucination indicators before returning to the user.
        """
        tool_response = hook_input.get("tool_response", "")

        # Extract text from response
        if isinstance(tool_response, dict):
            text_to_scan = str(tool_response.get("output", tool_response))
        elif isinstance(tool_response, str):
            text_to_scan = tool_response
        else:
            text_to_scan = str(tool_response)

        if not text_to_scan or len(text_to_scan) < 10:
            return {"continue_": True}

        # Run safety scan on output
        result = guard.scan(text_to_scan)
        log_scan("OUTPUT", text_to_scan, result)

        return {"continue_": True}

    return {
        "pre_tool_use": pre_tool_use_hook,
        "post_tool_use": post_tool_use_hook,
    }

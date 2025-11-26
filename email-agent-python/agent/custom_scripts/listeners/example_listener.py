"""Example listener demonstrating AI-powered email processing."""
from agent.types import Email, ListenerContext, ListenerConfig, ListenerResult

# Listener configuration
config: ListenerConfig = {
    "id": "example_listener",
    "name": "Example AI Email Listener",
    "description": "Demonstrates using AI for intelligent email classification",
    "enabled": False,  # Set to True to enable
    "event": "email_received"
}


async def handler(email: Email, context: ListenerContext) -> ListenerResult:
    """Process incoming emails with AI analysis."""
    actions = []

    # Use AI to analyze email importance
    importance_analysis = await context.callAgent({
        "prompt": f"""Analyze this email for importance and urgency:

From: {email.from_}
Subject: {email.subject}
Body preview: {email.body[:300]}

Determine if this email is important (requires attention) or urgent (time-sensitive).""",
        "schema": {
            "type": "object",
            "properties": {
                "isImportant": {
                    "type": "boolean",
                    "description": "Whether this email requires attention"
                },
                "isUrgent": {
                    "type": "boolean",
                    "description": "Whether this email is time-sensitive"
                },
                "reason": {
                    "type": "string",
                    "description": "Brief explanation of the assessment"
                }
            },
            "required": ["isImportant", "isUrgent", "reason"]
        },
        "model": "haiku"
    })

    # Handle important/urgent emails
    if importance_analysis["isImportant"] or importance_analysis["isUrgent"]:
        priority = "high" if importance_analysis["isUrgent"] else "normal"
        await context.notify(
            f"{'Urgent' if importance_analysis['isUrgent'] else 'Important'} email: {email.subject}",
            {"priority": priority}
        )
        await context.starEmail(email.messageId)
        actions.extend(["starred", "notified"])

        return {
            "executed": True,
            "reason": importance_analysis["reason"],
            "actions": actions
        }

    return {
        "executed": False,
        "reason": "Email did not match any automation criteria"
    }

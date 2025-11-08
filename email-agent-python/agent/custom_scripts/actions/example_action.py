"""Example action for email management."""
from agent.types import ActionTemplate, ActionContext, ActionResult

# Action configuration
config: ActionTemplate = {
    "id": "archive_email",
    "name": "Archive Email",
    "description": "Archive a specific email",
    "icon": "📦",
    "parameterSchema": {
        "type": "object",
        "properties": {
            "emailId": {
                "type": "string",
                "description": "Email message ID to archive"
            }
        },
        "required": ["emailId"]
    }
}


async def handler(params: dict, context: ActionContext) -> ActionResult:
    """Execute the archive action."""
    try:
        email_id = params["emailId"]

        # Archive the email
        await context.db_manager.update_email_folder(email_id, "Archive")

        context.log(f"Archived email: {email_id}")

        return {
            "success": True,
            "message": f"Email archived successfully",
            "refreshInbox": True
        }
    except Exception as e:
        context.log(f"Error archiving email: {str(e)}", "error")
        return {
            "success": False,
            "message": f"Failed to archive email: {str(e)}"
        }

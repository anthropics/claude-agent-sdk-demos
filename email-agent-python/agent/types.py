"""Type definitions for the email agent."""
from typing import Any, Callable, Dict, List, Literal, Optional, TypedDict, Union
from pydantic import BaseModel, Field
from datetime import datetime


class Email(BaseModel):
    """Email message structure."""
    messageId: str
    from_: str = Field(..., alias="from")
    to: str
    subject: str
    body: str
    date: str
    isRead: bool = False
    hasAttachments: bool = False
    labels: Optional[List[str]] = None
    uid: Optional[int] = None

    class Config:
        populate_by_name = True


class ListenerConfig(BaseModel):
    """Listener configuration."""
    id: str
    name: str
    description: str
    enabled: bool = True
    event: Literal["email_received", "email_sent", "email_starred"] = "email_received"


class ListenerResult(BaseModel):
    """Result from listener execution."""
    executed: bool
    reason: str
    actions: Optional[List[str]] = None


class ActionTemplate(BaseModel):
    """Action template configuration."""
    id: str
    name: str
    description: str
    icon: str = "⚡"
    parameterSchema: Dict[str, Any]


class ActionResult(BaseModel):
    """Result from action execution."""
    success: bool
    message: str
    components: Optional[List[Dict[str, Any]]] = None
    refreshInbox: bool = False


class CallAgentOptions(BaseModel):
    """Options for calling an AI agent."""
    prompt: str
    schema: Dict[str, Any]
    model: Literal["opus", "sonnet", "haiku"] = "haiku"


class ListenerContext:
    """Context provided to listener handlers."""

    def __init__(self, db_manager, imap_manager, ui_state_manager, call_agent_fn):
        self.db_manager = db_manager
        self.imap_manager = imap_manager
        self.ui_state_manager = ui_state_manager
        self._call_agent = call_agent_fn

    async def callAgent(self, options: CallAgentOptions) -> Any:
        """Call an AI agent with the given prompt and schema."""
        return await self._call_agent(options)

    async def notify(self, message: str, options: Optional[Dict[str, Any]] = None):
        """Send a notification."""
        priority = options.get("priority", "normal") if options else "normal"
        print(f"📬 [{priority.upper()}] {message}")

    async def archiveEmail(self, email_id: str):
        """Archive an email."""
        await self.db_manager.update_email_folder(email_id, "Archive")

    async def starEmail(self, email_id: str):
        """Star an email."""
        await self.db_manager.update_email_starred(email_id, True)

    async def unstarEmail(self, email_id: str):
        """Unstar an email."""
        await self.db_manager.update_email_starred(email_id, False)

    async def markAsRead(self, email_id: str):
        """Mark email as read."""
        await self.db_manager.update_email_read(email_id, True)

    async def markAsUnread(self, email_id: str):
        """Mark email as unread."""
        await self.db_manager.update_email_read(email_id, False)

    async def addLabel(self, email_id: str, label: str):
        """Add a label to an email."""
        await self.db_manager.add_email_label(email_id, label)

    async def removeLabel(self, email_id: str, label: str):
        """Remove a label from an email."""
        await self.db_manager.remove_email_label(email_id, label)


class ActionContext:
    """Context provided to action handlers."""

    def __init__(self, session_id: str, db_manager, ui_state_manager, call_agent_fn):
        self.sessionId = session_id
        self.db_manager = db_manager
        self.ui_state_manager = ui_state_manager
        self._call_agent = call_agent_fn
        self.uiState = UIStateOperations(ui_state_manager)

    async def callAgent(self, options: CallAgentOptions) -> Any:
        """Call an AI agent with the given prompt and schema."""
        return await self._call_agent(options)

    def log(self, message: str, level: str = "info"):
        """Log a message."""
        prefix = "❌" if level == "error" else "⚠️" if level == "warn" else "ℹ️"
        print(f"{prefix} [Action] {message}")


class UIStateOperations:
    """UI State operations."""

    def __init__(self, ui_state_manager):
        self.manager = ui_state_manager

    async def get(self, state_id: str) -> Optional[Any]:
        """Get UI state."""
        if not self.manager:
            print("⚠️ UIStateManager not available")
            return None
        return await self.manager.get_state(state_id)

    async def set(self, state_id: str, data: Any):
        """Set UI state."""
        if not self.manager:
            print("⚠️ UIStateManager not available")
            return
        await self.manager.set_state(state_id, data)

"""Database models for SMS Response Assistant."""
from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class Contact:
    """Contact information and relationship context."""
    id: Optional[int] = None
    phone_number: str = ""
    name: Optional[str] = None
    relationship: Optional[str] = None  # 'family', 'friend', 'work', 'unknown'
    trust_level: int = 0  # 0-3: unknown, acquaintance, trusted, verified
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


@dataclass
class Message:
    """SMS message with metadata."""
    id: Optional[int] = None
    contact_id: int = 0
    phone_number: str = ""
    message_text: str = ""
    direction: str = ""  # 'incoming' or 'outgoing'
    timestamp: Optional[datetime] = None
    is_auto_reply: bool = False


@dataclass
class ConversationSummary:
    """Summary of recent conversation for dashboard."""
    phone_number: str
    contact_name: Optional[str]
    last_message: str
    timestamp: datetime
    message_count: int
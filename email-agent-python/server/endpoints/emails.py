"""Email endpoints."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from database import EmailDatabase, DATABASE_PATH

router = APIRouter()
db = EmailDatabase(DATABASE_PATH)


class EmailResponse(BaseModel):
    """Email response model."""
    id: str
    messageId: str
    subject: Optional[str]
    from_address: str
    from_name: Optional[str]
    date_sent: str
    snippet: Optional[str]
    is_read: bool
    is_starred: bool
    has_attachments: bool
    folder: str


@router.get("/api/emails/inbox")
async def get_inbox(limit: int = 50, includeRead: bool = True):
    """Get inbox emails."""
    try:
        emails = db.get_recent_emails(limit=limit)

        # Filter by read status if needed
        if not includeRead:
            emails = [e for e in emails if not e.get("is_read")]

        # Format response
        formatted_emails = []
        for email in emails:
            formatted_emails.append({
                "id": email.get("message_id"),
                "messageId": email.get("message_id"),
                "subject": email.get("subject"),
                "from_address": email.get("from_address"),
                "from_name": email.get("from_name"),
                "date_sent": email.get("date_sent"),
                "snippet": email.get("snippet"),
                "is_read": bool(email.get("is_read")),
                "is_starred": bool(email.get("is_starred")),
                "has_attachments": bool(email.get("has_attachments")),
                "folder": email.get("folder", "INBOX"),
            })

        return formatted_emails
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/emails/search")
async def search_emails(query: str, limit: int = 30):
    """Search emails."""
    try:
        emails = db.search_emails(keyword=query, limit=limit)

        formatted_emails = []
        for email in emails:
            formatted_emails.append({
                "id": email.get("message_id"),
                "messageId": email.get("message_id"),
                "subject": email.get("subject"),
                "from_address": email.get("from_address"),
                "from_name": email.get("from_name"),
                "date_sent": email.get("date_sent"),
                "snippet": email.get("snippet"),
                "is_read": bool(email.get("is_read")),
                "is_starred": bool(email.get("is_starred")),
                "has_attachments": bool(email.get("has_attachments")),
                "folder": email.get("folder", "INBOX"),
            })

        return formatted_emails
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/email/{email_id}")
async def get_email_details(email_id: str):
    """Get email details by ID."""
    try:
        email = db.get_email_by_message_id(email_id)

        if not email:
            raise HTTPException(status_code=404, detail="Email not found")

        return {
            "id": email.get("message_id"),
            "messageId": email.get("message_id"),
            "subject": email.get("subject"),
            "from_address": email.get("from_address"),
            "from_name": email.get("from_name"),
            "date_sent": email.get("date_sent"),
            "body_text": email.get("body_text"),
            "body_html": email.get("body_html"),
            "is_read": bool(email.get("is_read")),
            "is_starred": bool(email.get("is_starred")),
            "has_attachments": bool(email.get("has_attachments")),
            "folder": email.get("folder", "INBOX"),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

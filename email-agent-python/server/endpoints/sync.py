"""Sync endpoints."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
from database import EmailSyncService, DATABASE_PATH

router = APIRouter()


class SyncRequest(BaseModel):
    """Sync request model."""
    folder: str = "INBOX"
    limit: int = 50


@router.post("/api/sync")
async def sync_emails(request: SyncRequest):
    """Sync emails from IMAP server."""
    try:
        sync_service = EmailSyncService(DATABASE_PATH)

        # Connect to IMAP
        imap_host = os.getenv("IMAP_HOST", "imap.gmail.com")
        imap_port = int(os.getenv("IMAP_PORT", "993"))
        email_user = os.getenv("EMAIL_USER")
        email_password = os.getenv("EMAIL_PASSWORD")

        if not email_user or not email_password:
            raise HTTPException(
                status_code=400,
                detail="Email credentials not configured. Please set EMAIL_USER and EMAIL_PASSWORD environment variables."
            )

        sync_service.connect_imap(imap_host, imap_port, email_user, email_password)

        # Sync emails
        stats = await sync_service.sync_emails(
            folder=request.folder,
            limit=request.limit
        )

        sync_service.close()

        return {
            "success": True,
            "stats": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/sync/status")
async def get_sync_status():
    """Get sync status."""
    from database import EmailDatabase

    try:
        db = EmailDatabase(DATABASE_PATH)
        stats = db.get_statistics()
        db.close()

        return {
            "total_emails": stats.get("total_emails", 0),
            "unread_count": stats.get("unread_count", 0),
            "last_sync": None  # TODO: Track last sync time
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

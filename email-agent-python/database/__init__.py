"""Database module."""
from .email_db import EmailDatabase
from .email_sync import EmailSyncService
from .config import DATABASE_PATH

__all__ = ["EmailDatabase", "EmailSyncService", "DATABASE_PATH"]

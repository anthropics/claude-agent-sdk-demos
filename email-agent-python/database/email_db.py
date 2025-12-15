"""Email database using SQLite and SQLAlchemy."""
import sqlite3
from datetime import datetime
from typing import Any, Dict, List, Optional
from pathlib import Path

from .config import DATABASE_PATH


class EmailDatabase:
    """Email database manager using SQLite."""

    def __init__(self, db_path: str = DATABASE_PATH):
        self.db_path = db_path
        self.conn: Optional[sqlite3.Connection] = None
        self._initialize_database()

    def _initialize_database(self):
        """Initialize database connection and create tables."""
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row  # Enable column access by name
        self.conn.execute("PRAGMA journal_mode = WAL")
        self.conn.execute("PRAGMA foreign_keys = ON")

        # Create tables
        self._create_tables()
        self._create_indexes()
        self._create_fts_table()
        self._create_triggers()

    def _create_tables(self):
        """Create database tables."""
        # Emails table
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS emails (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                message_id TEXT UNIQUE NOT NULL,
                thread_id TEXT,
                in_reply_to TEXT,
                email_references TEXT,
                date_sent DATETIME NOT NULL,
                date_received DATETIME DEFAULT CURRENT_TIMESTAMP,
                subject TEXT,
                from_address TEXT NOT NULL,
                from_name TEXT,
                reply_to TEXT,
                body_text TEXT,
                body_html TEXT,
                snippet TEXT,
                is_read BOOLEAN DEFAULT 0,
                is_starred BOOLEAN DEFAULT 0,
                is_important BOOLEAN DEFAULT 0,
                is_draft BOOLEAN DEFAULT 0,
                is_sent BOOLEAN DEFAULT 0,
                is_trash BOOLEAN DEFAULT 0,
                is_spam BOOLEAN DEFAULT 0,
                size_bytes INTEGER DEFAULT 0,
                has_attachments BOOLEAN DEFAULT 0,
                attachment_count INTEGER DEFAULT 0,
                folder TEXT DEFAULT 'INBOX',
                labels TEXT,
                raw_headers TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Recipients table
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS recipients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email_id INTEGER NOT NULL,
                type TEXT CHECK(type IN ('to', 'cc', 'bcc')) NOT NULL,
                address TEXT NOT NULL,
                name TEXT,
                domain TEXT GENERATED ALWAYS AS (
                    LOWER(SUBSTR(address, INSTR(address, '@') + 1))
                ) STORED,
                FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE
            )
        """)

        # Attachments table
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS attachments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email_id INTEGER NOT NULL,
                filename TEXT NOT NULL,
                content_type TEXT,
                size_bytes INTEGER,
                content_id TEXT,
                is_inline BOOLEAN DEFAULT 0,
                file_extension TEXT GENERATED ALWAYS AS (
                    LOWER(SUBSTR(filename, INSTR(filename, '.') + 1))
                ) STORED,
                FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE
            )
        """)

        self.conn.commit()

    def _create_indexes(self):
        """Create database indexes."""
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_emails_date_sent ON emails(date_sent DESC)",
            "CREATE INDEX IF NOT EXISTS idx_emails_from_address ON emails(from_address)",
            "CREATE INDEX IF NOT EXISTS idx_emails_thread_id ON emails(thread_id)",
            "CREATE INDEX IF NOT EXISTS idx_emails_message_id ON emails(message_id)",
            "CREATE INDEX IF NOT EXISTS idx_emails_is_read ON emails(is_read)",
            "CREATE INDEX IF NOT EXISTS idx_emails_is_starred ON emails(is_starred)",
            "CREATE INDEX IF NOT EXISTS idx_emails_folder ON emails(folder)",
            "CREATE INDEX IF NOT EXISTS idx_emails_has_attachments ON emails(has_attachments)",
            "CREATE INDEX IF NOT EXISTS idx_recipients_email_id ON recipients(email_id)",
            "CREATE INDEX IF NOT EXISTS idx_recipients_address ON recipients(address)",
            "CREATE INDEX IF NOT EXISTS idx_recipients_domain ON recipients(domain)",
            "CREATE INDEX IF NOT EXISTS idx_recipients_type ON recipients(type)",
            "CREATE INDEX IF NOT EXISTS idx_attachments_email_id ON attachments(email_id)",
            "CREATE INDEX IF NOT EXISTS idx_attachments_extension ON attachments(file_extension)",
        ]

        for index in indexes:
            self.conn.execute(index)

        self.conn.commit()

    def _create_fts_table(self):
        """Create full-text search table."""
        self.conn.execute("""
            CREATE VIRTUAL TABLE IF NOT EXISTS emails_fts USING fts5(
                message_id UNINDEXED,
                subject,
                from_address,
                from_name,
                body_text,
                recipient_addresses,
                attachment_names,
                tokenize = 'porter unicode61'
            )
        """)
        self.conn.commit()

    def _create_triggers(self):
        """Create database triggers for FTS sync."""
        # Insert trigger
        self.conn.execute("""
            CREATE TRIGGER IF NOT EXISTS emails_fts_insert
            AFTER INSERT ON emails
            BEGIN
                INSERT INTO emails_fts(message_id, subject, from_address, from_name, body_text)
                VALUES (NEW.message_id, NEW.subject, NEW.from_address, NEW.from_name, NEW.body_text);
            END
        """)

        # Update trigger
        self.conn.execute("""
            CREATE TRIGGER IF NOT EXISTS emails_fts_update
            AFTER UPDATE ON emails
            BEGIN
                UPDATE emails_fts
                SET subject = NEW.subject,
                    from_address = NEW.from_address,
                    from_name = NEW.from_name,
                    body_text = NEW.body_text
                WHERE message_id = NEW.message_id;
            END
        """)

        # Delete trigger
        self.conn.execute("""
            CREATE TRIGGER IF NOT EXISTS emails_fts_delete
            AFTER DELETE ON emails
            BEGIN
                DELETE FROM emails_fts WHERE message_id = OLD.message_id;
            END
        """)

        self.conn.commit()

    def insert_email(
        self,
        email: Dict[str, Any],
        recipients: List[Dict[str, Any]] = None,
        attachments: List[Dict[str, Any]] = None,
    ) -> int:
        """Insert email with recipients and attachments."""
        recipients = recipients or []
        attachments = attachments or []

        cursor = self.conn.cursor()

        # Insert email
        cursor.execute("""
            INSERT INTO emails (
                message_id, thread_id, in_reply_to, email_references,
                date_sent, date_received, subject, from_address, from_name,
                reply_to, body_text, body_html, snippet,
                is_read, is_starred, is_important, is_draft, is_sent,
                is_trash, is_spam, size_bytes, has_attachments,
                attachment_count, folder, labels, raw_headers
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
        """, (
            email.get("message_id"),
            email.get("thread_id"),
            email.get("in_reply_to"),
            email.get("email_references"),
            email.get("date_sent"),
            email.get("date_received", datetime.now().isoformat()),
            email.get("subject"),
            email.get("from_address"),
            email.get("from_name"),
            email.get("reply_to"),
            email.get("body_text"),
            email.get("body_html"),
            email.get("snippet"),
            1 if email.get("is_read") else 0,
            1 if email.get("is_starred") else 0,
            1 if email.get("is_important") else 0,
            1 if email.get("is_draft") else 0,
            1 if email.get("is_sent") else 0,
            1 if email.get("is_trash") else 0,
            1 if email.get("is_spam") else 0,
            email.get("size_bytes", 0),
            1 if len(attachments) > 0 else 0,
            len(attachments),
            email.get("folder", "INBOX"),
            email.get("labels"),
            email.get("raw_headers"),
        ))

        email_id = cursor.lastrowid

        # Insert recipients
        for recipient in recipients:
            cursor.execute("""
                INSERT INTO recipients (email_id, type, address, name)
                VALUES (?, ?, ?, ?)
            """, (
                email_id,
                recipient.get("type"),
                recipient.get("address"),
                recipient.get("name"),
            ))

        # Insert attachments
        for attachment in attachments:
            cursor.execute("""
                INSERT INTO attachments (
                    email_id, filename, content_type, size_bytes, content_id, is_inline
                ) VALUES (?, ?, ?, ?, ?, ?)
            """, (
                email_id,
                attachment.get("filename"),
                attachment.get("content_type"),
                attachment.get("size_bytes", 0),
                attachment.get("content_id"),
                1 if attachment.get("is_inline") else 0,
            ))

        # Update FTS with recipient and attachment info
        recipient_addresses = " ".join([r.get("address", "") for r in recipients])
        attachment_names = " ".join([a.get("filename", "") for a in attachments])

        cursor.execute("""
            UPDATE emails_fts
            SET recipient_addresses = ?, attachment_names = ?
            WHERE message_id = ?
        """, (recipient_addresses, attachment_names, email.get("message_id")))

        self.conn.commit()
        return email_id

    def get_recent_emails(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get most recent emails."""
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT e.*,
                GROUP_CONCAT(CASE WHEN r.type = 'to' THEN r.address END) as to_addresses,
                GROUP_CONCAT(CASE WHEN r.type = 'cc' THEN r.address END) as cc_addresses,
                GROUP_CONCAT(CASE WHEN r.type = 'bcc' THEN r.address END) as bcc_addresses
            FROM emails e
            LEFT JOIN recipients r ON e.id = r.email_id
            GROUP BY e.id
            ORDER BY e.date_sent DESC
            LIMIT ?
        """, (limit,))

        return [dict(row) for row in cursor.fetchall()]

    def search_emails(self, keyword: str, limit: int = 30) -> List[Dict[str, Any]]:
        """Full-text search emails."""
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT e.* FROM emails e
            JOIN emails_fts fts ON e.message_id = fts.message_id
            WHERE emails_fts MATCH ?
            ORDER BY e.date_sent DESC
            LIMIT ?
        """, (keyword, limit))

        return [dict(row) for row in cursor.fetchall()]

    def get_email_by_message_id(self, message_id: str) -> Optional[Dict[str, Any]]:
        """Get email by message ID."""
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM emails WHERE message_id = ?", (message_id,))
        row = cursor.fetchone()
        return dict(row) if row else None

    def update_email_read(self, message_id: str, is_read: bool):
        """Update email read status."""
        cursor = self.conn.cursor()
        cursor.execute(
            "UPDATE emails SET is_read = ? WHERE message_id = ?",
            (1 if is_read else 0, message_id)
        )
        self.conn.commit()

    def update_email_starred(self, message_id: str, is_starred: bool):
        """Update email starred status."""
        cursor = self.conn.cursor()
        cursor.execute(
            "UPDATE emails SET is_starred = ? WHERE message_id = ?",
            (1 if is_starred else 0, message_id)
        )
        self.conn.commit()

    def update_email_folder(self, message_id: str, folder: str):
        """Update email folder."""
        cursor = self.conn.cursor()
        cursor.execute(
            "UPDATE emails SET folder = ? WHERE message_id = ?",
            (folder, message_id)
        )
        self.conn.commit()

    def get_statistics(self) -> Dict[str, Any]:
        """Get email statistics."""
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT
                COUNT(*) as total_emails,
                SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread_count,
                SUM(CASE WHEN is_starred = 1 THEN 1 ELSE 0 END) as starred_count,
                SUM(CASE WHEN has_attachments = 1 THEN 1 ELSE 0 END) as with_attachments,
                COUNT(DISTINCT thread_id) as thread_count,
                COUNT(DISTINCT from_address) as unique_senders,
                AVG(size_bytes) as avg_size_bytes,
                MIN(date_sent) as oldest_email,
                MAX(date_sent) as newest_email
            FROM emails
        """)

        row = cursor.fetchone()
        return dict(row) if row else {}

    def close(self):
        """Close database connection."""
        if self.conn:
            self.conn.close()

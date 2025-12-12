"""Database operations for SMS Response Assistant."""
import sqlite3
import os
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Tuple

from .models import Contact, Message, ConversationSummary


class SMSDatabase:
    """SQLite database manager for SMS conversations."""

    def __init__(self, db_path: str = "sms_agent.db"):
        """Initialize database connection and create tables."""
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row  # Enable dict-like access
        self._initialize_database()

    def _initialize_database(self):
        """Create tables from schema file."""
        schema_path = Path(__file__).parent / "schema.sql"
        with open(schema_path, 'r') as f:
            schema = f.read()
        self.conn.executescript(schema)
        self.conn.commit()

    def get_or_create_contact(self, phone_number: str) -> Contact:
        """Get existing contact or create new one."""
        cursor = self.conn.cursor()

        # Try to get existing contact
        cursor.execute(
            "SELECT * FROM contacts WHERE phone_number = ?",
            (phone_number,)
        )
        row = cursor.fetchone()

        if row:
            return Contact(
                id=row['id'],
                phone_number=row['phone_number'],
                name=row['name'],
                relationship=row['relationship'],
                trust_level=row['trust_level'],
                created_at=datetime.fromisoformat(row['created_at']) if row['created_at'] else None,
                updated_at=datetime.fromisoformat(row['updated_at']) if row['updated_at'] else None
            )

        # Create new contact
        cursor.execute(
            """INSERT INTO contacts (phone_number, relationship, trust_level)
               VALUES (?, 'unknown', 0)""",
            (phone_number,)
        )
        contact_id = cursor.lastrowid
        self.conn.commit()

        return Contact(
            id=contact_id,
            phone_number=phone_number,
            relationship='unknown',
            trust_level=0,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )

    def update_contact(self, phone_number: str, **updates) -> None:
        """Update contact information."""
        if not updates:
            return

        # Build dynamic update query
        fields = []
        values = []
        for key, value in updates.items():
            if key not in ['id', 'phone_number', 'created_at']:
                fields.append(f"{key} = ?")
                values.append(value)

        if fields:
            fields.append("updated_at = CURRENT_TIMESTAMP")
            query = f"UPDATE contacts SET {', '.join(fields)} WHERE phone_number = ?"
            values.append(phone_number)

            cursor = self.conn.cursor()
            cursor.execute(query, values)
            self.conn.commit()

    def save_message(self, message: Message) -> int:
        """Save message to database and return message ID."""
        cursor = self.conn.cursor()
        cursor.execute(
            """INSERT INTO messages
               (contact_id, phone_number, message_text, direction, is_auto_reply)
               VALUES (?, ?, ?, ?, ?)""",
            (
                message.contact_id,
                message.phone_number,
                message.message_text,
                message.direction,
                message.is_auto_reply
            )
        )
        message_id = cursor.lastrowid
        self.conn.commit()
        return message_id

    def get_conversation_history(self, phone_number: str, limit: int = 10) -> List[Message]:
        """Get recent conversation history for a phone number."""
        cursor = self.conn.cursor()
        cursor.execute(
            """SELECT * FROM messages
               WHERE phone_number = ?
               ORDER BY timestamp DESC
               LIMIT ?""",
            (phone_number, limit)
        )

        messages = []
        for row in cursor.fetchall():
            messages.append(Message(
                id=row['id'],
                contact_id=row['contact_id'],
                phone_number=row['phone_number'],
                message_text=row['message_text'],
                direction=row['direction'],
                timestamp=datetime.fromisoformat(row['timestamp']) if row['timestamp'] else None,
                is_auto_reply=bool(row['is_auto_reply'])
            ))

        return messages

    def get_recent_conversations(self, limit: int = 5) -> List[ConversationSummary]:
        """Get recent conversations for dashboard."""
        cursor = self.conn.cursor()
        cursor.execute(
            """SELECT
                m.phone_number,
                c.name as contact_name,
                m.message_text as last_message,
                m.timestamp,
                COUNT(m2.id) as message_count
               FROM messages m
               LEFT JOIN contacts c ON m.phone_number = c.phone_number
               LEFT JOIN messages m2 ON m2.phone_number = m.phone_number
               WHERE m.timestamp = (
                   SELECT MAX(timestamp)
                   FROM messages m3
                   WHERE m3.phone_number = m.phone_number
               )
               GROUP BY m.phone_number
               ORDER BY m.timestamp DESC
               LIMIT ?""",
            (limit,)
        )

        conversations = []
        for row in cursor.fetchall():
            conversations.append(ConversationSummary(
                phone_number=row['phone_number'],
                contact_name=row['contact_name'],
                last_message=row['last_message'],
                timestamp=datetime.fromisoformat(row['timestamp']),
                message_count=row['message_count']
            ))

        return conversations

    def get_stats(self) -> dict:
        """Get database statistics."""
        cursor = self.conn.cursor()

        cursor.execute("SELECT COUNT(*) as count FROM contacts")
        contact_count = cursor.fetchone()['count']

        cursor.execute("SELECT COUNT(*) as count FROM messages")
        message_count = cursor.fetchone()['count']

        cursor.execute(
            "SELECT COUNT(*) as count FROM messages WHERE is_auto_reply = 1"
        )
        auto_reply_count = cursor.fetchone()['count']

        return {
            'total_contacts': contact_count,
            'total_messages': message_count,
            'auto_replies_sent': auto_reply_count
        }

    def close(self):
        """Close database connection."""
        if self.conn:
            self.conn.close()
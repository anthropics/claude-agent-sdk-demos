"""Email synchronization service."""
import asyncio
import email
from email.parser import BytesParser
from email.policy import default
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
import imaplib
import re

from .email_db import EmailDatabase
from .config import DATABASE_PATH


class EmailSyncService:
    """Email synchronization service using IMAP."""

    def __init__(self, db_path: str = DATABASE_PATH, listeners_manager=None):
        self.database = EmailDatabase(db_path)
        self.listeners_manager = listeners_manager
        self.imap_conn: Optional[imaplib.IMAP4_SSL] = None

    def connect_imap(self, host: str, port: int, username: str, password: str):
        """Connect to IMAP server."""
        self.imap_conn = imaplib.IMAP4_SSL(host, port)
        self.imap_conn.login(username, password)

    def disconnect_imap(self):
        """Disconnect from IMAP server."""
        if self.imap_conn:
            try:
                self.imap_conn.logout()
            except:
                pass
            self.imap_conn = None

    def _parse_email_address(self, address_string: str) -> List[Dict[str, str]]:
        """Parse email addresses from string."""
        if not address_string:
            return []

        addresses = []
        parts = [s.strip() for s in address_string.split(",")]

        for part in parts:
            match = re.match(r'^(.+?)\s*<(.+?)>$', part)
            if match:
                addresses.append({
                    "name": match.group(1).strip(),
                    "address": match.group(2).lower()
                })
            elif "@" in part:
                addresses.append({"address": part.lower()})

        return addresses

    def _extract_recipients(self, msg: email.message.EmailMessage) -> List[Dict[str, Any]]:
        """Extract recipients from email message."""
        recipients = []

        # TO recipients
        to_addresses = msg.get_all("To", [])
        for to_addr in to_addresses:
            parsed = self._parse_email_address(to_addr)
            for addr in parsed:
                recipients.append({
                    "type": "to",
                    "address": addr.get("address", ""),
                    "name": addr.get("name")
                })

        # CC recipients
        cc_addresses = msg.get_all("Cc", [])
        for cc_addr in cc_addresses:
            parsed = self._parse_email_address(cc_addr)
            for addr in parsed:
                recipients.append({
                    "type": "cc",
                    "address": addr.get("address", ""),
                    "name": addr.get("name")
                })

        # BCC recipients (rarely available)
        bcc_addresses = msg.get_all("Bcc", [])
        for bcc_addr in bcc_addresses:
            parsed = self._parse_email_address(bcc_addr)
            for addr in parsed:
                recipients.append({
                    "type": "bcc",
                    "address": addr.get("address", ""),
                    "name": addr.get("name")
                })

        return recipients

    def _extract_attachments(self, msg: email.message.EmailMessage) -> List[Dict[str, Any]]:
        """Extract attachments from email message."""
        attachments = []

        for part in msg.walk():
            if part.get_content_maintype() == "multipart":
                continue

            if part.get("Content-Disposition") is None:
                continue

            filename = part.get_filename()
            if filename:
                attachments.append({
                    "filename": filename,
                    "content_type": part.get_content_type(),
                    "size_bytes": len(part.get_payload(decode=True) or b""),
                    "content_id": part.get("Content-ID"),
                    "is_inline": part.get("Content-Disposition", "").startswith("inline")
                })

        return attachments

    async def sync_emails(
        self,
        folder: str = "INBOX",
        since_date: Optional[datetime] = None,
        limit: Optional[int] = None
    ) -> Dict[str, int]:
        """Sync emails from IMAP to database."""
        stats = {"synced": 0, "skipped": 0, "errors": 0}

        if not self.imap_conn:
            raise Exception("Not connected to IMAP server")

        try:
            # Select folder
            self.imap_conn.select(folder)

            # Build search criteria
            if since_date:
                search_date = since_date.strftime("%d-%b-%Y")
                typ, data = self.imap_conn.search(None, f'(SINCE {search_date})')
            else:
                # Default to last 30 days
                since_date = datetime.now() - timedelta(days=30)
                search_date = since_date.strftime("%d-%b-%Y")
                typ, data = self.imap_conn.search(None, f'(SINCE {search_date})')

            email_ids = data[0].split()

            if limit:
                email_ids = email_ids[:limit]

            print(f"📧 Found {len(email_ids)} emails to process")

            for email_id in email_ids:
                try:
                    # Fetch email
                    typ, msg_data = self.imap_conn.fetch(email_id, "(RFC822)")
                    raw_email = msg_data[0][1]

                    # Parse email
                    msg = BytesParser(policy=default).parsebytes(raw_email)

                    message_id = msg.get("Message-ID", f"{email_id}-{datetime.now().timestamp()}")

                    # Check if already exists
                    existing = self.database.get_email_by_message_id(message_id)
                    if existing:
                        stats["skipped"] += 1
                        continue

                    # Extract from address
                    from_addr = self._parse_email_address(msg.get("From", ""))
                    from_address = from_addr[0].get("address", "unknown@unknown.com") if from_addr else "unknown@unknown.com"
                    from_name = from_addr[0].get("name") if from_addr else None

                    # Get email body
                    body_text = ""
                    body_html = ""
                    if msg.is_multipart():
                        for part in msg.walk():
                            content_type = part.get_content_type()
                            if content_type == "text/plain":
                                body_text = part.get_payload(decode=True).decode("utf-8", errors="ignore")
                            elif content_type == "text/html":
                                body_html = part.get_payload(decode=True).decode("utf-8", errors="ignore")
                    else:
                        body_text = msg.get_payload(decode=True).decode("utf-8", errors="ignore")

                    # Extract recipients and attachments
                    recipients = self._extract_recipients(msg)
                    attachments = self._extract_attachments(msg)

                    # Create email record
                    email_date = email.utils.parsedate_to_datetime(msg.get("Date", ""))
                    email_record = {
                        "message_id": message_id,
                        "thread_id": msg.get("Thread-Topic"),
                        "in_reply_to": msg.get("In-Reply-To"),
                        "email_references": msg.get("References"),
                        "date_sent": email_date.isoformat() if email_date else datetime.now().isoformat(),
                        "subject": msg.get("Subject", ""),
                        "from_address": from_address,
                        "from_name": from_name,
                        "reply_to": msg.get("Reply-To"),
                        "body_text": body_text,
                        "body_html": body_html,
                        "snippet": body_text[:200] if body_text else "",
                        "is_read": False,
                        "folder": folder,
                        "has_attachments": len(attachments) > 0,
                        "attachment_count": len(attachments),
                    }

                    # Insert into database
                    self.database.insert_email(email_record, recipients, attachments)
                    stats["synced"] += 1

                    # Trigger listeners
                    if self.listeners_manager:
                        email_for_listener = {
                            "messageId": message_id,
                            "from": from_address,
                            "to": ", ".join([r["address"] for r in recipients if r["type"] == "to"]),
                            "subject": msg.get("Subject", ""),
                            "body": body_text,
                            "date": email_date.isoformat() if email_date else datetime.now().isoformat(),
                            "isRead": False,
                            "hasAttachments": len(attachments) > 0,
                        }
                        await self.listeners_manager.check_event("email_received", email_for_listener)

                except Exception as e:
                    print(f"Error processing email {email_id}: {e}")
                    stats["errors"] += 1

            print(f"✅ Sync complete: {stats['synced']} synced, {stats['skipped']} skipped, {stats['errors']} errors")

        except Exception as e:
            print(f"Sync error: {e}")
            raise

        return stats

    def close(self):
        """Close connections."""
        self.disconnect_imap()
        self.database.close()

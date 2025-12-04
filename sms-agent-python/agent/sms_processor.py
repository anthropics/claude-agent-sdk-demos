"""SMS processing logic that coordinates database, AI, and SMS sending."""
import asyncio
from datetime import datetime
from typing import Callable, Optional, Dict, Any
import logging

from database.db import SMSDatabase
from database.models import Contact, Message
from .sms_agent import SMSAgent, SMSContext

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class IncomingSMS:
    """Incoming SMS message data."""

    def __init__(self, from_number: str, body: str, timestamp: Optional[datetime] = None):
        self.from_number = from_number
        self.body = body
        self.timestamp = timestamp or datetime.now()


class OutgoingSMS:
    """Outgoing SMS message data."""

    def __init__(self, to_number: str, body: str):
        self.to_number = to_number
        self.body = body


class SMSProcessor:
    """Main SMS processing coordinator."""

    def __init__(
        self,
        database: SMSDatabase,
        send_sms_callback: Optional[Callable[[OutgoingSMS], None]] = None
    ):
        self.db = database
        self.agent = SMSAgent()
        self.send_sms_callback = send_sms_callback

    async def process_incoming_sms(self, sms: IncomingSMS) -> Dict[str, Any]:
        """
        Process an incoming SMS message.

        Returns:
            Dict with processing results including whether auto-reply was sent.
        """
        logger.info(f"Processing SMS from {sms.from_number}: {sms.body}")

        try:
            # Get or create contact
            contact = self.db.get_or_create_contact(sms.from_number)

            # Save incoming message
            incoming_message = Message(
                contact_id=contact.id,
                phone_number=sms.from_number,
                message_text=sms.body,
                direction='incoming',
                is_auto_reply=False
            )
            message_id = self.db.save_message(incoming_message)

            # Get conversation history
            conversation_history = self.db.get_conversation_history(sms.from_number, 10)

            # Create context for AI
            context = SMSContext(
                contact=contact,
                conversation_history=conversation_history,
                incoming_message=sms.body
            )

            # Check if we should auto-reply
            should_reply = await self.agent.should_auto_reply(context)

            result = {
                'message_id': message_id,
                'contact_id': contact.id,
                'auto_reply_sent': False,
                'response_text': None,
                'should_reply': should_reply
            }

            if should_reply:
                # Generate response
                response_text = await self.agent.generate_response(context)

                # Send response if callback is provided
                if self.send_sms_callback and response_text:
                    outgoing_sms = OutgoingSMS(sms.from_number, response_text)
                    await self._send_sms_safely(outgoing_sms)

                    # Save outgoing message
                    outgoing_message = Message(
                        contact_id=contact.id,
                        phone_number=sms.from_number,
                        message_text=response_text,
                        direction='outgoing',
                        is_auto_reply=True
                    )
                    self.db.save_message(outgoing_message)

                    result['auto_reply_sent'] = True
                    result['response_text'] = response_text

                    logger.info(f"Auto-reply sent to {sms.from_number}: {response_text}")
                else:
                    logger.info(f"Would send to {sms.from_number}: {response_text}")
                    result['response_text'] = response_text

            else:
                logger.info(f"No auto-reply for {sms.from_number} - requires human attention")

            # Try to improve contact information
            await self._update_contact_info(context)

            return result

        except Exception as error:
            logger.error(f"Error processing SMS from {sms.from_number}: {error}")
            return {
                'error': str(error),
                'auto_reply_sent': False
            }

    async def send_manual_sms(self, to_number: str, message: str) -> Dict[str, Any]:
        """Send a manual SMS message (human-initiated)."""
        try:
            # Get or create contact
            contact = self.db.get_or_create_contact(to_number)

            # Send the message
            if self.send_sms_callback:
                outgoing_sms = OutgoingSMS(to_number, message)
                await self._send_sms_safely(outgoing_sms)

                # Save to database
                outgoing_message = Message(
                    contact_id=contact.id,
                    phone_number=to_number,
                    message_text=message,
                    direction='outgoing',
                    is_auto_reply=False
                )
                message_id = self.db.save_message(outgoing_message)

                logger.info(f"Manual SMS sent to {to_number}: {message}")

                return {
                    'success': True,
                    'message_id': message_id,
                    'contact_id': contact.id
                }
            else:
                return {
                    'success': False,
                    'error': 'No SMS sending callback configured'
                }

        except Exception as error:
            logger.error(f"Error sending manual SMS to {to_number}: {error}")
            return {
                'success': False,
                'error': str(error)
            }

    async def _send_sms_safely(self, sms: OutgoingSMS) -> None:
        """Send SMS with error handling."""
        try:
            if asyncio.iscoroutinefunction(self.send_sms_callback):
                await self.send_sms_callback(sms)
            else:
                self.send_sms_callback(sms)
        except Exception as error:
            logger.error(f"Error sending SMS to {sms.to_number}: {error}")
            raise

    async def _update_contact_info(self, context: SMSContext) -> None:
        """Update contact information using AI insights."""
        try:
            # Only try to classify if relationship is unknown and we have enough history
            if (context.contact.relationship == 'unknown' and
                len(context.conversation_history) >= 3):

                relationship = await self.agent.classify_relationship(context)
                if relationship and relationship != 'unknown':
                    self.db.update_contact(
                        context.contact.phone_number,
                        relationship=relationship
                    )
                    logger.info(
                        f"Updated relationship for {context.contact.phone_number}: {relationship}"
                    )

        except Exception as error:
            logger.error(f"Error updating contact info: {error}")

    def get_dashboard_data(self) -> Dict[str, Any]:
        """Get data for SMS dashboard."""
        try:
            recent_conversations = self.db.get_recent_conversations(10)
            stats = self.db.get_stats()

            return {
                'recent_conversations': [
                    {
                        'phone_number': conv.phone_number,
                        'contact_name': conv.contact_name,
                        'last_message': conv.last_message,
                        'timestamp': conv.timestamp.isoformat(),
                        'message_count': conv.message_count
                    }
                    for conv in recent_conversations
                ],
                'stats': stats
            }

        except Exception as error:
            logger.error(f"Error getting dashboard data: {error}")
            return {
                'error': str(error),
                'recent_conversations': [],
                'stats': {}
            }

    def get_conversation(self, phone_number: str, limit: int = 20) -> Dict[str, Any]:
        """Get conversation history for a specific phone number."""
        try:
            contact = self.db.get_or_create_contact(phone_number)
            messages = self.db.get_conversation_history(phone_number, limit)

            return {
                'contact': {
                    'id': contact.id,
                    'phone_number': contact.phone_number,
                    'name': contact.name,
                    'relationship': contact.relationship,
                    'trust_level': contact.trust_level
                },
                'messages': [
                    {
                        'id': msg.id,
                        'text': msg.message_text,
                        'direction': msg.direction,
                        'timestamp': msg.timestamp.isoformat() if msg.timestamp else None,
                        'is_auto_reply': msg.is_auto_reply
                    }
                    for msg in messages
                ]
            }

        except Exception as error:
            logger.error(f"Error getting conversation for {phone_number}: {error}")
            return {
                'error': str(error),
                'contact': None,
                'messages': []
            }
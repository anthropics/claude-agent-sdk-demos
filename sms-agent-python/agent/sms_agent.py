"""SMS Response Agent using Claude Code SDK."""
import asyncio
from typing import List, Optional
import anyio
from claude_code_sdk import query, ClaudeCodeOptions

from database.models import Contact, Message


class SMSContext:
    """Context for SMS response generation."""

    def __init__(
        self,
        contact: Contact,
        conversation_history: List[Message],
        incoming_message: str
    ):
        self.contact = contact
        self.conversation_history = conversation_history
        self.incoming_message = incoming_message


class SMSAgent:
    """Claude-powered SMS response generator."""

    def __init__(self):
        self.system_prompt = """You are an SMS response assistant. Your job is to generate appropriate text message responses based on:

1. The incoming message content
2. The conversation history with this contact
3. The relationship context (family, friend, work, unknown)
4. The trust level of the contact (0=unknown, 1=acquaintance, 2=trusted, 3=verified)

Guidelines:
- Keep responses concise and natural for SMS format (under 160 characters when possible)
- Match the tone and formality level of the conversation
- For unknown contacts (trust_level 0), be polite but cautious about sharing personal information
- For trusted contacts (trust_level 2+), you can be more casual and share appropriate personal updates
- If someone asks for personal information and they're not verified (trust_level < 3), politely decline
- Always be helpful and friendly
- Use natural language and avoid overly formal responses
- Don't use emojis unless the conversation style suggests they're appropriate

Respond with ONLY the SMS message text. Do not include any explanations, quotes, or formatting."""

    async def generate_response(self, context: SMSContext) -> str:
        """Generate SMS response using Claude."""
        try:
            # Build conversation context
            conversation_text = self._build_conversation_context(context)

            # Prepare the prompt
            prompt = f"""
Contact Information:
- Name: {context.contact.name or 'Unknown'}
- Phone: {context.contact.phone_number}
- Relationship: {context.contact.relationship or 'unknown'}
- Trust Level: {context.contact.trust_level}/3

Recent Conversation:
{conversation_text}

New Incoming Message: "{context.incoming_message}"

Generate an appropriate SMS response:"""

            # Configure Claude options
            options = ClaudeCodeOptions(
                max_turns=1,
                model="claude-3-5-sonnet-20241022",
                append_system_prompt=self.system_prompt,
                allowed_tools=[]  # No tools needed for simple text generation
            )

            # Get response from Claude
            messages = []
            async for message in query(prompt=prompt, options=options):
                messages.append(message)

            # Extract the response text
            response = self._extract_response_text(messages)
            return response or "Thanks for your message! I'll get back to you soon."

        except Exception as error:
            print(f"Error generating SMS response: {error}")
            return "Thanks for your message! I'll get back to you soon."

    def _build_conversation_context(self, context: SMSContext) -> str:
        """Build conversation context from message history."""
        if not context.conversation_history:
            return "No previous conversation history."

        # Get last 5 messages for context, in chronological order
        recent_messages = context.conversation_history[:5]
        recent_messages.reverse()  # Chronological order

        conversation_lines = []
        for msg in recent_messages:
            sender = "You" if msg.direction == "outgoing" else (context.contact.name or "Them")
            conversation_lines.append(f"{sender}: {msg.message_text}")

        return "\n".join(conversation_lines)

    def _extract_response_text(self, messages: List) -> Optional[str]:
        """Extract response text from Claude messages."""
        # Find the last assistant message
        for message in reversed(messages):
            if hasattr(message, 'type') and message.type == 'assistant':
                content = message.message.content
                if isinstance(content, str):
                    return content.strip()
                elif isinstance(content, list):
                    # Handle content blocks
                    for block in content:
                        if hasattr(block, 'type') and block.type == 'text':
                            return block.text.strip()
        return None

    async def should_auto_reply(self, context: SMSContext) -> bool:
        """Determine if we should automatically reply to this message."""
        message = context.incoming_message.lower().strip()

        # Don't auto-reply to very short messages (might be accidental)
        if len(message) < 3:
            return False

        # Don't auto-reply to unknown contacts with no relationship
        if context.contact.trust_level == 0 and not context.contact.relationship:
            return False

        # Don't auto-reply to messages that seem urgent/need human attention
        urgent_keywords = [
            'urgent', 'emergency', 'important', 'asap', 'help', 'call me',
            'need you', 'problem', 'issue', 'trouble', 'hospital', 'accident'
        ]

        if any(keyword in message for keyword in urgent_keywords):
            return False

        # Don't auto-reply to questions about sensitive information
        sensitive_keywords = [
            'password', 'ssn', 'social security', 'bank', 'credit card',
            'pin', 'address', 'personal', 'private'
        ]

        if any(keyword in message for keyword in sensitive_keywords):
            return False

        # Auto-reply to casual messages from known contacts
        return True

    async def classify_relationship(self, context: SMSContext) -> Optional[str]:
        """Use Claude to classify relationship based on conversation."""
        if context.contact.relationship != 'unknown':
            return context.contact.relationship

        if len(context.conversation_history) < 3:
            return None  # Not enough context

        try:
            conversation_text = self._build_conversation_context(context)

            prompt = f"""
Based on this SMS conversation, classify the relationship between the user and this contact.

Conversation:
{conversation_text}

Latest message: "{context.incoming_message}"

Choose one: family, friend, work, unknown

Respond with only the single word classification."""

            options = ClaudeCodeOptions(
                max_turns=1,
                model="claude-3-5-sonnet-20241022",
                allowed_tools=[]
            )

            messages = []
            async for message in query(prompt=prompt, options=options):
                messages.append(message)

            response = self._extract_response_text(messages)
            if response and response.lower() in ['family', 'friend', 'work', 'unknown']:
                return response.lower()

        except Exception as error:
            print(f"Error classifying relationship: {error}")

        return None
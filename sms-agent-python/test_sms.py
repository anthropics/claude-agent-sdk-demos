#!/usr/bin/env python3
"""
Test script for SMS Response Assistant.

This script demonstrates the functionality without requiring an actual SMS provider.
"""
import asyncio
import sys
from pathlib import Path

# Add current directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from database.db import SMSDatabase
from agent.sms_processor import SMSProcessor, IncomingSMS, OutgoingSMS


async def mock_send_sms(sms: OutgoingSMS):
    """Mock SMS sending function for testing."""
    print(f"📤 [MOCK] SMS to {sms.to_number}: '{sms.body}'")


async def test_sms_assistant():
    """Test the SMS Response Assistant functionality."""
    print("🧪 Testing SMS Response Assistant")
    print("=" * 50)

    # Use in-memory database for testing
    db = SMSDatabase(":memory:")
    processor = SMSProcessor(db, mock_send_sms)

    # Test scenarios
    test_messages = [
        IncomingSMS("+1234567890", "Hey! How are you doing?"),
        IncomingSMS("+1234567890", "Are you free for coffee tomorrow?"),
        IncomingSMS("+9876543210", "Hi, this is John from the conference. Nice meeting you!"),
        IncomingSMS("+1111111111", "URGENT: Please call me back ASAP!"),
        IncomingSMS("+5555555555", "Thanks for your help earlier"),
        IncomingSMS("+1234567890", "What time should we meet?"),
    ]

    print("Processing test messages...\n")

    for i, message in enumerate(test_messages, 1):
        print(f"📥 Test {i}: SMS from {message.from_number}")
        print(f"   Message: '{message.body}'")

        # Process the message
        result = await processor.process_incoming_sms(message)

        if result.get('auto_reply_sent'):
            print(f"   ✅ Auto-reply sent: '{result['response_text']}'")
        elif result.get('should_reply'):
            print(f"   ⏸️  Would auto-reply: '{result['response_text']}'")
        else:
            print("   ❌ No auto-reply (needs human attention)")

        print()

        # Small delay for readability
        await asyncio.sleep(0.5)

    # Test manual SMS sending
    print("📤 Testing manual SMS sending...")
    manual_result = await processor.send_manual_sms(
        "+1234567890",
        "This is a manual message from the SMS assistant!"
    )
    print(f"   Manual SMS result: {manual_result}")
    print()

    # Show dashboard data
    print("📊 Dashboard Data:")
    dashboard = processor.get_dashboard_data()

    print(f"   Total contacts: {dashboard['stats']['total_contacts']}")
    print(f"   Total messages: {dashboard['stats']['total_messages']}")
    print(f"   Auto-replies sent: {dashboard['stats']['auto_replies_sent']}")
    print()

    print("Recent conversations:")
    for conv in dashboard['recent_conversations'][:5]:
        print(f"   • {conv['phone_number']}: '{conv['last_message'][:50]}...'")
    print()

    # Test conversation retrieval
    print("📜 Conversation history for +1234567890:")
    conversation = processor.get_conversation("+1234567890")
    for msg in conversation['messages'][:5]:
        direction = "→" if msg['direction'] == 'outgoing' else "←"
        auto_reply = " [AUTO]" if msg['is_auto_reply'] else ""
        print(f"   {direction} {msg['text'][:60]}{auto_reply}")

    # Cleanup
    db.close()
    print("\n✅ Test completed successfully!")


async def interactive_test():
    """Interactive test mode."""
    print("🎮 Interactive SMS Test Mode")
    print("Type 'quit' to exit, 'dashboard' for stats")
    print("=" * 40)

    db = SMSDatabase(":memory:")
    processor = SMSProcessor(db, mock_send_sms)

    while True:
        try:
            from_number = input("\nFrom phone (+1234567890): ").strip()
            if from_number.lower() == 'quit':
                break
            elif from_number.lower() == 'dashboard':
                dashboard = processor.get_dashboard_data()
                print(f"Stats: {dashboard['stats']}")
                continue

            if not from_number:
                from_number = "+1234567890"

            message = input("Message: ").strip()
            if not message:
                continue

            # Process the message
            incoming = IncomingSMS(from_number, message)
            result = await processor.process_incoming_sms(incoming)

            if result.get('auto_reply_sent'):
                print(f"✅ Auto-reply: '{result['response_text']}'")
            elif result.get('should_reply'):
                print(f"⏸️  Would reply: '{result['response_text']}'")
            else:
                print("❌ No auto-reply (needs human attention)")

        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"Error: {e}")

    db.close()
    print("\n👋 Goodbye!")


def main():
    """Main test function."""
    import argparse

    parser = argparse.ArgumentParser(description="Test SMS Response Assistant")
    parser.add_argument(
        "--interactive", "-i",
        action="store_true",
        help="Run in interactive mode"
    )

    args = parser.parse_args()

    if args.interactive:
        asyncio.run(interactive_test())
    else:
        asyncio.run(test_sms_assistant())


if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
SMS Response Assistant - Main Entry Point

A simple and elegant SMS response assistant powered by Claude Code SDK.
"""
import os
import sys
from pathlib import Path

# Add current directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from server.api import run_server


def main():
    """Main entry point for SMS Response Assistant."""
    print("🤖 SMS Response Assistant")
    print("=" * 40)

    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()

    # Check for required environment variables
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("❌ Error: ANTHROPIC_API_KEY environment variable is required")
        print("Please set your Anthropic API key in the .env file")
        sys.exit(1)

    port = int(os.getenv("PORT", 8000))

    print(f"🚀 Starting server on port {port}")
    print(f"📥 Webhook endpoint: http://localhost:{port}/webhook/sms")
    print(f"📤 Manual send endpoint: http://localhost:{port}/send")
    print(f"📊 Dashboard endpoint: http://localhost:{port}/dashboard")
    print(f"📖 API docs: http://localhost:{port}/docs")
    print("=" * 40)

    # Start the server
    run_server()


if __name__ == "__main__":
    main()
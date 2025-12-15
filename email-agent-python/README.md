# Email Agent - Python FastAPI Version

> ⚠️ **IMPORTANT**: This is a demo application by Anthropic. It is intended for local development only and should NOT be deployed to production or used at scale.

A FastAPI-based email client powered by Claude AI, showcasing AI-powered email management capabilities. This is a Python port of the original TypeScript email agent.

## 🔒 Security Warning

**This application should ONLY be run locally on your personal machine.** It:
- Stores email credentials in plain text environment variables
- Has no authentication or multi-user support
- Is not designed for production security standards

## Features

- 📧 **Email Syncing**: Sync emails from IMAP servers (Gmail, etc.)
- 🔍 **Full-Text Search**: Search emails with SQLite FTS5
- 🤖 **AI-Powered Listeners**: Automated email processing with Claude AI
- ⚡ **Custom Actions**: User-triggered email workflows
- 🌐 **REST API**: Complete email management API
- 🔌 **WebSocket Support**: Real-time email updates

## Prerequisites

- Python 3.9 or higher
- An Anthropic API key ([get one here](https://console.anthropic.com))
- Email account with IMAP access enabled

## Installation

1. Clone the repository:
```bash
cd claude-agent-sdk-demos/email-agent-python
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create environment file:
```bash
cp .env.example .env
```

5. Configure your credentials in `.env` (see IMAP Setup below)

## IMAP Setup Guide

### Gmail Setup

Gmail requires an **App Password** instead of your regular password:

1. **Enable 2-Factor Authentication** (required for app passwords):
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Click on "2-Step Verification" and follow the setup

2. **Generate an App Password**:
   - Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" from the dropdown
   - Select your device (or choose "Other" and name it "Email Agent")
   - Click "Generate"
   - **Copy the 16-character password** (you won't see it again!)

3. **Configure `.env`**:
```env
ANTHROPIC_API_KEY=your-anthropic-api-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password  # NOT your regular password!
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
DATABASE_PATH=./emails.db
```

## Running the Server

Start the FastAPI server:

```bash
python -m uvicorn server.server:app --reload --port 8000
```

The server will be available at:
- **API**: http://localhost:8000
- **WebSocket**: ws://localhost:8000/ws
- **API Docs**: http://localhost:8000/docs (Swagger UI)

## API Endpoints

### Email Endpoints

- `GET /api/emails/inbox` - Get inbox emails
  - Query params: `limit` (default: 50), `includeRead` (default: true)
- `POST /api/emails/search` - Search emails
  - Body: `{"query": "search term", "limit": 30}`
- `GET /api/email/{email_id}` - Get email details

### Sync Endpoints

- `POST /api/sync` - Sync emails from IMAP
  - Body: `{"folder": "INBOX", "limit": 50}`
- `GET /api/sync/status` - Get sync status

### Listener & Action Endpoints

- `GET /api/listeners` - Get all loaded listeners
- `GET /api/actions` - Get all action templates

## Project Structure

```
email-agent-python/
├── agent/
│   ├── types.py                    # Type definitions
│   └── custom_scripts/
│       ├── listeners/              # Email event listeners
│       │   └── example_listener.py
│       └── actions/                # User-triggered actions
│           └── example_action.py
├── ccsdk/                          # Claude SDK integration
│   ├── email_agent_prompt.py
│   ├── agent_tools.py
│   ├── listeners_manager.py
│   └── actions_manager.py
├── database/                       # Database layer
│   ├── email_db.py                # SQLite database
│   ├── email_sync.py              # IMAP sync service
│   └── config.py
├── server/                         # FastAPI server
│   ├── server.py                  # Main server file
│   └── endpoints/
│       ├── emails.py              # Email endpoints
│       └── sync.py                # Sync endpoints
├── requirements.txt
├── .env.example
└── README.md
```

## Creating Custom Listeners

Listeners are Python modules that automatically process incoming emails. Create a new file in `agent/custom_scripts/listeners/`:

```python
"""My custom listener."""
from agent.types import Email, ListenerContext, ListenerConfig, ListenerResult

config: ListenerConfig = {
    "id": "my_listener",
    "name": "My Custom Listener",
    "description": "Process specific emails automatically",
    "enabled": True,
    "event": "email_received"
}

async def handler(email: Email, context: ListenerContext) -> ListenerResult:
    """Process the email."""
    # Use AI to analyze the email
    analysis = await context.callAgent({
        "prompt": f"Analyze this email: {email.subject}",
        "schema": {
            "type": "object",
            "properties": {
                "category": {"type": "string"}
            },
            "required": ["category"]
        },
        "model": "haiku"
    })

    # Take action based on analysis
    if analysis["category"] == "urgent":
        await context.starEmail(email.messageId)
        await context.notify(f"Urgent email: {email.subject}")

        return {
            "executed": True,
            "reason": "Email marked as urgent",
            "actions": ["starred", "notified"]
        }

    return {
        "executed": False,
        "reason": "Not urgent"
    }
```

## Creating Custom Actions

Actions are user-triggered workflows. Create a new file in `agent/custom_scripts/actions/`:

```python
"""My custom action."""
from agent.types import ActionTemplate, ActionContext, ActionResult

config: ActionTemplate = {
    "id": "my_action",
    "name": "My Custom Action",
    "description": "Perform a custom email operation",
    "icon": "⚡",
    "parameterSchema": {
        "type": "object",
        "properties": {
            "emailId": {
                "type": "string",
                "description": "Email to process"
            }
        },
        "required": ["emailId"]
    }
}

async def handler(params: dict, context: ActionContext) -> ActionResult:
    """Execute the action."""
    try:
        email_id = params["emailId"]

        # Perform your custom logic
        await context.db_manager.update_email_starred(email_id, True)

        context.log(f"Processed email: {email_id}")

        return {
            "success": True,
            "message": "Action completed successfully",
            "refreshInbox": True
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Action failed: {str(e)}"
        }
```

## Differences from TypeScript Version

This Python version maintains the core functionality of the TypeScript original while adapting to Python/FastAPI patterns:

1. **Framework**: Uses FastAPI instead of Bun
2. **Database**: Direct SQLite with Python sqlite3 instead of Bun's SQLite
3. **Type System**: Uses Pydantic models instead of TypeScript interfaces
4. **Async**: Uses Python asyncio instead of JavaScript promises
5. **Module System**: Python imports instead of ES modules

## Testing

You can test the API using the interactive docs:
1. Start the server
2. Visit http://localhost:8000/docs
3. Try the endpoints directly from the Swagger UI

Or use curl:
```bash
# Get inbox
curl http://localhost:8000/api/emails/inbox?limit=10

# Sync emails
curl -X POST http://localhost:8000/api/sync \
  -H "Content-Type: application/json" \
  -d '{"folder": "INBOX", "limit": 20}'

# Search emails
curl -X POST http://localhost:8000/api/emails/search \
  -H "Content-Type: application/json" \
  -d '{"query": "invoice", "limit": 10}'
```

## Troubleshooting

### IMAP Connection Issues
- Ensure you're using an app password, not your regular Gmail password
- Check that IMAP is enabled in your Gmail settings
- Verify the IMAP host and port are correct

### Database Issues
- The database is created automatically on first run
- If you encounter issues, delete `emails.db` and restart

### Import Errors
- Make sure you've activated the virtual environment
- Verify all dependencies are installed: `pip install -r requirements.txt`

## License

MIT License - This is sample code for demonstration purposes.

---

Built by Anthropic to demonstrate AI-powered email management with Claude and FastAPI.

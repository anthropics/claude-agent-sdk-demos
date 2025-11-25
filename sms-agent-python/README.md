# SMS Response Assistant (Python)

A simple and elegant SMS response assistant powered by Claude Code SDK that automatically generates and sends responses to incoming text messages.

## 🚀 Features

- **Intelligent Auto-Replies**: Uses Claude to generate contextually appropriate SMS responses
- **Conversation Memory**: Maintains conversation history for better context understanding
- **Contact Management**: Tracks relationships and trust levels for personalized responses
- **Smart Decision Making**: Knows when to auto-reply vs. when human attention is needed
- **Webhook Ready**: FastAPI server with endpoints for SMS provider integration
- **SQLite Database**: Local storage for conversations and contacts
- **Easy Integration**: Ready for Twilio, AWS SNS, or other SMS providers

## 📋 Requirements

- Python 3.10 or higher
- Claude Code CLI installed
- Anthropic API key

## 🛠️ Installation

1. **Clone and Navigate**
   ```bash
   git clone <repository>
   cd sms-agent-python
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   # or using pip with pyproject.toml
   pip install -e .
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env and add your Anthropic API key
   ```

4. **Run the Server**
   ```bash
   python main.py
   ```

The server starts on `http://localhost:8000` with these endpoints:

## 🌐 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/webhook/sms` | POST | Webhook for incoming SMS |
| `/send` | POST | Send manual SMS |
| `/dashboard` | GET | Dashboard data |
| `/conversation/{phone}` | GET | Conversation history |
| `/contact` | PUT | Update contact info |
| `/stats` | GET | System statistics |
| `/docs` | GET | Interactive API documentation |

## 📱 Webhook Format

Send incoming SMS data in this format:

```json
{
  "From": "+1234567890",
  "Body": "Hello! How are you?"
}
```

Compatible with Twilio webhook format and generic SMS formats.

## 📤 Manual SMS Sending

```bash
curl -X POST http://localhost:8000/send \
  -H "Content-Type: application/json" \
  -d '{"to": "+1234567890", "message": "Hello from SMS Assistant!"}'
```

## 🧪 Testing

Run the test script to see the assistant in action:

```bash
# Automated test
python test_sms.py

# Interactive test mode
python test_sms.py --interactive
```

## 🔧 SMS Provider Integration

### Twilio Integration

1. **Configure Webhook**: Set Twilio webhook URL to `http://your-server.com/webhook/sms`

2. **Add Credentials**: Update `.env` with Twilio credentials

3. **Update Send Function**: Modify `send_sms_callback` in `server/api.py`:

```python
from twilio.rest import Client

async def send_sms_callback(sms: OutgoingSMS):
    client = Client(account_sid, auth_token)
    client.messages.create(
        body=sms.body,
        from_=twilio_phone_number,
        to=sms.to_number
    )
```

### AWS SNS Integration

```python
import boto3

async def send_sms_callback(sms: OutgoingSMS):
    sns = boto3.client('sns')
    sns.publish(
        PhoneNumber=sms.to_number,
        Message=sms.body
    )
```

## 🧠 Auto-Reply Logic

The assistant automatically replies when:

- ✅ Contact has some trust level (not completely unknown)
- ✅ Message is substantial (more than 3 characters)
- ✅ Message doesn't contain urgent keywords
- ✅ Message doesn't request sensitive information

The assistant **won't** auto-reply for:

- ❌ Messages with urgent keywords (`urgent`, `emergency`, `help`, etc.)
- ❌ Requests for sensitive info (`password`, `ssn`, `bank`, etc.)
- ❌ Very short messages (might be accidental)
- ❌ Completely unknown contacts with no conversation history

## 📊 Database Schema

### Contacts Table
- `id`: Primary key
- `phone_number`: Unique phone number
- `name`: Contact name (optional)
- `relationship`: `family`, `friend`, `work`, `unknown`
- `trust_level`: 0-3 (unknown, acquaintance, trusted, verified)
- `created_at`, `updated_at`: Timestamps

### Messages Table
- `id`: Primary key
- `contact_id`: Foreign key to contacts
- `phone_number`: Phone number for quick lookup
- `message_text`: SMS content
- `direction`: `incoming` or `outgoing`
- `timestamp`: Message timestamp
- `is_auto_reply`: Boolean flag for auto-generated messages

## 🏗️ Architecture

```
SMS Provider → Webhook → SMS Processor → Claude Agent → Response → SMS Provider
                   ↓
              SQLite Database
```

### Key Components

1. **Database Layer** (`database/`): SQLite operations and models
2. **Agent Layer** (`agent/`): Claude integration and SMS processing logic
3. **Server Layer** (`server/`): FastAPI web server with endpoints
4. **Main Entry** (`main.py`): Application startup and configuration

## 🔍 Example Usage

```python
import asyncio
from database.db import SMSDatabase
from agent.sms_processor import SMSProcessor, IncomingSMS

async def example():
    db = SMSDatabase()
    processor = SMSProcessor(db)

    # Process incoming SMS
    sms = IncomingSMS("+1234567890", "Hey, how are you?")
    result = await processor.process_incoming_sms(sms)

    if result['auto_reply_sent']:
        print(f"Sent: {result['response_text']}")
```

## 🔒 Security Considerations

- Keep your Anthropic API key secure
- Validate webhook signatures in production
- Implement rate limiting for production deployments
- Review auto-reply logic for your specific use case
- Consider contact verification for sensitive information

## 📝 Configuration

Environment variables in `.env`:

```bash
# Required
ANTHROPIC_API_KEY=your-api-key

# Optional
PORT=8000
DATABASE_PATH=./sms_agent.db
CLAUDE_CODE_MODEL=claude-3-5-sonnet-20241022
```

## 🚀 Production Deployment

1. Set up a production WSGI server (gunicorn, uvicorn)
2. Configure reverse proxy (nginx)
3. Set up SSL certificates
4. Configure proper logging
5. Set up monitoring and health checks
6. Implement backup strategy for SQLite database

## 📄 License

MIT License - This is sample code for demonstration purposes.

---

Built with ❤️ using Claude Code SDK
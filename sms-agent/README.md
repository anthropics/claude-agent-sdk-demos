# SMS Response Assistant

A simple and elegant SMS response assistant powered by Claude Code SDK that automatically generates and sends responses to incoming text messages.

## Features

- **Automatic Response Generation**: Uses Claude to generate contextually appropriate SMS replies
- **Conversation History**: Maintains conversation context for better responses
- **Contact Management**: Tracks relationships and trust levels for personalized responses
- **Smart Auto-Reply Logic**: Intelligently decides when to auto-reply vs. when human attention is needed
- **Webhook Support**: Ready for integration with SMS providers like Twilio
- **Simple Database**: SQLite for local conversation storage

## Quick Start

1. **Install Dependencies**
   ```bash
   cd sms-agent
   bun install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Anthropic API key
   ```

3. **Run the Server**
   ```bash
   bun run dev
   ```

The server will start on `http://localhost:3001` with the following endpoints:

- `POST /webhook/sms` - Webhook for incoming SMS messages
- `POST /send` - Manual SMS sending
- `GET /dashboard` - Conversation dashboard data
- `GET /health` - Health check

## Webhook Format

The webhook expects JSON in this format:
```json
{
  "from": "+1234567890",
  "body": "Hello! How are you?"
}
```

## Manual Send

Send SMS manually via the API:
```bash
curl -X POST http://localhost:3001/send \
  -H "Content-Type: application/json" \
  -d '{"to": "+1234567890", "message": "Hello from SMS Assistant!"}'
```

## SMS Provider Integration

### Twilio
1. Configure webhook URL in Twilio console: `http://your-server.com/webhook/sms`
2. Add Twilio credentials to `.env`
3. Update `sendSMS` method in `server/index.ts` with Twilio API calls

### AWS SNS
1. Set up SNS topic and subscription
2. Add AWS credentials to `.env`
3. Update `sendSMS` method with SNS publish calls

## Auto-Reply Logic

The assistant will auto-reply when:
- Contact has some trust level (not completely unknown)
- Message is substantial (>3 characters)
- Message doesn't contain urgent keywords that need human attention

## Database Schema

- **contacts**: Store contact info, relationships, and trust levels
- **messages**: Store all SMS conversations with metadata

## Architecture

```
SMS Provider → Webhook → SMS Processor → Claude Agent → Response → SMS Provider
                    ↓
               Database (SQLite)
```

## Security Notes

- Keep your Anthropic API key secure
- Validate webhook signatures in production
- Consider rate limiting for production deployments
- Review auto-reply logic for your specific use case

## License

MIT - This is sample code for demonstration purposes.
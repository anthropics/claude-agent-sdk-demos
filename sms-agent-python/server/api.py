"""FastAPI server for SMS Response Assistant."""
import asyncio
import os
from contextlib import asynccontextmanager
from typing import Optional
import logging

from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
import uvicorn

from database.db import SMSDatabase
from agent.sms_processor import SMSProcessor, IncomingSMS, OutgoingSMS

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables for app state
db: Optional[SMSDatabase] = None
processor: Optional[SMSProcessor] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle."""
    global db, processor

    # Initialize database and processor
    db_path = os.getenv("DATABASE_PATH", "sms_agent.db")
    db = SMSDatabase(db_path)

    # Initialize processor with SMS sending callback
    processor = SMSProcessor(db, send_sms_callback)

    logger.info("SMS Response Assistant started")
    yield

    # Cleanup
    if db:
        db.close()
    logger.info("SMS Response Assistant stopped")


# Create FastAPI app
app = FastAPI(
    title="SMS Response Assistant",
    description="Automated SMS responses powered by Claude",
    version="1.0.0",
    lifespan=lifespan
)


# Pydantic models for API
class WebhookSMS(BaseModel):
    """Webhook SMS message format."""
    From: Optional[str] = None  # Twilio format
    from_: Optional[str] = None  # Alternative format
    Body: Optional[str] = None  # Twilio format
    body: Optional[str] = None  # Alternative format

    @property
    def from_number(self) -> str:
        """Get sender phone number."""
        return self.From or self.from_ or ""

    @property
    def message_body(self) -> str:
        """Get message body."""
        return self.Body or self.body or ""


class ManualSMS(BaseModel):
    """Manual SMS sending request."""
    to: str
    message: str


class ContactUpdate(BaseModel):
    """Contact information update."""
    phone_number: str
    name: Optional[str] = None
    relationship: Optional[str] = None
    trust_level: Optional[int] = None


# SMS sending callback function
async def send_sms_callback(sms: OutgoingSMS) -> None:
    """
    SMS sending callback - integrate with your SMS provider here.

    This is where you would integrate with:
    - Twilio
    - AWS SNS
    - Other SMS services
    """
    logger.info(f"📱 SENDING SMS to {sms.to_number}: {sms.body}")

    # For demo purposes, we just log the message
    # In production, you would make API calls to your SMS provider:

    # Example Twilio integration:
    # from twilio.rest import Client
    # client = Client(account_sid, auth_token)
    # client.messages.create(
    #     body=sms.body,
    #     from_=twilio_phone_number,
    #     to=sms.to_number
    # )

    # Example AWS SNS integration:
    # import boto3
    # sns = boto3.client('sns')
    # sns.publish(
    #     PhoneNumber=sms.to_number,
    #     Message=sms.body
    # )


# API Endpoints

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "message": "SMS Response Assistant is running",
        "status": "healthy"
    }


@app.post("/webhook/sms")
async def sms_webhook(webhook_data: WebhookSMS, background_tasks: BackgroundTasks):
    """
    Webhook endpoint for incoming SMS messages.

    Supports Twilio webhook format and generic formats.
    """
    if not processor:
        raise HTTPException(status_code=500, detail="Service not initialized")

    from_number = webhook_data.from_number
    message_body = webhook_data.message_body

    if not from_number or not message_body:
        raise HTTPException(
            status_code=400,
            detail="Missing required fields: from_number and message_body"
        )

    # Create incoming SMS
    incoming_sms = IncomingSMS(from_number, message_body)

    # Process in background to respond quickly to webhook
    background_tasks.add_task(process_sms_background, incoming_sms)

    return {"status": "received", "message": "SMS processing started"}


async def process_sms_background(incoming_sms: IncomingSMS):
    """Background task to process SMS."""
    if processor:
        await processor.process_incoming_sms(incoming_sms)


@app.post("/send")
async def send_manual_sms(sms_data: ManualSMS):
    """Send a manual SMS message."""
    if not processor:
        raise HTTPException(status_code=500, detail="Service not initialized")

    result = await processor.send_manual_sms(sms_data.to, sms_data.message)

    if result.get('success'):
        return {
            "status": "sent",
            "message_id": result.get('message_id'),
            "contact_id": result.get('contact_id')
        }
    else:
        raise HTTPException(
            status_code=500,
            detail=result.get('error', 'Failed to send SMS')
        )


@app.get("/dashboard")
async def get_dashboard():
    """Get dashboard data with recent conversations and stats."""
    if not processor:
        raise HTTPException(status_code=500, detail="Service not initialized")

    return processor.get_dashboard_data()


@app.get("/conversation/{phone_number}")
async def get_conversation(phone_number: str, limit: int = 20):
    """Get conversation history for a specific phone number."""
    if not processor:
        raise HTTPException(status_code=500, detail="Service not initialized")

    # Clean phone number (remove any URL encoding)
    phone_number = phone_number.replace("%2B", "+")

    return processor.get_conversation(phone_number, limit)


@app.put("/contact")
async def update_contact(contact_data: ContactUpdate):
    """Update contact information."""
    if not db:
        raise HTTPException(status_code=500, detail="Service not initialized")

    try:
        # Filter out None values
        updates = {
            k: v for k, v in contact_data.dict().items()
            if v is not None and k != 'phone_number'
        }

        if updates:
            db.update_contact(contact_data.phone_number, **updates)

        return {"status": "updated", "phone_number": contact_data.phone_number}

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@app.get("/stats")
async def get_stats():
    """Get system statistics."""
    if not db:
        raise HTTPException(status_code=500, detail="Service not initialized")

    return db.get_stats()


# Development server
def run_server():
    """Run the development server."""
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "server.api:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )


if __name__ == "__main__":
    run_server()
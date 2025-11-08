"""FastAPI server for email agent."""
import os
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List

from database import EmailDatabase, EmailSyncService, DATABASE_PATH
from ccsdk.listeners_manager import ListenersManager
from ccsdk.actions_manager import ActionsManager
from server.endpoints import emails_router, sync_router

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="Email Agent API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize managers
db_manager = EmailDatabase(DATABASE_PATH)
listeners_manager = ListenersManager(db_manager, None, None)
actions_manager = ActionsManager()

# Store WebSocket clients
websocket_clients: List[WebSocket] = []


@app.on_event("startup")
async def startup_event():
    """Initialize on server startup."""
    print("🚀 Starting Email Agent Server...")

    # Initialize database tables
    print("✅ Database initialized")

    # Load listeners
    await listeners_manager.load_all_listeners()

    # Load action templates
    await actions_manager.load_all_templates()

    print("✅ Server ready at http://localhost:8000")
    print("📡 WebSocket endpoint available at ws://localhost:8000/ws")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on server shutdown."""
    db_manager.close()
    print("👋 Server shutdown complete")


# Include routers
app.include_router(emails_router)
app.include_router(sync_router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "Email Agent API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/api/listeners")
async def get_listeners():
    """Get all loaded listeners."""
    listeners = listeners_manager.get_all_listeners()
    return {"listeners": listeners, "stats": {"total": len(listeners)}}


@app.get("/api/actions")
async def get_actions():
    """Get all action templates."""
    actions = actions_manager.get_all_templates()
    return {"actions": actions}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time communication."""
    await websocket.accept()
    websocket_clients.append(websocket)

    try:
        # Send initial connection message
        await websocket.send_json({
            "type": "connected",
            "message": "Connected to email assistant"
        })

        # Send initial inbox
        emails = db_manager.get_recent_emails(limit=30)
        await websocket.send_json({
            "type": "inbox_update",
            "emails": [
                {
                    "id": e.get("message_id"),
                    "messageId": e.get("message_id"),
                    "subject": e.get("subject"),
                    "from_address": e.get("from_address"),
                    "date_sent": e.get("date_sent"),
                    "snippet": e.get("snippet"),
                    "is_read": bool(e.get("is_read")),
                }
                for e in emails
            ]
        })

        # Listen for messages
        while True:
            data = await websocket.receive_json()

            if data.get("type") == "chat":
                # Handle chat message
                await websocket.send_json({
                    "type": "message",
                    "role": "assistant",
                    "content": "Chat functionality not yet implemented in this simplified version. Use the REST API endpoints for email operations."
                })

            elif data.get("type") == "request_inbox":
                # Send current inbox
                emails = db_manager.get_recent_emails(limit=30)
                await websocket.send_json({
                    "type": "inbox_update",
                    "emails": [
                        {
                            "id": e.get("message_id"),
                            "messageId": e.get("message_id"),
                            "subject": e.get("subject"),
                            "from_address": e.get("from_address"),
                            "date_sent": e.get("date_sent"),
                            "snippet": e.get("snippet"),
                            "is_read": bool(e.get("is_read")),
                        }
                        for e in emails
                    ]
                })

    except WebSocketDisconnect:
        websocket_clients.remove(websocket)
        print("WebSocket client disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
        if websocket in websocket_clients:
            websocket_clients.remove(websocket)


async def broadcast_inbox_update():
    """Broadcast inbox updates to all connected clients."""
    emails = db_manager.get_recent_emails(limit=30)
    message = {
        "type": "inbox_update",
        "emails": [
            {
                "id": e.get("message_id"),
                "messageId": e.get("message_id"),
                "subject": e.get("subject"),
                "from_address": e.get("from_address"),
                "date_sent": e.get("date_sent"),
                "snippet": e.get("snippet"),
                "is_read": bool(e.get("is_read")),
            }
            for e in emails
        ]
    }

    for client in websocket_clients:
        try:
            await client.send_json(message)
        except:
            pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

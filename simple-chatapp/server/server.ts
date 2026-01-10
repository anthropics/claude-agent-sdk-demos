import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import type { WSClient, IncomingWSMessage } from "./types.js";
import { chatStore } from "./chat-store.js";
import { Session } from "./session.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;

// Express app
const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from client directory
app.use("/client", express.static(path.join(__dirname, "../client")));

// Serve index.html at root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});

// Session management
const sessions: Map<string, Session> = new Map();

async function getOrCreateSession(chatId: string): Promise<Session> {
  let session = sessions.get(chatId);
  if (!session) {
    session = await Session.create(chatId);
    sessions.set(chatId, session);
  }
  return session;
}

// REST API: Get all chats
app.get("/api/chats", (req, res) => {
  const chats = chatStore.getAllChats();
  res.json(chats);
});

// REST API: Create new chat
app.post("/api/chats", (req, res) => {
  const chat = chatStore.createChat(req.body?.title);
  res.status(201).json(chat);
});

// REST API: Get single chat
app.get("/api/chats/:id", (req, res) => {
  const chat = chatStore.getChat(req.params.id);
  if (!chat) {
    return res.status(404).json({ error: "Chat not found" });
  }
  res.json(chat);
});

// REST API: Delete chat
app.delete("/api/chats/:id", (req, res) => {
  const deleted = chatStore.deleteChat(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: "Chat not found" });
  }
  const session = sessions.get(req.params.id);
  if (session) {
    session.close();
    sessions.delete(req.params.id);
  }
  res.json({ success: true });
});

// REST API: Get chat messages
app.get("/api/chats/:id/messages", (req, res) => {
  const messages = chatStore.getMessages(req.params.id);
  res.json(messages);
});

// Create HTTP server
const server = createServer(app);

// WebSocket server
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (ws: WSClient) => {
  console.log("WebSocket client connected");
  ws.isAlive = true;

  ws.send(JSON.stringify({ type: "connected", message: "Connected to chat server" }));

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", (data) => {
    try {
      const message: IncomingWSMessage = JSON.parse(data.toString());

      switch (message.type) {
        case "subscribe": {
          getOrCreateSession(message.chatId).then((session) => {
            session.subscribe(ws);
            console.log(`Client subscribed to chat ${message.chatId}`);

            // Send existing messages
            const messages = chatStore.getMessages(message.chatId);
            ws.send(JSON.stringify({
              type: "history",
              messages,
              chatId: message.chatId,
            }));
          }).catch((error) => {
            console.error("Error subscribing to chat:", error);
            ws.send(JSON.stringify({ type: "error", error: "Failed to subscribe" }));
          });
          break;
        }

        case "chat": {
          getOrCreateSession(message.chatId).then(async (session) => {
            session.subscribe(ws);
            await session.sendMessage(message.content);
          }).catch((error) => {
            console.error("Error sending message:", error);
            ws.send(JSON.stringify({ type: "error", error: "Failed to send message" }));
          });
          break;
        }

        default:
          console.warn("Unknown message type:", (message as any).type);
      }
    } catch (error) {
      console.error("Error handling WebSocket message:", error);
      ws.send(JSON.stringify({ type: "error", error: "Invalid message format" }));
    }
  });

  ws.on("close", () => {
    console.log("WebSocket client disconnected");
    // Unsubscribe from all sessions
    for (const session of sessions.values()) {
      session.unsubscribe(ws);
    }
  });
});

// Heartbeat to detect dead connections
const heartbeat = setInterval(() => {
  wss.clients.forEach((ws) => {
    const client = ws as WSClient;
    if (client.isAlive === false) {
      return client.terminate();
    }
    client.isAlive = false;
    client.ping();
  });
}, 30000);

wss.on("close", () => {
  clearInterval(heartbeat);
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`WebSocket endpoint available at ws://localhost:${PORT}/ws`);
  console.log(`Visit http://localhost:${PORT} to view the chat interface`);
});

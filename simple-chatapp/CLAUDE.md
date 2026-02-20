# Simple Chat App

A minimal chat application using the Claude Agent SDK.

## Architecture

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express + WebSocket (ws)
- **Agent**: Claude Agent SDK integrated directly on the server

## Running the App

```bash
cd simple-chatapp
npm install
npm run dev
```

This starts both:
- Backend server on http://localhost:3001
- Vite dev server on http://localhost:5173

Visit http://localhost:5173

## Project Structure

```
simple-chatapp/
├── client/                    # React frontend
│   ├── App.tsx               # Main app component
│   ├── index.tsx             # Entry point
│   ├── index.html            # HTML template
│   ├── globals.css           # Tailwind CSS
│   ├── components/
│   │   ├── ChatList.tsx      # Left sidebar with chat list
│   │   └── ChatWindow.tsx    # Main chat interface
│   └── hooks/
│       └── useWebSocket.ts   # WebSocket hook
├── server/
│   ├── server.ts             # Express server (REST + WebSocket)
│   ├── ai-client.ts          # Claude Agent SDK wrapper
│   ├── session.ts            # Chat session management
│   ├── chat-store.ts         # In-memory chat storage
│   └── types.ts              # TypeScript types
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

## API Endpoints

### REST API

- `GET /api/chats` - List all chats
- `POST /api/chats` - Create new chat
- `GET /api/chats/:id` - Get chat details
- `DELETE /api/chats/:id` - Delete chat
- `GET /api/chats/:id/messages` - Get chat messages

### WebSocket (`ws://localhost:3001/ws`)

**Client -> Server:**
- `{ type: "subscribe", chatId: string }` - Subscribe to a chat
- `{ type: "chat", chatId: string, content: string }` - Send message

**Server -> Client:**
- `{ type: "connected" }` - Connection established
- `{ type: "history", messages: [...] }` - Chat history
- `{ type: "assistant_message", content: string }` - AI response
- `{ type: "tool_use", toolName: string, toolInput: {...} }` - Tool being used
- `{ type: "result", success: boolean }` - Query complete
- `{ type: "error", error: string }` - Error occurred

## Notes

- In-memory storage (data lost on restart)
- Agent has access to: Bash, Read, Write, Edit, Glob, Grep, WebSearch, WebFetch
- Uses Vite for frontend development with hot reload
- Uses tsx for TypeScript execution on the backend

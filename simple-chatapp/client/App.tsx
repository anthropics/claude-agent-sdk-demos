import { useState, useEffect, useCallback, useRef } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { ChatList } from "./components/ChatList";
import { ChatWindow } from "./components/ChatWindow";

interface Chat {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: string;
  role: "user" | "assistant" | "tool_use";
  content: string;
  timestamp: string;
  toolName?: string;
  toolInput?: Record<string, any>;
}

// Use relative URLs - Vite will proxy to the backend
const API_BASE = "/api";
const WS_URL = `ws://${window.location.hostname}:3001/ws`;

export default function App() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const selectedChatIdRef = useRef<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Handle WebSocket messages
  const handleWSMessage = useCallback((message: any) => {
    // Read the current selection without replaying lastJsonMessage on chat changes.
    if (message.chatId && message.chatId !== selectedChatIdRef.current) return;

    switch (message.type) {
      case "connected":
        console.log("Connected to server");
        break;

      case "history":
        setMessages(message.messages || []);
        break;

      case "user_message":
        // User message already added locally
        break;

      case "assistant_message":
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: message.content,
            timestamp: new Date().toISOString(),
          },
        ]);
        setIsLoading(false);
        break;

      case "tool_use":
        // Add tool use to messages array so it persists
        // Alternative: To show tool uses only while pending, store them in a
        // separate `pendingToolUses` state and clear it on "assistant_message" or "result"
        setMessages((prev) => [
          ...prev,
          {
            id: message.toolId,
            role: "tool_use",
            content: "",
            timestamp: new Date().toISOString(),
            toolName: message.toolName,
            toolInput: message.toolInput,
          },
        ]);
        break;

      case "result":
        setIsLoading(false);
        // Refresh chat list to get updated titles
        fetchChats();
        break;

      case "error":
        console.error("Server error:", message.error);
        setIsLoading(false);
        break;
    }
  }, []);

  const { sendJsonMessage, readyState, lastJsonMessage } = useWebSocket(WS_URL, {
    shouldReconnect: () => true,
    reconnectAttempts: 10,
    reconnectInterval: 3000,
  });

  const isConnected = readyState === ReadyState.OPEN;

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (lastJsonMessage) {
      handleWSMessage(lastJsonMessage);
    }
  }, [lastJsonMessage, handleWSMessage]);

  // Fetch all chats
  const fetchChats = async () => {
    try {
      const res = await fetch(`${API_BASE}/chats`);
      const data = await res.json();
      setChats(data);
    } catch (error) {
      console.error("Failed to fetch chats:", error);
    }
  };

  // Create new chat
  const createChat = async () => {
    try {
      const res = await fetch(`${API_BASE}/chats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const chat = await res.json();
      setChats((prev) => [chat, ...prev]);
      selectChat(chat.id);
    } catch (error) {
      console.error("Failed to create chat:", error);
    }
  };

  // Delete chat
  const deleteChat = async (chatId: string) => {
    try {
      await fetch(`${API_BASE}/chats/${chatId}`, { method: "DELETE" });
      setChats((prev) => prev.filter((c) => c.id !== chatId));
      if (selectedChatIdRef.current === chatId) {
        selectedChatIdRef.current = null;
        setSelectedChatId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  };

  // Select a chat
  const selectChat = (chatId: string) => {
    selectedChatIdRef.current = chatId;
    setSelectedChatId(chatId);
    setMessages([]);
    setIsLoading(false);

    // Subscribe to chat via WebSocket
    sendJsonMessage({ type: "subscribe", chatId });
  };

  // Send a message
  const handleSendMessage = (content: string) => {
    if (!selectedChatId || !isConnected) return;

    // Add message optimistically
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      },
    ]);

    setIsLoading(true);

    // Send via WebSocket
    sendJsonMessage({
      type: "chat",
      content,
      chatId: selectedChatId,
    });
  };

  // Initial fetch
  useEffect(() => {
    fetchChats();
  }, []);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 shrink-0">
        <ChatList
          chats={chats}
          selectedChatId={selectedChatId}
          onSelectChat={selectChat}
          onNewChat={createChat}
          onDeleteChat={deleteChat}
        />
      </div>

      {/* Main chat area */}
      <ChatWindow
        chatId={selectedChatId}
        messages={messages}
        isConnected={isConnected}
        isLoading={isLoading}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}

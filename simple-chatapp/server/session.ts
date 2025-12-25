import type { WSClient } from "./types.js";
import { AgentSession } from "./ai-client.js";
import { chatStore } from "./chat-store.js";

// Session manages a single chat conversation with a long-lived agent
export class Session {
  public readonly chatId: string;
  private subscribers: Set<WSClient> = new Set();
  private agentSession!: AgentSession;
  private isListening = false;

  private constructor(chatId: string) {
    this.chatId = chatId;
  }

  static async create(chatId: string): Promise<Session> {
    const instance = new Session(chatId);
    instance.agentSession = await AgentSession.create();
    return instance;
  }

  // Start listening to agent output (call once)
  private async startListening() {
    if (this.isListening) return;
    this.isListening = true;

    try {
      for await (const message of this.agentSession.getOutputStream()) {
        this.handleSDKMessage(message);
      }
    } catch (error) {
      console.error(`Error in session ${this.chatId}:`, error);
      this.broadcastError((error as Error).message);
    }
  }

  // Send a user message to the agent
  async sendMessage(content: string) {
    // Store user message
    chatStore.addMessage(this.chatId, {
      role: "user",
      content,
    });

    // Broadcast user message to subscribers
    this.broadcast({
      type: "user_message",
      content,
      chatId: this.chatId,
    });

    // Send to agent and start listening for response
    await this.agentSession.sendMessage(content);
    this.startListening();
  }

  private handleSDKMessage(message: any) {
    if (message.type === "assistant") {
      const content = message.message.content;

      if (typeof content === "string") {
        chatStore.addMessage(this.chatId, {
          role: "assistant",
          content,
        });
        this.broadcast({
          type: "assistant_message",
          content,
          chatId: this.chatId,
        });
      } else if (Array.isArray(content)) {
        for (const block of content) {
          if (block.type === "text") {
            chatStore.addMessage(this.chatId, {
              role: "assistant",
              content: block.text,
            });
            this.broadcast({
              type: "assistant_message",
              content: block.text,
              chatId: this.chatId,
            });
          } else if (block.type === "tool_use") {
            this.broadcast({
              type: "tool_use",
              toolName: block.name,
              toolId: block.id,
              toolInput: block.input,
              chatId: this.chatId,
            });
          }
        }
      }
    } else if (message.type === "result") {
      this.broadcast({
        type: "result",
        success: message.subtype === "success",
        chatId: this.chatId,
        cost: message.total_cost_usd,
        duration: message.duration_ms,
      });
    }
  }

  subscribe(client: WSClient) {
    this.subscribers.add(client);
    client.sessionId = this.chatId;
  }

  unsubscribe(client: WSClient) {
    this.subscribers.delete(client);
  }

  hasSubscribers(): boolean {
    return this.subscribers.size > 0;
  }

  private broadcast(message: any) {
    const messageStr = JSON.stringify(message);
    for (const client of this.subscribers) {
      try {
        if (client.readyState === client.OPEN) {
          client.send(messageStr);
        }
      } catch (error) {
        console.error("Error broadcasting to client:", error);
        this.subscribers.delete(client);
      }
    }
  }

  private broadcastError(error: string) {
    this.broadcast({
      type: "error",
      error,
      chatId: this.chatId,
    });
  }

  // Close the session
  close() {
    this.agentSession.close();
  }
}

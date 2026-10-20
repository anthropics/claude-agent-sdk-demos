import { Database } from "bun:sqlite";
import { Session } from "./session";
import type { WSClient, IncomingMessage } from "./types";
import { DATABASE_PATH } from "../database/config";
import type { ActionsManager } from "./actions-manager";
import type { UIStateManager } from "./ui-state-manager";
import type { ComponentManager } from "./component-manager";
import { createLlmClient } from "./llm-provider";

// Main WebSocket handler class
export class WebSocketHandler {
  private db: Database;
  private sessions: Map<string, Session> = new Map();
  private clients: Map<string, WSClient> = new Map();
  private actionsManager?: ActionsManager;
  private uiStateManager?: UIStateManager;
  private componentManager?: ComponentManager;

  constructor(
    dbPath: string = DATABASE_PATH,
    actionsManager?: ActionsManager,
    uiStateManager?: UIStateManager,
    componentManager?: ComponentManager
  ) {
    this.db = new Database(dbPath);
    this.actionsManager = actionsManager;
    this.uiStateManager = uiStateManager;
    this.componentManager = componentManager;
    this.initEmailWatcher();
    this.initUIStateWatcher();
  }

  private async initEmailWatcher() {
    // Poll for email updates every 5 seconds
    setInterval(() => {
      this.broadcastInboxUpdate();
    }, 5000);

    // Send initial inbox on first load
    this.broadcastInboxUpdate();
  }

  private async getRecentEmails(limit: number = 30) {
    try {
      const emails = this.db.prepare(`
        SELECT
          message_id as id,
          message_id,
          subject,
          from_address,
          from_name,
          date_sent,
          snippet,
          is_read,
          is_starred,
          has_attachments,
          folder
        FROM emails
        ORDER BY date_sent DESC
        LIMIT ?
      `).all(limit);

      return emails;
    } catch (error) {
      console.error('Error fetching recent emails:', error);
      return [];
    }
  }

  private async broadcastInboxUpdate() {
    const emails = await this.getRecentEmails();
    const message = JSON.stringify({
      type: 'inbox_update',
      emails
    });

    // Broadcast to all connected clients
    for (const client of this.clients.values()) {
      try {
        client.send(message);
      } catch (error) {
        console.error('Error sending inbox update to client:', error);
      }
    }
  }

  private initUIStateWatcher() {
    if (!this.uiStateManager) return;

    // Subscribe to UI state updates
    this.uiStateManager.onStateUpdate((stateId, data) => {
      this.broadcastUIStateUpdate(stateId, data);
    });
  }

  private broadcastUIStateUpdate(stateId: string, data: any) {
    const message = JSON.stringify({
      type: 'ui_state_update',
      stateId,
      data
    });

    // Broadcast to all connected clients
    for (const client of this.clients.values()) {
      try {
        client.send(message);
      } catch (error) {
        console.error('Error sending UI state update to client:', error);
      }
    }
  }

  private broadcastComponentInstance(instance: any, sessionId: string) {
    const message = JSON.stringify({
      type: 'component_instance',
      instance,
      sessionId
    });

    // Broadcast to all connected clients
    for (const client of this.clients.values()) {
      try {
        client.send(message);
      } catch (error) {
        console.error('Error sending component instance to client:', error);
      }
    }
  }

  private generateSessionId(): string {
    return 'session-' + Date.now() + '-' + Math.random().toString(36).substring(7);
  }

  private getOrCreateSession(sessionId?: string): Session {
    if (sessionId && this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId)!;
    }

    const newSessionId = sessionId || this.generateSessionId();
    const session = new Session(newSessionId, this.db);
    this.sessions.set(newSessionId, session);
    return session;
  }

  public async onOpen(ws: WSClient) {
    const clientId = Date.now().toString() + '-' + Math.random().toString(36).substring(7);
    this.clients.set(clientId, ws);
    console.log('WebSocket client connected:', clientId);

    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Connected to email assistant',
      availableSessions: Array.from(this.sessions.keys())
    }));

    // Send initial inbox
    const emails = await this.getRecentEmails();
    ws.send(JSON.stringify({
      type: 'inbox_update',
      emails
    }));

    // Send available action templates
    if (this.actionsManager) {
      const templates = this.actionsManager.getAllTemplates();
      ws.send(JSON.stringify({
        type: 'action_templates',
        templates
      }));
    }

    // Send UI state templates
    if (this.uiStateManager) {
      const uiStateTemplates = this.uiStateManager.getAllTemplates();
      ws.send(JSON.stringify({
        type: 'ui_state_templates',
        templates: uiStateTemplates
      }));
    }

    // Send component templates
    if (this.componentManager) {
      const componentTemplates = this.componentManager.getAllTemplates();
      ws.send(JSON.stringify({
        type: 'component_templates',
        templates: componentTemplates
      }));
    }
  }

  public async onMessage(ws: WSClient, message: string) {
    try {
      const data = JSON.parse(message) as IncomingMessage;

      switch (data.type) {
        case 'chat': {
          // Handle chat message
          const session = this.getOrCreateSession(data.sessionId);

          // Auto-subscribe the sender to the session
          if (!ws.data.sessionId || ws.data.sessionId !== session.id) {
            session.subscribe(ws);
          }

          // Check if this is a request to start a new conversation
          if (data.newConversation) {
            session.endConversation();
          }

          // Add the user message to the session
          await session.addUserMessage(data.content);
          break;
        }

        case 'subscribe': {
          // Subscribe to a specific session
          const session = this.sessions.get(data.sessionId);
          if (session) {
            // Unsubscribe from current session if any
            if (ws.data.sessionId && ws.data.sessionId !== data.sessionId) {
              const currentSession = this.sessions.get(ws.data.sessionId);
              currentSession?.unsubscribe(ws);
            }

            session.subscribe(ws);
            ws.send(JSON.stringify({
              type: 'subscribed',
              sessionId: data.sessionId
            }));
          } else {
            ws.send(JSON.stringify({
              type: 'error',
              error: 'Session not found'
            }));
          }
          break;
        }

        case 'unsubscribe': {
          // Unsubscribe from a session
          const session = this.sessions.get(data.sessionId);
          if (session) {
            session.unsubscribe(ws);
            ws.data.sessionId = '';
            ws.send(JSON.stringify({
              type: 'unsubscribed',
              sessionId: data.sessionId
            }));
          }
          break;
        }

        case 'request_inbox': {
          // Send current inbox to requesting client
          const emails = await this.getRecentEmails();
          ws.send(JSON.stringify({
            type: 'inbox_update',
            emails
          }));
          break;
        }

        case 'execute_action': {
          // Execute an action instance
          if (!this.actionsManager) {
            ws.send(JSON.stringify({
              type: 'error',
              error: 'Actions manager not initialized'
            }));
            break;
          }

          const { instanceId, sessionId } = data;
          const session = this.sessions.get(sessionId);

          if (!session) {
            ws.send(JSON.stringify({
              type: 'error',
              error: 'Session not found'
            }));
            break;
          }

          try {
            // Create ActionContext with all capabilities
            const context = this.createActionContext(sessionId, session);

            // Execute the action
            const result = await this.actionsManager.executeAction(instanceId, context);

            // Send result back to client
            ws.send(JSON.stringify({
              type: 'action_result',
              instanceId,
              result,
              sessionId
            }));

            // Handle component instances from result
            if (result.components && this.componentManager) {
              for (const component of result.components) {
                // Register the component instance
                this.componentManager.registerInstance({
                  ...component,
                  sessionId,
                  createdAt: new Date().toISOString()
                });

                // Broadcast to all clients
                this.broadcastComponentInstance(component, sessionId);
              }
            }

            // Refresh inbox if requested
            if (result.refreshInbox) {
              this.broadcastInboxUpdate();
            }
          } catch (error: any) {
            ws.send(JSON.stringify({
              type: 'error',
              error: `Failed to execute action: ${error.message}`
            }));
          }
          break;
        }

        default:
          ws.send(JSON.stringify({
            type: 'error',
            error: 'Unknown message type'
          }));
      }
    } catch (error) {
      console.error('WebSocket error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Failed to process message'
      }));
    }
  }

  public onClose(ws: WSClient) {
    // Unsubscribe from any session
    if (ws.data.sessionId) {
      const session = this.sessions.get(ws.data.sessionId);
      session?.unsubscribe(ws);
    }

    // Remove from clients map
    const clientsArray = Array.from(this.clients.entries());
    for (const [id, client] of clientsArray) {
      if (client === ws) {
        this.clients.delete(id);
        console.log('WebSocket client disconnected:', id);
        break;
      }
    }

    // Clean up empty sessions
    this.cleanupEmptySessions();
  }

  private cleanupEmptySessions() {
    for (const [id, session] of this.sessions) {
      if (!session.hasSubscribers()) {
        // Keep session for a grace period (could be made configurable)
        setTimeout(() => {
          if (!session.hasSubscribers()) {
            session.cleanup();
            this.sessions.delete(id);
            console.log('Cleaned up empty session:', id);
          }
        }, 60000); // 1 minute grace period
      }
    }
  }

  public getActiveSessionsCount(): number {
    return this.sessions.size;
  }

  public getActiveSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  /**
   * Broadcast a listener log to all connected clients
   */
  public broadcastListenerLog(log: any) {
    const message = JSON.stringify({
      type: 'listener_log',
      log
    });

    for (const client of this.clients.values()) {
      try {
        client.send(message);
      } catch (error) {
        console.error('Error sending listener log to client:', error);
      }
    }
  }

  /**
   * Send action instances to clients subscribed to a session
   */
  public sendActionInstances(sessionId: string, actions: any[]) {
    const message = JSON.stringify({
      type: 'action_instances',
      actions,
      sessionId
    });

    // Send to clients subscribed to this session
    const session = this.sessions.get(sessionId);
    if (session) {
      for (const client of this.clients.values()) {
        if (client.data.sessionId === sessionId) {
          try {
            client.send(message);
          } catch (error) {
            console.error('Error sending action instances to client:', error);
          }
        }
      }
    }
  }

  /**
   * Get the actions manager instance
   */
  public getActionsManager(): ActionsManager | undefined {
    return this.actionsManager;
  }

  /**
   * Create ActionContext for action execution
   */
  private createActionContext(sessionId: string, session: any): any {
    return {
      sessionId,

      // Email API operations
      emailAPI: {
        getInbox: async (options?: { limit?: number; includeRead?: boolean }) => {
          const limit = options?.limit || 30;
          const emails = this.db.prepare(`
            SELECT
              message_id as messageId,
              subject,
              from_address as from,
              to_address as to,
              body_text as body,
              date_sent as date,
              is_read as isRead,
              has_attachments as hasAttachments,
              labels
            FROM emails
            WHERE is_read = ? OR ? = 1
            ORDER BY date_sent DESC
            LIMIT ?
          `).all(options?.includeRead ? 1 : 0, options?.includeRead ? 1 : 0, limit);
          return emails as any[];
        },

        searchEmails: async (criteria: any) => {
          // TODO: Implement search with criteria
          return [];
        },

        searchWithGmailQuery: async (query: string) => {
          // TODO: Implement Gmail query search
          return [];
        },

        getEmailsByIds: async (ids: string[]) => {
          const placeholders = ids.map(() => '?').join(',');
          const emails = this.db.prepare(`
            SELECT
              message_id as messageId,
              subject,
              from_address as from,
              to_address as to,
              body_text as body,
              date_sent as date,
              is_read as isRead,
              has_attachments as hasAttachments,
              labels
            FROM emails
            WHERE message_id IN (${placeholders})
          `).all(...ids);
          return emails as any[];
        },

        getEmailById: async (id: string) => {
          const email = this.db.prepare(`
            SELECT
              message_id as messageId,
              subject,
              from_address as from,
              to_address as to,
              body_text as body,
              date_sent as date,
              is_read as isRead,
              has_attachments as hasAttachments,
              labels
            FROM emails
            WHERE message_id = ?
          `).get(id);
          return email as any;
        }
      },

      // Direct email operations
      archiveEmail: async (emailId: string) => {
        this.db.prepare('UPDATE emails SET folder = ? WHERE message_id = ?').run('Archive', emailId);
      },

      starEmail: async (emailId: string) => {
        this.db.prepare('UPDATE emails SET is_starred = 1 WHERE message_id = ?').run(emailId);
      },

      unstarEmail: async (emailId: string) => {
        this.db.prepare('UPDATE emails SET is_starred = 0 WHERE message_id = ?').run(emailId);
      },

      markAsRead: async (emailId: string) => {
        this.db.prepare('UPDATE emails SET is_read = 1 WHERE message_id = ?').run(emailId);
      },

      markAsUnread: async (emailId: string) => {
        this.db.prepare('UPDATE emails SET is_read = 0 WHERE message_id = ?').run(emailId);
      },

      addLabel: async (emailId: string, label: string) => {
        // TODO: Implement label management
        console.log(`Adding label ${label} to email ${emailId}`);
      },

      removeLabel: async (emailId: string, label: string) => {
        // TODO: Implement label management
        console.log(`Removing label ${label} from email ${emailId}`);
      },

      // Send emails
      sendEmail: async (options: any) => {
        // TODO: Implement email sending
        console.log('Sending email:', options);
        return { messageId: 'msg_' + Date.now() };
      },

      // AI/Agent capabilities
      callAgent: async (options: any) => {
        console.log('[ActionContext] callAgent() called:', {
          model: options.model || "haiku",
          promptLength: options.prompt?.length,
          schema: options.schema
        });

        const { client, model } = createLlmClient(options.model);

        const response = await client.messages.create({
          model,
          max_tokens: 4096,
          messages: [
            {
              role: "user",
              content: options.prompt
            }
          ],
          tools: [
            {
              name: "respond",
              description: "Respond with structured data matching the schema",
              input_schema: options.schema
            }
          ],
          tool_choice: { type: "tool", name: "respond" }
        });

        // Extract structured response from tool use
        const toolUse = response.content.find((block) => block.type === "tool_use");
        if (!toolUse || toolUse.type !== "tool_use") {
          throw new Error("Agent did not return structured response");
        }

        console.log('[ActionContext] callAgent() completed');
        return toolUse.input;
      },

      // Session messaging
      addUserMessage: (content: string) => {
        // TODO: Inject message into session
        console.log('Adding user message:', content);
      },

      addAssistantMessage: (content: string) => {
        // TODO: Inject message into session
        console.log('Adding assistant message:', content);
      },

      addSystemMessage: (content: string) => {
        // TODO: Inject message into session
        console.log('Adding system message:', content);
      },

      // Notifications
      notify: (message: string, options?: any) => {
        console.log('Notification:', message, options);
        // Broadcast notification to clients
        this.sendActionInstances(sessionId, [{
          type: 'notification',
          message,
          options
        }]);
      },

      // External API access
      fetch: async (url: string, options?: RequestInit) => {
        return fetch(url, options);
      },

      // Logging
      log: (message: string, level?: string) => {
        const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : 'ℹ️';
        console.log(`${prefix} [Action] ${message}`);
      },

      // UI State operations
      uiState: {
        get: async <T = any>(stateId: string): Promise<T | null> => {
          if (!this.uiStateManager) {
            console.warn('UIStateManager not available');
            return null;
          }
          return await this.uiStateManager.getState<T>(stateId);
        },

        set: async <T = any>(stateId: string, data: T): Promise<void> => {
          if (!this.uiStateManager) {
            console.warn('UIStateManager not available');
            return;
          }
          await this.uiStateManager.setState<T>(stateId, data);
        }
      }
    };
  }

  public cleanup() {
    // Clean up sessions
    for (const session of this.sessions.values()) {
      session.cleanup();
    }
  }
}

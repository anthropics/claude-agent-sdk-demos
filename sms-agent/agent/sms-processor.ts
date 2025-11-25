import { SMSDatabase, type Contact, type Message } from "../database/db";
import { SMSAgent } from "./sms-agent";

export interface IncomingSMS {
  from: string; // Phone number
  body: string; // Message text
  timestamp?: Date;
}

export interface OutgoingSMS {
  to: string;
  body: string;
}

export class SMSProcessor {
  private db: SMSDatabase;
  private agent: SMSAgent;
  private onSendSMS?: (sms: OutgoingSMS) => Promise<void>;

  constructor(db: SMSDatabase, onSendSMS?: (sms: OutgoingSMS) => Promise<void>) {
    this.db = db;
    this.agent = new SMSAgent();
    this.onSendSMS = onSendSMS;
  }

  async processSMS(sms: IncomingSMS): Promise<void> {
    console.log(`Processing SMS from ${sms.from}: ${sms.body}`);

    try {
      // Get or create contact
      const contact = await this.db.getOrCreateContact(sms.from);

      // Save incoming message
      await this.db.saveMessage({
        contact_id: contact.id!,
        phone_number: sms.from,
        message_text: sms.body,
        direction: 'incoming'
      });

      // Get conversation history
      const conversationHistory = await this.db.getConversationHistory(sms.from, 10);

      // Check if we should auto-reply
      const shouldReply = await this.agent.shouldAutoReply({
        contact,
        conversationHistory,
        incomingMessage: sms.body
      });

      if (shouldReply) {
        // Generate response
        const response = await this.agent.generateResponse({
          contact,
          conversationHistory,
          incomingMessage: sms.body
        });

        // Send response
        if (this.onSendSMS) {
          await this.onSendSMS({
            to: sms.from,
            body: response
          });

          // Save outgoing message
          await this.db.saveMessage({
            contact_id: contact.id!,
            phone_number: sms.from,
            message_text: response,
            direction: 'outgoing',
            is_auto_reply: true
          });

          console.log(`Auto-reply sent to ${sms.from}: ${response}`);
        } else {
          console.log(`Would send to ${sms.from}: ${response}`);
        }
      } else {
        console.log(`No auto-reply for ${sms.from} - requires human attention`);
      }
    } catch (error) {
      console.error('Error processing SMS:', error);
    }
  }

  // Manual send method for human-initiated messages
  async sendManualSMS(to: string, message: string): Promise<void> {
    if (this.onSendSMS) {
      await this.onSendSMS({ to, body: message });

      const contact = await this.db.getOrCreateContact(to);
      await this.db.saveMessage({
        contact_id: contact.id!,
        phone_number: to,
        message_text: message,
        direction: 'outgoing',
        is_auto_reply: false
      });
    }
  }

  // Get conversation dashboard data
  async getDashboardData() {
    const recentConversations = await this.db.getRecentConversations(10);
    return {
      recentConversations,
      totalContacts: await this.getContactCount(),
      totalMessages: await this.getMessageCount()
    };
  }

  private async getContactCount(): Promise<number> {
    // Simple way to get count without additional DB methods
    return this.db['db'].query('SELECT COUNT(*) as count FROM contacts').get() as any;
  }

  private async getMessageCount(): Promise<number> {
    return this.db['db'].query('SELECT COUNT(*) as count FROM messages').get() as any;
  }
}
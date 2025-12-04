import { Database } from "bun:sqlite";
import * as path from "path";
import * as fs from "fs";

export interface Contact {
  id?: number;
  phone_number: string;
  name?: string;
  relationship?: string;
  trust_level?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Message {
  id?: number;
  contact_id: number;
  phone_number: string;
  message_text: string;
  direction: 'incoming' | 'outgoing';
  timestamp?: string;
  is_auto_reply?: boolean;
}

export class SMSDatabase {
  private db: Database;

  constructor(dbPath?: string) {
    const defaultPath = path.join(process.cwd(), 'sms-agent.db');
    this.db = new Database(dbPath || defaultPath);
    this.initializeDatabase();
  }

  private initializeDatabase() {
    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    this.db.exec(schema);
  }

  // Contact management
  async getOrCreateContact(phoneNumber: string): Promise<Contact> {
    let contact = this.db.query(`
      SELECT * FROM contacts WHERE phone_number = ?
    `).get(phoneNumber) as Contact;

    if (!contact) {
      const result = this.db.query(`
        INSERT INTO contacts (phone_number, relationship, trust_level)
        VALUES (?, 'unknown', 0)
        RETURNING *
      `).get(phoneNumber) as Contact;
      contact = result;
    }

    return contact;
  }

  async updateContact(phoneNumber: string, updates: Partial<Contact>): Promise<void> {
    const fields = Object.keys(updates).filter(key => key !== 'id').join(' = ?, ') + ' = ?';
    const values = Object.values(updates).filter((_, i) => Object.keys(updates)[i] !== 'id');

    this.db.query(`
      UPDATE contacts SET ${fields}, updated_at = CURRENT_TIMESTAMP
      WHERE phone_number = ?
    `).run(...values, phoneNumber);
  }

  // Message management
  async saveMessage(message: Omit<Message, 'id'>): Promise<number> {
    const result = this.db.query(`
      INSERT INTO messages (contact_id, phone_number, message_text, direction, is_auto_reply)
      VALUES (?, ?, ?, ?, ?)
      RETURNING id
    `).get(
      message.contact_id,
      message.phone_number,
      message.message_text,
      message.direction,
      message.is_auto_reply || false
    ) as { id: number };

    return result.id;
  }

  async getConversationHistory(phoneNumber: string, limit: number = 10): Promise<Message[]> {
    return this.db.query(`
      SELECT * FROM messages
      WHERE phone_number = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(phoneNumber, limit) as Message[];
  }

  async getRecentConversations(limit: number = 5): Promise<{ phoneNumber: string; lastMessage: string; timestamp: string }[]> {
    return this.db.query(`
      SELECT DISTINCT phone_number as phoneNumber,
                      message_text as lastMessage,
                      timestamp
      FROM messages m1
      WHERE timestamp = (
        SELECT MAX(timestamp)
        FROM messages m2
        WHERE m2.phone_number = m1.phone_number
      )
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(limit) as { phoneNumber: string; lastMessage: string; timestamp: string }[];
  }

  close() {
    this.db.close();
  }
}
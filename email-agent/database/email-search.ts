const Imap = require("node-imap");
const { simpleParser } = require("mailparser");
require("dotenv").config();

interface ImapConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
  tlsOptions: { servername: string };
  connTimeout?: number;
  authTimeout?: number;
  keepalive?: boolean;
}

interface EmailSummary {
  from: string;
  to: string;
  subject: string;
  date: string | Date;
  text: string;
  uid: number;
}

interface ParsedMail {
  from?: { text?: string };
  to?: { text?: string };
  subject?: string;
  date?: Date;
  text?: string;
}

export class EmailSearcher {
  private imapConfig: ImapConfig;
  private imap: any;

  constructor(config: ImapConfig | null = null) {
    // Use provided config or create from environment variables
    if (config) {
      this.imapConfig = config;
    } else {
      const APP_PASSWORD = process.env.EMAIL_APP_PASSWORD;
      const EMAIL = process.env.EMAIL_ADDRESS;

      if (!APP_PASSWORD || !EMAIL) {
        console.error("Error: Email credentials not found!");
        console.error(
          "Please create a .env file with EMAIL_ADDRESS and EMAIL_APP_PASSWORD",
        );
        process.exit(1);
      }

      // Debug: Check credentials are loaded (removed sensitive logging)

      this.imapConfig = {
        user: EMAIL,
        password: APP_PASSWORD,
        host: "imap.gmail.com",
        port: 993,
        tls: true,
        tlsOptions: { servername: "imap.gmail.com" },
        connTimeout: 60000, // 60 seconds
        authTimeout: 30000, // 30 seconds
        keepalive: true,
      };
    }

    this.imap = new Imap(this.imapConfig);
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.imap.once("ready", resolve);
      this.imap.once("error", reject);
      this.imap.connect();
    });
  }

  openInbox(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.imap.openBox("INBOX", true, (err: Error | null, box: any) => {
        if (err) reject(err);
        else resolve(box);
      });
    });
  }

  openFolder(folderName: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.imap.openBox(folderName, true, (err: Error | null, box: any) => {
        if (err) reject(err);
        else resolve(box);
      });
    });
  }

  searchEmails(criteria: any[]): Promise<number[]> {
    return new Promise((resolve, reject) => {
      this.imap.search(criteria, (err: Error | null, results: number[]) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  fetchEmail(uid: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const fetch = this.imap.fetch(uid, { bodies: "" });
      const emailChunks: Buffer[] = [];
      let emailSize = 0;
      let resolved = false;

      // Keep track of listeners for cleanup
      const listeners: Array<{
        target: any;
        event: string;
        handler: Function;
      }> = [];

      const cleanup = () => {
        listeners.forEach(({ target, event, handler }) => {
          if (target && typeof target.removeListener === "function") {
            target.removeListener(event, handler);
          }
        });
        listeners.length = 0;
      };

      const safeResolve = (result: any) => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve(result);
        }
      };

      const safeReject = (error: Error) => {
        if (!resolved) {
          resolved = true;
          cleanup();
          reject(error);
        }
      };

      const messageHandler = (msg: any) => {
        const bodyHandler = (stream: any) => {
          const dataHandler = (chunk: Buffer) => {
            // Add memory bounds checking (max 50MB per email)
            const chunkSize = chunk.length;
            if (emailSize + chunkSize > 50 * 1024 * 1024) {
              safeReject(new Error("Email too large (exceeds 50MB limit)"));
              return;
            }
            emailChunks.push(chunk);
            emailSize += chunkSize;
          };

          listeners.push({
            target: stream,
            event: "data",
            handler: dataHandler,
          });
          stream.on("data", dataHandler);
        };

        const endHandler = () => {
          simpleParser(
            Buffer.concat(emailChunks, emailSize),
            (err: Error | null, parsed: any) => {
              if (err) safeReject(err);
              else safeResolve(parsed);
            },
          );
        };

        listeners.push({ target: msg, event: "body", handler: bodyHandler });
        listeners.push({ target: msg, event: "end", handler: endHandler });

        msg.on("body", bodyHandler);
        msg.once("end", endHandler);
      };

      const errorHandler = (error: Error) => {
        safeReject(error);
      };

      const fetchEndHandler = () => {
        if (emailSize === 0 && !resolved) {
          safeReject(new Error("No email data received"));
        }
      };

      listeners.push({
        target: fetch,
        event: "message",
        handler: messageHandler,
      });
      listeners.push({ target: fetch, event: "error", handler: errorHandler });
      listeners.push({ target: fetch, event: "end", handler: fetchEndHandler });

      fetch.on("message", messageHandler);
      fetch.once("error", errorHandler);
      fetch.once("end", fetchEndHandler);
    });
  }

  disconnect(): void {
    this.imap.end();
  }

  async search(searchCriteria: any[]): Promise<EmailSummary[]> {
    try {
      console.log("Connecting to email server...");
      await this.connect();

      console.log("Opening inbox...");
      await this.openInbox();

      console.log("Searching emails...");
      const uids = await this.searchEmails(searchCriteria);

      if (uids.length === 0) {
        console.log("No emails found matching the criteria.");
        return [];
      }

      console.log(`Found ${uids.length} emails. Fetching details...`);
      const emails: EmailSummary[] = [];

      // Limit to first 10 emails for performance
      const limitedUids = uids.slice(0, 10);

      for (const uid of limitedUids) {
        try {
          const email = await this.fetchEmail(uid);
          emails.push({
            from: email.from?.text || "Unknown",
            to: email.to?.text || "Unknown",
            subject: email.subject || "No Subject",
            date: email.date || "Unknown Date",
            text: email.text?.substring(0, 200) || "No Text Content",
            uid: uid,
          });
        } catch (err) {
          console.error(`Error fetching email ${uid}:`, (err as Error).message);
        }
      }

      return emails;
    } catch (error) {
      console.error("Error:", (error as Error).message);
      throw error;
    } finally {
      this.disconnect();
    }
  }
}

// Example usage
async function main(): Promise<void> {
  const searcher = new EmailSearcher();

  // Example search criteria - you can modify these
  // Search for emails from a specific sender
  // const criteria = [['FROM', 'example@email.com']];

  // Search for emails with specific subject
  // const criteria = [['SUBJECT', 'Meeting']];

  // Search for emails since a specific date
  // const criteria = [['SINCE', new Date('2024-01-01')]];

  // Search for unread emails
  // const criteria = ['UNSEEN'];

  // Combined criteria: from specific sender AND with specific subject
  // const criteria = [['FROM', 'example@email.com'], ['SUBJECT', 'Important']];

  // Default: Get recent emails (last 10 days)
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
  const criteria = [["SINCE", tenDaysAgo]];

  try {
    const emails = await searcher.search(criteria);

    console.log("\n=== Search Results ===\n");
    emails.forEach((email, index) => {
      console.log(`Email ${index + 1}:`);
      console.log(`From: ${email.from}`);
      console.log(`To: ${email.to}`);
      console.log(`Subject: ${email.subject}`);
      console.log(`Date: ${email.date}`);
      console.log(`Preview: ${email.text}`);
      console.log("-".repeat(50));
    });
  } catch (error) {
    console.error("Failed to search emails:", (error as Error).message);
  }
}

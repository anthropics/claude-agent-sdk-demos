import { SMSDatabase } from "../database/db";
import { SMSProcessor, type IncomingSMS, type OutgoingSMS } from "../agent/sms-processor";

// Simple HTTP server for SMS webhooks
export class SMSServer {
  private processor: SMSProcessor;
  private port: number;

  constructor(port: number = 3001) {
    this.port = port;

    // Initialize database and processor
    const db = new SMSDatabase();
    this.processor = new SMSProcessor(db, this.sendSMS.bind(this));
  }

  // Mock SMS sending function - replace with actual SMS service
  private async sendSMS(sms: OutgoingSMS): Promise<void> {
    console.log(`📱 SENDING SMS to ${sms.to}: ${sms.body}`);

    // Here you would integrate with actual SMS service like:
    // - Twilio
    // - AWS SNS
    // - Other SMS providers

    // For demo purposes, we just log it
    // In production, you'd make API call to SMS service
  }

  async start() {
    const server = Bun.serve({
      port: this.port,
      async fetch(req) {
        const url = new URL(req.url);

        // SMS webhook endpoint
        if (url.pathname === "/webhook/sms" && req.method === "POST") {
          try {
            const body = await req.json();

            // Expected webhook format (adapt to your SMS provider)
            const sms: IncomingSMS = {
              from: body.from || body.From, // Twilio uses "From"
              body: body.body || body.Body, // Twilio uses "Body"
              timestamp: new Date()
            };

            // Process the SMS
            await this.processor.processSMS(sms);

            return new Response("OK", { status: 200 });
          } catch (error) {
            console.error("Webhook error:", error);
            return new Response("Error", { status: 500 });
          }
        }

        // Manual send endpoint
        if (url.pathname === "/send" && req.method === "POST") {
          try {
            const { to, message } = await req.json();
            await this.processor.sendManualSMS(to, message);
            return new Response("Message sent", { status: 200 });
          } catch (error) {
            console.error("Send error:", error);
            return new Response("Error", { status: 500 });
          }
        }

        // Dashboard data endpoint
        if (url.pathname === "/dashboard" && req.method === "GET") {
          try {
            const data = await this.processor.getDashboardData();
            return new Response(JSON.stringify(data), {
              headers: { "Content-Type": "application/json" }
            });
          } catch (error) {
            console.error("Dashboard error:", error);
            return new Response("Error", { status: 500 });
          }
        }

        // Health check
        if (url.pathname === "/health") {
          return new Response("OK", { status: 200 });
        }

        return new Response("Not Found", { status: 404 });
      }
    });

    console.log(`🚀 SMS Response Assistant running on http://localhost:${this.port}`);
    console.log(`📥 Webhook endpoint: http://localhost:${this.port}/webhook/sms`);
    console.log(`📤 Manual send endpoint: http://localhost:${this.port}/send`);
    console.log(`📊 Dashboard endpoint: http://localhost:${this.port}/dashboard`);
  }
}

// Start server if this file is run directly
if (import.meta.main) {
  const server = new SMSServer();
  server.start();
}
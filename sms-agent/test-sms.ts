#!/usr/bin/env bun

/**
 * Simple test script to demonstrate SMS Response Assistant functionality
 */

import { SMSDatabase } from "./database/db";
import { SMSProcessor, type IncomingSMS } from "./agent/sms-processor";

async function testSMSAssistant() {
  console.log("🧪 Testing SMS Response Assistant...\n");

  // Initialize components
  const db = new SMSDatabase(":memory:"); // Use in-memory DB for testing
  const processor = new SMSProcessor(db, async (sms) => {
    console.log(`📤 Would send SMS to ${sms.to}: "${sms.body}"\n`);
  });

  // Test scenarios
  const testMessages: IncomingSMS[] = [
    {
      from: "+1234567890",
      body: "Hey! How are you doing?",
      timestamp: new Date()
    },
    {
      from: "+1234567890",
      body: "Are you free for coffee tomorrow?",
      timestamp: new Date()
    },
    {
      from: "+9876543210",
      body: "Hi, this is John from the conference. Nice meeting you!",
      timestamp: new Date()
    },
    {
      from: "+1111111111",
      body: "URGENT: Please call me back ASAP!",
      timestamp: new Date()
    }
  ];

  // Process each test message
  for (const [index, message] of testMessages.entries()) {
    console.log(`📥 Test ${index + 1}: Processing SMS from ${message.from}`);
    console.log(`   Message: "${message.body}"`);

    await processor.processSMS(message);

    // Add a small delay for readability
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Show dashboard data
  console.log("📊 Dashboard Data:");
  const dashboard = await processor.getDashboardData();
  console.log(JSON.stringify(dashboard, null, 2));

  // Cleanup
  db.close();
  console.log("\n✅ Test completed!");
}

// Run the test
if (import.meta.main) {
  testSMSAssistant().catch(console.error);
}
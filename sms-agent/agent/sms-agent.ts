import { query } from "@anthropic-ai/claude-code";
import type { Contact, Message } from "../database/db";

export interface SMSContext {
  contact: Contact;
  conversationHistory: Message[];
  incomingMessage: string;
}

export class SMSAgent {
  private systemPrompt = `You are an SMS response assistant. Your job is to generate appropriate text message responses based on:

1. The incoming message content
2. The conversation history with this contact
3. The relationship context (family, friend, work, unknown)
4. The trust level of the contact (0=unknown, 1=acquaintance, 2=trusted, 3=verified)

Guidelines:
- Keep responses concise and natural for SMS format
- Match the tone and formality level of the conversation
- For unknown contacts (trust_level 0), be polite but cautious about sharing personal information
- For trusted contacts, you can be more casual and share appropriate personal updates
- If someone asks for personal information and they're not verified (trust_level < 3), politely decline
- Always be helpful and friendly

Respond with ONLY the SMS message text. Do not include any explanations or formatting.`;

  async generateResponse(context: SMSContext): Promise<string> {
    const { contact, conversationHistory, incomingMessage } = context;

    // Build conversation context
    const recentMessages = conversationHistory
      .slice(0, 5) // Last 5 messages for context
      .reverse() // Chronological order
      .map(msg => `${msg.direction === 'incoming' ? contact.name || contact.phone_number : 'You'}: ${msg.message_text}`)
      .join('\n');

    const contextInfo = `
Contact: ${contact.name || 'Unknown'} (${contact.phone_number})
Relationship: ${contact.relationship || 'unknown'}
Trust Level: ${contact.trust_level}/3

Recent conversation:
${recentMessages}

New incoming message: ${incomingMessage}

Generate an appropriate SMS response:`;

    try {
      const messages: any[] = [];

      for await (const message of query({
        prompt: contextInfo,
        options: {
          maxTurns: 1,
          model: "claude-3-5-sonnet-20241022",
          appendSystemPrompt: this.systemPrompt,
          allowedTools: [] // No tools needed for simple text generation
        }
      })) {
        messages.push(message);
      }

      // Extract the response from the last assistant message
      const lastMessage = messages.findLast(m => m.type === 'assistant');
      if (lastMessage && typeof lastMessage.message.content === 'string') {
        return lastMessage.message.content.trim();
      }

      throw new Error('No valid response generated');
    } catch (error) {
      console.error('Error generating SMS response:', error);
      return "Thanks for your message! I'll get back to you soon.";
    }
  }

  async shouldAutoReply(context: SMSContext): Promise<boolean> {
    const { contact, incomingMessage } = context;

    // Simple rules for auto-reply
    const message = incomingMessage.toLowerCase();

    // Don't auto-reply to unknown contacts with low trust
    if (contact.trust_level === 0 && !contact.relationship) {
      return false;
    }

    // Don't auto-reply to very short messages that might be accidental
    if (message.length < 3) {
      return false;
    }

    // Don't auto-reply to messages that seem like they need human attention
    const humanAttentionKeywords = ['urgent', 'emergency', 'important', 'asap', 'help'];
    if (humanAttentionKeywords.some(keyword => message.includes(keyword))) {
      return false;
    }

    return true;
  }
}
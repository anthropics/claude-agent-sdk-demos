/**
 * Agent Demo - Claude using cldash utilities
 *
 * This demonstrates an agent using cldash to run tests and verify results.
 * Shows the "meta" value: using Claude Code to build better Claude Code workflows.
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import * as path from 'path';

const PROMPT = `You are a test automation agent. Your task is to validate the cldash demo.

You have access to cldash utilities in the ./lib directory:
- exec(command, options) - Structured bash execution
- assert(condition, message) - Explicit verification
- retry(operation, options) - Resilient operations
- pipe(...fns) - Function composition

Your task:
1. Read the demo.ts file to understand what it does
2. Run the demo using: npx tsx demo.ts
3. Verify the demo completes successfully
4. Use cldash utilities if you need to perform additional checks

Remember: cldash makes your verification workflow explicit and structured!
`;

async function main() {
  console.log('🤖 Starting Agent Demo\n');
  console.log('Agent will use cldash utilities to verify the demo...\n');
  console.log('=' .repeat(60));
  console.log('');

  const q = query({
    prompt: PROMPT,
    options: {
      maxTurns: 20,
      cwd: path.join(process.cwd(), 'cldash'),
      model: 'sonnet',
      executable: 'node',
      allowedTools: [
        'Read',
        'Write',
        'Bash',
        'Glob',
        'Grep',
        'TodoWrite',
        'Task',
      ],
    },
  });

  for await (const message of q) {
    if (message.type === 'assistant' && message.message) {
      const textContent = message.message.content.find(
        (c: any) => c.type === 'text'
      );
      if (textContent && 'text' in textContent) {
        console.log('🤖 Claude:', textContent.text);
        console.log('');
      }
    }

    // Show tool calls
    if (message.type === 'assistant' && message.message) {
      const toolCalls = message.message.content.filter(
        (c: any) => c.type === 'tool_use'
      );
      toolCalls.forEach((tool: any) => {
        console.log(`🔧 Tool: ${tool.name}`);
      });
    }

    // Show tool results
    if (message.type === 'result' && message.message) {
      const results = message.message.content;
      results.forEach((result: any) => {
        if (result.type === 'tool_result') {
          const preview =
            typeof result.content === 'string'
              ? result.content.substring(0, 200)
              : JSON.stringify(result.content).substring(0, 200);
          console.log(`✓ Result: ${preview}${preview.length >= 200 ? '...' : ''}`);
          console.log('');
        }
      });
    }
  }

  console.log('=' .repeat(60));
  console.log('\n✅ Agent demo complete!\n');
}

main().catch(console.error);

/**
 * Resume Generator using Claude Agent SDK
 *
 * This example uses web search to research a person and generates
 * a professional 1-page resume as a .docx file.
 *
 * Usage: npx tsx resume-generator.ts "Person Name"
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import * as fs from 'fs';
import * as path from 'path';

const SYSTEM_PROMPT = `You are a professional resume writer. Research a person and create a 1-page .docx resume.

WORKFLOW:
1. WebSearch for the person's background (LinkedIn, GitHub, company pages)
2. Create a .docx file using the docx library

OUTPUT:
- Script: agent/custom_scripts/generate_resume.js
- Resume: agent/custom_scripts/resume.docx

PAGE FIT (must be exactly 1 page):
- 0.5 inch margins, Name 24pt, Headers 12pt, Body 10pt
- 2-3 bullet points per job, ~80-100 chars each
- Max 3 job roles, 2-line summary, 2-line skills`;

async function generateResume(personName: string) {
  console.log(`\n📝 Generating resume for: ${personName}\n`);
  console.log('='.repeat(50));

  // Ensure the output directory exists
  const outputDir = path.join(process.cwd(), 'agent', 'custom_scripts');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const prompt = `Research "${personName}" and create a professional 1-page resume as a .docx file. Search for their professional background, experience, education, and skills.`;

  console.log('\n🔍 Researching and creating resume...\n');

  const q = query({
    prompt,
    options: {
      maxTurns: 30,
      cwd: process.cwd(),
      model: 'sonnet',
      allowedTools: ['Skill', 'WebSearch', 'WebFetch', 'Bash', 'Write', 'Read', 'Glob'],
      settingSources: ['project'],  // Load skills from .claude/skills/
      systemPrompt: SYSTEM_PROMPT,
    },
  });

  for await (const msg of q) {
    if (msg.type === 'assistant' && msg.message) {
      for (const block of msg.message.content) {
        if (block.type === 'text') {
          console.log(block.text);
        }
        if (block.type === 'tool_use') {
          if (block.name === 'WebSearch' && block.input && typeof block.input === 'object' && 'query' in block.input) {
            console.log(`\n🔍 Searching: "${block.input.query}"`);
          } else {
            console.log(`\n🔧 Using tool: ${block.name}`);
          }
        }
      }
    }
    if (msg.type === 'result') {
      if (msg.subtype === 'tool_result') {
        const resultStr = JSON.stringify(msg.content).slice(0, 200);
        console.log(`   ↳ Result: ${resultStr}${resultStr.length >= 200 ? '...' : ''}`);
      }
    }
  }

  // Check if resume was created
  const expectedPath = path.join(process.cwd(), 'agent', 'custom_scripts', 'resume.docx');
  if (fs.existsSync(expectedPath)) {
    console.log('\n' + '='.repeat(50));
    console.log(`📄 Resume saved to: ${expectedPath}`);
    console.log('='.repeat(50) + '\n');
  } else {
    console.log('\n❌ Resume file was not created. Check the output above for errors.');
  }
}

// Main entry point
const personName = process.argv[2];
if (!personName) {
  console.log('Usage: npx tsx resume-generator.ts "Person Name"');
  console.log('Example: npx tsx resume-generator.ts "Jane Doe"');
  process.exit(1);
}

generateResume(personName).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

/**
 * Resume Tailor using Claude Agent SDK
 *
 * Takes an existing resume and tailors it for a specific job description.
 * Optimizes keywords, highlights relevant experience, and adjusts focus.
 *
 * Usage: npx tsx resume-tailor.ts <resume.docx> <job-description.txt>
 * Example: npx tsx resume-tailor.ts my-resume.docx software-engineer-jd.txt
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import * as fs from 'fs';
import * as path from 'path';

const SYSTEM_PROMPT = `You are an expert resume consultant specializing in ATS (Applicant Tracking System) optimization and job-specific tailoring.

WORKFLOW:
1. Read the existing resume (.docx) and convert to markdown using pandoc
2. Read the job description (.txt or .md)
3. Analyze the JD for:
   - Required skills and keywords
   - Preferred experience
   - Key responsibilities
   - Company culture indicators
4. Analyze the resume for:
   - Relevant experiences that match JD
   - Skills that align with requirements
   - Achievements that demonstrate fit
5. Create a tailored resume that:
   - Highlights most relevant experience prominently
   - Incorporates JD keywords naturally
   - Reorders sections for maximum impact
   - Adjusts bullet points to emphasize matching skills
   - Maintains truthfulness (no fabrication)
   - Stays within 1 page if original was 1 page

OPTIMIZATION STRATEGIES:
- Mirror JD language in resume (e.g., if JD says "led teams", use "led" not "managed")
- Quantify achievements that match JD priorities
- Front-load relevant experience
- Add a targeted summary if beneficial
- Match technical skills section to JD requirements
- Remove or de-emphasize less relevant experience

OUTPUT:
- Analysis: agent/custom_scripts/tailoring_analysis.md
- Script: agent/custom_scripts/tailor_resume.js
- Tailored Resume: agent/custom_scripts/tailored_resume.docx

FORMATTING:
- Match original resume's formatting style
- 0.5-0.75 inch margins
- Professional fonts (Calibri, Arial, Times New Roman)
- Consistent bullet point style
- ATS-friendly (no tables, images, or complex formatting)`;

async function tailorResume(resumePath: string, jdPath: string) {
  console.log('\n📄 Resume Tailoring Agent\n');
  console.log('='.repeat(60));

  // Validate inputs
  if (!fs.existsSync(resumePath)) {
    console.error(`❌ Resume file not found: ${resumePath}`);
    process.exit(1);
  }

  if (!fs.existsSync(jdPath)) {
    console.error(`❌ Job description file not found: ${jdPath}`);
    process.exit(1);
  }

  // Get absolute paths
  const absResumePath = path.resolve(resumePath);
  const absJdPath = path.resolve(jdPath);

  // Ensure output directory exists
  const outputDir = path.join(process.cwd(), 'agent', 'custom_scripts');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`\n📋 Input Resume: ${path.basename(resumePath)}`);
  console.log(`💼 Job Description: ${path.basename(jdPath)}`);
  console.log('\n' + '='.repeat(60));

  const prompt = `Tailor the resume at "${absResumePath}" for the job described in "${absJdPath}".

INSTRUCTIONS:
1. First, convert the resume to markdown: pandoc --to markdown "${absResumePath}" -o agent/custom_scripts/original_resume.md
2. Read the job description from "${absJdPath}"
3. Create a detailed analysis in agent/custom_scripts/tailoring_analysis.md showing:
   - Key requirements from JD
   - Matching experience from resume
   - Optimization strategy
   - Keyword mapping
4. Generate a tailored version of the resume as .docx that:
   - Emphasizes relevant experience
   - Uses JD keywords appropriately
   - Maintains truthfulness
   - Follows ATS best practices

Focus on making the resume stand out for THIS specific position while maintaining authenticity.`;

  console.log('\n🔍 Analyzing job requirements and resume...\n');

  const q = query({
    prompt,
    options: {
      maxTurns: 40,
      cwd: process.cwd(),
      model: 'sonnet',
      allowedTools: ['Skill', 'Bash', 'Write', 'Read', 'Glob', 'Grep'],
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
          console.log(`\n🔧 ${block.name}`);
        }
      }
    }
    if (msg.type === 'result') {
      if (msg.subtype === 'tool_result' && msg.content) {
        const resultStr = JSON.stringify(msg.content).slice(0, 150);
        if (!resultStr.includes('Command completed')) {
          console.log(`   ↳ ${resultStr}${resultStr.length >= 150 ? '...' : ''}`);
        }
      }
    }
  }

  // Check outputs
  console.log('\n' + '='.repeat(60));

  const analysisPath = path.join(outputDir, 'tailoring_analysis.md');
  const tailoredPath = path.join(outputDir, 'tailored_resume.docx');

  if (fs.existsSync(analysisPath)) {
    console.log(`✅ Analysis: ${analysisPath}`);
  }

  if (fs.existsSync(tailoredPath)) {
    console.log(`✅ Tailored Resume: ${tailoredPath}`);
  } else {
    console.log('\n⚠️  Tailored resume was not created. Check output above.');
  }

  console.log('='.repeat(60) + '\n');
}

// Main entry point
const resumePath = process.argv[2];
const jdPath = process.argv[3];

if (!resumePath || !jdPath) {
  console.log('Usage: npx tsx resume-tailor.ts <resume.docx> <job-description.txt>');
  console.log('\nExamples:');
  console.log('  npx tsx resume-tailor.ts my-resume.docx senior-swe-jd.txt');
  console.log('  npx tsx resume-tailor.ts current.docx product-manager.md');
  console.log('\nThe tool will:');
  console.log('  1. Analyze the job description for key requirements');
  console.log('  2. Identify matching experience in your resume');
  console.log('  3. Generate a tailored version optimized for the role');
  console.log('  4. Create an analysis document explaining changes\n');
  process.exit(1);
}

tailorResume(resumePath, jdPath).catch(console.error);

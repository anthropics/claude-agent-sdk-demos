/**
 * Resume Tailor Web Server
 * Express server with file upload and real-time progress updates
 */

import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import multer from 'multer';
import { query } from '@anthropic-ai/claude-agent-sdk';
import * as fs from 'fs';
import * as path from 'path';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = 3002;
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const OUTPUT_DIR = path.join(process.cwd(), 'agent', 'custom_scripts');

// Ensure directories exist
[UPLOAD_DIR, OUTPUT_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.originalname.endsWith('.docx')) {
      cb(null, true);
    } else {
      cb(new Error('Only .docx files are allowed'));
    }
  }
});

app.use(express.json());
app.use(express.static('public'));

// Serve uploaded/generated files
app.use('/files', express.static(OUTPUT_DIR));
app.use('/uploads', express.static(UPLOAD_DIR));
app.use('/examples', express.static('examples'));

// WebSocket connections
const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.send(JSON.stringify({ type: 'connected' }));

  ws.on('close', () => {
    clients.delete(ws);
  });
});

function broadcast(message: any) {
  const data = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

const SYSTEM_PROMPT = `You are an expert resume consultant specializing in ATS optimization and job-specific tailoring with web research capabilities.

CRITICAL: Work efficiently - you have limited turns. Focus on HIGH-IMPACT research (company + 1-2 key technologies), then move quickly to document generation.

WORKFLOW:
1. Read the existing resume (.docx) and convert to markdown using pandoc
2. Analyze the job description for:
   - Required skills and keywords
   - Company culture and values
   - Specific technologies mentioned
   - Industry context
3. RESEARCH PHASE (if beneficial):
   - WebSearch for the company to understand their products/mission
   - Research mentioned technologies/frameworks to use correct terminology
   - Look up industry best practices for this role type
   - Find quantifiable metrics typical for this role
   - Enrich resume with relevant context WITHOUT fabrication
4. TAILORING PHASE:
   - Map existing experience to JD requirements
   - Incorporate researched company context
   - Use industry-standard terminology from research
   - Quantify achievements using researched benchmarks
   - Add relevant skills found in research that user likely has
5. Create tailored resume and analysis

OUTPUT:
- Analysis: agent/custom_scripts/tailoring_analysis.md
- Script: agent/custom_scripts/tailor_resume.js
- Tailored Resume: agent/custom_scripts/tailored_resume.docx
- Cover Letter (if requested): agent/custom_scripts/cover_letter.md

ENRICHMENT STRATEGIES (using web research):
- Company research: "If applying to TechCorp, research their AI platform to contextualize experience"
- Technology depth: "If JD mentions PyTorch, research it to use proper terminology"
- Role context: "Research typical metrics for ML Engineer roles to quantify achievements"
- Industry standards: "Look up common responsibilities to identify transferable skills"
- Skill validation: "If user has 'data pipelines', research ML pipeline terminology"

OPTIMIZATION:
- Mirror JD language exactly
- Incorporate researched company mission/values
- Use technically accurate terminology from research
- Quantify with industry-appropriate metrics
- Front-load relevant experience
- Match technical skills to JD requirements
- Maintain 100% truthfulness (research enriches, never fabricates)
- Keep 1-page format if original was 1-page
- ATS-friendly (no tables, images, complex formatting)

COVER LETTER FORMAT (when requested):
- 3-4 paragraphs, under 400 words
- Opening: compelling hook connecting background to this specific role
- Body: 2 paragraphs connecting specific experience to top JD requirements
- Closing: enthusiasm + call to action
- Personalize to the company mission/values found in research
- Professional but genuine tone

CRITICAL: Research ENRICHES existing experience, never invents new experience.`;

// Tailoring endpoint
app.post('/api/tailor', upload.single('resume'), async (req, res) => {
  try {
    const resumeFile = req.file;
    const jobDescriptionUrl = req.body.jobDescriptionUrl;
    const jobDescription = req.body.jobDescription;
    const enableWebSearch = req.body.enableWebSearch === 'true';
    const generateCoverLetter = req.body.generateCoverLetter === 'true';
    const jobTitle = req.body.jobTitle || 'this position';
    const companyName = req.body.companyName || 'the company';

    if (!resumeFile || (!jobDescriptionUrl && !jobDescription)) {
      return res.status(400).json({ error: 'Resume file and job description (URL or text) required' });
    }

    broadcast({ type: 'status', message: 'Starting tailoring process...' });

    const resumePath = path.resolve(resumeFile.path);
    let prompt: string;

    const researchPhase = enableWebSearch
      ? `4. RESEARCH PHASE (use WebSearch strategically - LIMIT TO 3-5 SEARCHES MAX):
   - ONE search for the company (mission/products/recent news)
   - ONE search for the most important/unfamiliar technology mentioned in JD
   - ONE search for role-specific best practices or benchmarks
   - SKIP research if terms are already familiar (e.g., React, Python, AWS)
   - Focus research on enriching existing experience, never fabricating`
      : `4. SKIP WEB RESEARCH (disabled by user) - work only with information in the resume and job description`;

    if (jobDescriptionUrl) {
      // Use URL-based approach
      prompt = `Tailor the resume at "${resumePath}" for the job posting at this URL: ${jobDescriptionUrl}

INSTRUCTIONS:
1. Fetch the job description from the URL using WebFetch
2. Convert resume to markdown: node convert-resume.js "${resumePath}"
3. Read and analyze the fetched job description
${researchPhase}
5. Create tailoring_analysis.md with:
   - Key JD requirements
   - Research findings (company info, tech context, benchmarks)
   - Matching experience from resume
   - Enrichment opportunities (how research enhances existing points)
   - Optimization strategy
   - Keyword mapping
6. Generate tailored_resume.docx that:
   - Emphasizes relevant experience with researched context
   - Uses JD keywords and proper technical terminology
   - Incorporates company mission/values where relevant
   - Quantifies achievements with industry-appropriate metrics
   - Maintains 100% truthfulness (research enriches, never fabricates)
   - Follows ATS best practices

Example enrichment:
ORIGINAL: "Built data pipeline processing 500GB daily"
RESEARCHED: Company uses ML models, role focuses on model training
ENRICHED: "Architected scalable ML data pipeline processing 500GB daily, enabling efficient model training workflows"

Focus on making existing experience MORE RELEVANT through research, not inventing new experience.`;
    } else {
      // Use text-based approach
      const jdPath = path.join(UPLOAD_DIR, `${Date.now()}-jd.txt`);
      fs.writeFileSync(jdPath, jobDescription);

      prompt = `Tailor the resume at "${resumePath}" for the job described in "${jdPath}".

INSTRUCTIONS:
1. Convert resume to markdown: node convert-resume.js "${resumePath}"
2. Read and analyze the job description
${researchPhase}
4. Create tailoring_analysis.md with:
   - Key JD requirements
   - Research findings (company info, tech context, benchmarks)
   - Matching experience from resume
   - Enrichment opportunities (how research enhances existing points)
   - Optimization strategy
   - Keyword mapping
5. Generate tailored_resume.docx that:
   - Emphasizes relevant experience with researched context
   - Uses JD keywords and proper technical terminology
   - Incorporates company mission/values where relevant
   - Quantifies achievements with industry-appropriate metrics
   - Maintains 100% truthfulness (research enriches, never fabricates)
   - Follows ATS best practices

Example enrichment:
ORIGINAL: "Built data pipeline processing 500GB daily"
RESEARCHED: Company uses ML models, role focuses on model training
ENRICHED: "Architected scalable ML data pipeline processing 500GB daily, enabling efficient model training workflows"

Focus on making existing experience MORE RELEVANT through research, not inventing new experience.`;
    }

    if (generateCoverLetter) {
      prompt += `

ALSO GENERATE A COVER LETTER:
After creating the tailored resume, write a personalized cover letter to agent/custom_scripts/cover_letter.md for the role "${jobTitle}" at "${companyName}".
Use the research you've already done and the tailored resume content to write a compelling, specific cover letter following the COVER LETTER FORMAT in the system prompt.`;
    }

    broadcast({ type: 'status', message: 'Analyzing job requirements...' });

    const q = query({
      prompt,
      options: {
        maxTurns: 50,
        cwd: process.cwd(),
        model: 'sonnet',
        allowedTools: ['Skill', 'WebSearch', 'WebFetch', 'Bash', 'Write', 'Read', 'Glob', 'Grep'],
        settingSources: ['project'],
        systemPrompt: SYSTEM_PROMPT,
      },
    });

    for await (const msg of q) {
      if (msg.type === 'assistant' && msg.message) {
        for (const block of msg.message.content) {
          if (block.type === 'text') {
            broadcast({ type: 'progress', message: block.text });
          }
          if (block.type === 'tool_use') {
            broadcast({ type: 'tool', name: block.name });
          }
        }
      }
    }

    // Check outputs
    const analysisPath = path.join(OUTPUT_DIR, 'tailoring_analysis.md');
    const tailoredPath = path.join(OUTPUT_DIR, 'tailored_resume.docx');

    const result: any = {
      success: true,
      files: {}
    };

    if (fs.existsSync(analysisPath)) {
      result.files.analysis = '/files/tailoring_analysis.md';
      result.analysisContent = fs.readFileSync(analysisPath, 'utf-8');
    }

    if (fs.existsSync(tailoredPath)) {
      result.files.resume = '/files/tailored_resume.docx';
    }

    const coverLetterPath = path.join(OUTPUT_DIR, 'cover_letter.md');
    if (fs.existsSync(coverLetterPath)) {
      result.files.coverLetter = '/files/cover_letter.md';
      result.coverLetterContent = fs.readFileSync(coverLetterPath, 'utf-8');
    }

    broadcast({ type: 'complete', result });
    res.json(result);

  } catch (error) {
    console.error('Error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    broadcast({ type: 'error', message: errorMsg });
    res.status(500).json({ error: errorMsg });
  }
});

// Job Search endpoint
app.post('/api/search-jobs', async (req, res) => {
  try {
    const { keywords, location, remote, experience, jobType } = req.body;

    // For now, return demo data
    // TODO: Integrate with real job APIs (LinkedIn, Indeed, etc.)
    const demoJobs = [
      {
        id: `job-${Date.now()}-1`,
        title: `Senior ${keywords} Engineer`,
        company: 'Anthropic',
        location: location || 'San Francisco, CA',
        salary: '$200k - $350k',
        type: jobType || 'Full-time',
        remote: remote ? 'Remote' : 'Hybrid',
        url: 'https://job-boards.greenhouse.io/anthropic/jobs/5098984008',
        description: `We're seeking an experienced ${keywords} to work on cutting-edge AI safety research. You'll collaborate with world-class researchers to build systems that advance the state of the art while prioritizing safety and alignment.`,
        postedDate: '2 days ago',
        logo: '🤖'
      },
      {
        id: `job-${Date.now()}-2`,
        title: `${keywords} - AI Research`,
        company: 'OpenAI',
        location: location || 'San Francisco, CA',
        salary: '$180k - $300k',
        type: jobType || 'Full-time',
        remote: remote ? 'Remote' : 'On-site',
        url: 'https://openai.com/careers',
        description: `Join our team building frontier AI systems. We're looking for talented ${keywords} who are passionate about pushing the boundaries of what's possible with AI.`,
        postedDate: '5 days ago',
        logo: '⚡'
      },
      {
        id: `job-${Date.now()}-3`,
        title: `Lead ${keywords}`,
        company: 'Google DeepMind',
        location: location || 'London, UK',
        salary: '£120k - £200k',
        type: jobType || 'Full-time',
        remote: remote ? 'Remote' : 'Hybrid',
        url: 'https://deepmind.google/careers',
        description: `Shape the future of AI research. We're seeking exceptional ${keywords} to lead projects that will define the next generation of AI systems.`,
        postedDate: '1 week ago',
        logo: '🧠'
      },
      {
        id: `job-${Date.now()}-4`,
        title: `${keywords} - ML Platform`,
        company: 'Meta AI',
        location: location || 'Menlo Park, CA',
        salary: '$190k - $320k',
        type: jobType || 'Full-time',
        remote: remote ? 'Remote' : 'Hybrid',
        url: 'https://www.metacareers.com/jobs',
        description: `Build the infrastructure that powers AI at scale. Looking for experienced ${keywords} to join our ML platform team.`,
        postedDate: '3 days ago',
        logo: '👤'
      },
      {
        id: `job-${Date.now()}-5`,
        title: `${keywords} Engineer`,
        company: 'Hugging Face',
        location: location || 'Remote',
        salary: '$160k - $250k',
        type: jobType || 'Full-time',
        remote: 'Remote',
        url: 'https://huggingface.co/jobs',
        description: `Join the team democratizing AI. We're hiring ${keywords} to work on open-source ML tools used by millions.`,
        postedDate: '4 days ago',
        logo: '🤗'
      }
    ];

    res.json({ success: true, jobs: demoJobs });
  } catch (error) {
    console.error('Job search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

server.listen(PORT, () => {
  console.log(`\n🚀 Resume Tailor Server`);
  console.log(`   Frontend: http://localhost:${PORT}`);
  console.log(`   WebSocket: ws://localhost:${PORT}`);
  console.log(`\nReady to tailor resumes! 📄\n`);
});

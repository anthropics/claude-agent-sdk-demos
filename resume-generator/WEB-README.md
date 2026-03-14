# Resume Tailor - Web UI

Beautiful web interface for AI-powered resume tailoring.

## Quick Start

```bash
# Start the web server
npm run web

# Open browser to http://localhost:3002
```

## How It Works

### 1. Upload Resume
- Drag & drop or click to upload your .docx resume
- Only .docx format supported

### 2. Paste Job Description
- Copy the entire job description from the posting
- Include requirements, responsibilities, and skills

### 3. Click "Tailor My Resume"
- AI analyzes both documents
- Identifies matching experience
- Optimizes keywords and phrasing
- Generates tailored resume

### 4. Download Results
- **Tailored Resume** - Optimized .docx file
- **Analysis Document** - Detailed explanation of changes

## Features

✅ **Real-time Progress** - See AI working via WebSocket updates
✅ **ATS Optimization** - Keywords matching for applicant tracking systems
✅ **Analysis Report** - Understand what changed and why
✅ **One-Page Format** - Maintains professional 1-page resume
✅ **Truthful Tailoring** - No fabrication, just better presentation
✅ **Local Processing** - Files processed locally, not stored

## Architecture

```
Frontend (public/)
  ├── index.html - UI with file upload and JD textarea
  └── app.js - WebSocket client, file handling

Backend (server.ts)
  ├── Express server on port 3002
  ├── Multer for file uploads
  ├── WebSocket for real-time updates
  └── Claude Agent SDK integration

Output (agent/custom_scripts/)
  ├── tailoring_analysis.md
  └── tailored_resume.docx
```

## API Endpoints

- `POST /api/tailor` - Upload resume + JD, trigger tailoring
- `GET /files/*` - Serve generated files
- `ws://` - WebSocket for progress updates

## WebSocket Events

**Server → Client:**
- `connected` - WebSocket ready
- `status` - Status update (e.g., "Analyzing JD...")
- `progress` - AI thinking/output
- `tool` - Tool usage (Bash, Write, etc.)
- `complete` - Job done, files ready
- `error` - Something went wrong

## Tech Stack

- **Frontend**: Vanilla JS + TailwindCSS
- **Backend**: Express + TypeScript
- **AI**: Claude Agent SDK (Sonnet)
- **File Upload**: Multer
- **Real-time**: WebSocket (ws library)
- **Document Processing**: pandoc, docx library

## Screenshots

### Upload Screen
- Clean, modern interface
- Drag & drop file upload
- Large textarea for job description

### Processing
- Real-time progress log
- Tool usage indicators
- Status updates

### Results
- Download tailored resume button
- View/hide analysis toggle
- Detailed optimization report

## Development

```bash
# Install dependencies
bun install

# Start dev server
npm run web

# Test with sample files
# 1. Upload examples/sample-resume.docx
# 2. Paste examples/sample-jd.txt
# 3. Click "Tailor My Resume"
```

## Comparison: CLI vs Web

| Feature | CLI | Web UI |
|---------|-----|--------|
| **Ease of use** | Terminal commands | Click & upload |
| **Progress** | Console output | Real-time UI |
| **File handling** | Manual paths | Drag & drop |
| **Best for** | Automation, scripts | Interactive use |
| **Interface** | Text-based | Visual, modern |

## Use Cases

1. **Job Applications** - Tailor resume for each job
2. **Recruiter Outreach** - Optimize for specific roles
3. **Career Pivots** - Emphasize transferable skills
4. **ATS Optimization** - Pass automated screening
5. **Multiple Roles** - Create variants quickly

## Tips for Best Results

**Job Description:**
- Include full posting (not just summary)
- Copy requirements, responsibilities, and skills sections
- Include preferred qualifications

**Resume:**
- Use .docx format (not PDF or DOC)
- 1-2 pages max
- Clear structure with sections

**Expected Results:**
- Keywords from JD incorporated naturally
- Relevant experience highlighted
- Less relevant items de-emphasized
- Same truthful content, better framing

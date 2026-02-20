# Claude Agent SDK Applications – Run Guide

This document describes how to run each application from this repository. Prerequisites: **Bun** (or Node.js 18+) and an **Anthropic API key** (`ANTHROPIC_API_KEY`).

## Quick run from repo root

**Single Python entry point (all agents accessible like `agent.py`):**
```bash
python agents.py                    # interactive menu
python agents.py <agent-name>       # e.g. python agents.py hello-world
python agents.py --list             # list application names
```

**Or use the shell script:**
```bash
./run-app.sh <app-name>
```

Application names: `hello-world`, `hello-world-v2`, `excel-demo`, `email-agent`, `research-agent`, `resume-generator`, `simple-chatapp`.

---

## 1. Hello World

**Path:** `hello-world/`  
**Runtime:** Node.js / npm + tsx

Simple getting-started example: one prompt, streamed assistant/tool messages.

| Step | Command |
|------|--------|
| Install | `cd hello-world && npm install` |
| Run | `npx tsx hello-world.ts` |

**Setup:** Ensure `agent/` and `agent/custom_scripts/` exist (created automatically by `run-app.sh`).

**From root:** `./run-app.sh hello-world` or `python agents.py hello-world`

---

## 2. Hello World V2

**Path:** `hello-world-v2/`  
**Runtime:** Node.js / npm + tsx

V2 Session API examples: multi-turn conversations, session resume, one-shot prompt.

| Step | Command |
|------|--------|
| Install | `cd hello-world-v2 && npm install` |
| Run | `npx tsx v2-examples.ts basic` (or `multi-turn`, `one-shot`, `resume`) |

**From root:** `./run-app.sh hello-world-v2` or `python agents.py hello-world-v2`

---

## 3. Excel

**Path:** `excel-demo/`  
**Runtime:** Node.js / npm (Electron desktop app)

Desktop app for creating and analyzing spreadsheets with Claude.

| Step | Command |
|------|--------|
| Install | `cd excel-demo && npm install` |
| Run | `npm start` |

**Optional:** Python 3.9+ and `agent/` examples for spreadsheet generation. Set `ANTHROPIC_API_KEY` or enter when prompted.

**From root:** `./run-app.sh excel-demo` or `python agents.py excel-demo`

---

## 4. Email Agent

**Path:** `email-agent/`  
**Runtime:** Bun (or Node)

IMAP email assistant: inbox, search, AI assistance. **Local use only** (credentials in env).

| Step | Command |
|------|--------|
| Env | `cp email-agent/.env.example email-agent/.env` and set `ANTHROPIC_API_KEY`, `EMAIL_*`, `IMAP_*` |
| Install | `cd email-agent && bun install` (or `npm install`) |
| Run | `bun run dev` (or `npm run dev`) |

Open `http://localhost:3000`. See `email-agent/README.md` for IMAP (e.g. Gmail app password) setup.

**From root:** `./run-app.sh email-agent` or `python agents.py email-agent`

---

## 5. Research Agent

**Path:** `research-agent/`  
**Runtime:** Python 3.x with **uv**

Multi-agent research: subtopics → parallel researchers → data analyst → report writer (PDF + charts).

| Step | Command |
|------|--------|
| Install | `cd research-agent && uv sync` |
| Run | `uv run python research_agent/agent.py` |

**Slash commands:** `/research <topic>`, `/competitive-analysis <company>`, `/market-trends <industry>`, `/fact-check <claim>`, `/summarize`.

**From root:** `./run-app.sh research-agent` or `python agents.py research-agent`

---

## 6. Resume Generator

**Path:** `resume-generator/`  
**Runtime:** Node.js / npm + tsx

Generate professional .docx resumes using web search (e.g. LinkedIn, GitHub). Optional: pass a name, e.g. `npm start "Person Name"`.

| Step | Command |
|------|--------|
| Install | `cd resume-generator && npm install` |
| Run | `npm start` (or `npm start "Person Name"`) |

**From root:** `./run-app.sh resume-generator` or `python agents.py resume-generator`

---

## 7. Simple Chat App

**Path:** `simple-chatapp/`  
**Runtime:** Node.js / npm (React + Express + WebSocket)

Chat UI with Claude Agent SDK: frontend on port 5173, backend on 3001.

| Step | Command |
|------|--------|
| Install | `cd simple-chatapp && npm install` |
| Run | `npm run dev` |

Open http://localhost:5173. **From root:** `./run-app.sh simple-chatapp` or `python agents.py simple-chatapp`

---

## Summary

| Application | Dir | Install | Run |
|-------------|-----|--------|-----|
| Hello World | `hello-world/` | `npm install` | `npx tsx hello-world.ts` |
| Hello World V2 | `hello-world-v2/` | `npm install` | `npx tsx v2-examples.ts basic` |
| Excel | `excel-demo/` | `npm install` | `npm start` |
| Email Agent | `email-agent/` | `bun install` | `bun run dev` |
| Research Agent | `research-agent/` | `uv sync` | `uv run python research_agent/agent.py` |
| Resume Generator | `resume-generator/` | `npm install` | `npm start` |
| Simple Chat App | `simple-chatapp/` | `npm install` | `npm run dev` |

Ensure `ANTHROPIC_API_KEY` is set (or configured in `.env` where applicable) before running any application.

# Claude Agent SDK Applications

> ⚠️ **IMPORTANT**: These applications are for local development. Do not deploy to production or use at scale without review.

This repository contains multiple applications built with the [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview), showcasing different ways to build AI-powered applications with Claude.

## Available Applications

### 👋 [Hello World](./hello-world)
A simple getting-started example to help you understand the basics of the Claude Agent SDK.

### 👋 [Hello World V2](./hello-world-v2)
V2 Session API examples: multi-turn conversations, session resume, one-shot prompt.

### 📊 [Excel](./excel-demo)
Spreadsheets and Excel files using Claude.

### 📧 [Email Agent](./email-agent)
An in-development IMAP email assistant that can:
- Display your inbox
- Perform agentic search to find emails
- Provide AI-powered email assistance

### 🔬 [Research Agent](./research-agent)
A multi-agent research system that coordinates specialized subagents to research topics and generate comprehensive reports:
- Breaks research requests into subtopics
- Spawns parallel researcher agents to search the web
- Synthesizes findings into detailed reports
- Demonstrates detailed subagent activity tracking

### 📄 [Resume Generator](./resume-generator)
Generate professional .docx resumes using Claude and web search (e.g. LinkedIn, GitHub).

### 💬 [Simple Chat App](./simple-chatapp)
A React + Express chat application with Claude Agent SDK (frontend :5173, backend :3001).

## Quick Start

Each application has its own directory with dedicated setup instructions. Navigate to the specific application folder and follow its README for setup and usage details.

### Running the applications

From the repo root you can run any application in two ways:

**Python entry point (all agents in one place, like `agent.py`):**
```bash
python agents.py                    # interactive menu to pick an application
python agents.py <agent-name>       # run one application
python agents.py --list             # list application names
```

**Shell script:**
```bash
./run-app.sh <app-name>
```

Application names: `hello-world`, `hello-world-v2`, `excel-demo`, `email-agent`, `research-agent`, `resume-generator`, `simple-chatapp`. Both scripts install dependencies when needed and create required dirs (e.g. `hello-world/agent/custom_scripts`). For full install/run details and env setup (e.g. `ANTHROPIC_API_KEY`, email-agent `.env`), see **[APPLICATIONS.md](./APPLICATIONS.md)**.

## Prerequisites

- [Bun](https://bun.sh) runtime (or Node.js 18+)
- An Anthropic API key ([get one here](https://console.anthropic.com))

## Getting Started

1. **Clone the repository**
```bash
git clone https://github.com/anthropics/claude-agent-sdk-demos.git
cd claude-agent-sdk-demos
```

2. **Choose an application and navigate to its directory**
```bash
cd email-agent  # or excel-demo, or hello-world
```

3. **Follow the application-specific README** for setup and usage instructions

## Resources

- [Claude Agent SDK Documentation](https://docs.anthropic.com/en/docs/claude-code/sdk/sdk-overview)
- [API Reference](https://docs.anthropic.com/claude)
- [GitHub Issues](https://github.com/anthropics/claude-agent-sdk-demos/issues)

## Support

These applications are provided as-is. For issues related to:
- **Claude Agent SDK**: [SDK Documentation](https://docs.anthropic.com/claude-code)
- **Application issues**: [GitHub Issues](https://github.com/anthropics/sdk-demos/issues)
- **API Questions**: [Anthropic Support](https://support.anthropic.com)

## License

MIT - This is sample code for development and reference purposes.

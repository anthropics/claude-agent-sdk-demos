# Claude Agent SDK Demos

> ⚠️ **IMPORTANT**: These are demo applications by Anthropic. They are intended for local development only and should NOT be deployed to production or used at scale.

This repository contains multiple demonstrations of the [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview), showcasing different ways to build AI-powered applications with Claude.

## Available Demos

### 📧 [Email Agent](./email-agent)
An in-development IMAP email assistant that can:
- Display your inbox
- Perform agentic search to find emails
- Provide AI-powered email assistance

### 📊 [Excel Demo](./excel-demo)
Demonstrations of working with spreadsheets and Excel files using Claude.

### 👋 [Hello World](./hello-world)
A simple getting-started example to help you understand the basics of the Claude Agent SDK.

### 🔄 [Hello World V2](./hello-world-v2)
Examples for the V2 Session API (`unstable_v2_*`): separate `send()`/`stream()` instead of a single `query()` generator, with multi-turn conversation and session persistence patterns.

### 🔬 [Research Agent](./research-agent)
A multi-agent research system that coordinates specialized subagents to research topics and generate comprehensive reports:
- Breaks research requests into subtopics
- Spawns parallel researcher agents to search the web
- Synthesizes findings into detailed reports
- Demonstrates detailed subagent activity tracking

### 🎨 [AskUserQuestion Previews](./ask-user-question-previews)
A branding assistant that renders AskUserQuestion options as visual HTML preview cards instead of plain text labels:
- Opts in to `previewFormat: "html"` so each option includes a styled HTML mockup
- Round-trips questions from the SDK's `canUseTool` callback to a browser over WebSocket
- Demonstrates plan mode steering Claude toward clarifying questions before acting

### 💬 [Simple Chat App](./simple-chatapp)
A React + Express chat UI backed by the SDK, showing a full conversation loop over WebSocket with streaming responses.

### 📄 [Resume Generator](./resume-generator)
Generates a one-page `.docx` resume by web-searching a person's name (LinkedIn, GitHub, news) and assembling the findings.

### 🛡️ [Verified Ops Agent](./verified-ops-agent) (Python)
A verification-heavy ops agent that diagnoses a simulated production incident and never applies an unverified fix:
- Proposes a diagnosis + fix with read-only tools (`ClaudeSDKClient`)
- Runs a fresh-context adversarial verifier that tries to *refute* the proposal (fail-closed verdict parsing)
- Applies confirmed fixes behind a deterministic keyword tripwire (`can_use_tool`) with human confirmation for dangerous actions

## Quick Start

Each demo has its own directory with dedicated setup instructions. Navigate to the specific demo folder and follow its README for setup and usage details.


## Prerequisites

- [Bun](https://bun.sh) runtime (or Node.js 18+)
- An Anthropic API key ([get one here](https://console.anthropic.com))

## Getting Started

1. **Clone the repository**
```bash
git clone https://github.com/anthropics/claude-agent-sdk-demos.git
cd claude-agent-sdk-demos
```

2. **Choose a demo and navigate to its directory**
```bash
cd email-agent  # or excel-demo, or hello-world
```

3. **Follow the demo-specific README** for setup and usage instructions

## Resources

- [Claude Agent SDK Documentation](https://platform.claude.com/docs/en/agent-sdk)
- [API Reference](https://platform.claude.com/docs/en/agent-sdk/api-reference)
- [GitHub Issues](https://github.com/anthropics/claude-agent-sdk-demos/issues)

## Support

These are demo applications provided as-is. For issues related to:
- **Claude Agent SDK**: [SDK Documentation](https://platform.claude.com/docs/en/agent-sdk)
- **Demo Issues**: [GitHub Issues](https://github.com/anthropics/sdk-demos/issues)
- **API Questions**: [Anthropic Support](https://support.anthropic.com)

## License

MIT - This is sample code for demonstration purposes.

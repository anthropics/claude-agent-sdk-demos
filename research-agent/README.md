# Multi-Agent Research System

A multi-agent research system that coordinates specialized subagents to research any topic and generate comprehensive reports.

**Two modes available:**
- **Traditional Mode**: Deep exploration of complex topics
- **Wide Research Mode**: Analyzing lists of items with equal quality guarantee

**Document processing skills:**
- 📊 **Excel (.xlsx)** - Create spreadsheets with formulas and formatting
- 📄 **Word (.docx)** - Generate professional documents
- 📑 **PDF** - Extract, create, and fill PDF forms
- 📊 **PowerPoint (.pptx)** - Build presentations with layouts and charts

**[📖 Skills Setup Guide →](SKILLS_SETUP.md)**

## Quick Start

### Traditional Research Mode

```bash
# Install dependencies
uv sync

# Set your API key
export ANTHROPIC_API_KEY="your-api-key"

# Run the agent
uv run research_agent/agent.py
```

Then ask: "Research quantum computing developments in 2025"

### Wide Research Mode

```bash
# Run Wide Research mode
uv run research_agent/agent_wide.py
```

Then ask: "Research Apple, Microsoft, Google, and Amazon"

**[📖 Full Wide Research Documentation →](WIDE_RESEARCH.md)**

## How It Works

### Traditional Mode
1. **Lead agent** breaks your request into 2-4 subtopics
2. Spawns **researcher subagents in parallel** to search the web
3. Each researcher saves findings to `files/research_notes/`
4. Spawns **report-writer** to create final report in `files/reports/`

### Wide Research Mode
1. **Lead agent** parses list of items from your request
2. Spawns **ONE researcher per item** (all in parallel)
3. Each researcher investigates their assigned item with equal depth
4. Spawns **report-writer** to aggregate all findings + comparative analysis

## Example Queries

### Traditional Mode Examples
- "Research quantum computing developments"
- "What are current trends in renewable energy?"
- "Research the Detroit Lions 2025 season"

### Wide Research Mode Examples
- "Research Apple, Microsoft, Google, and Amazon"
- "Compare quantum computing at IBM, Google, and Microsoft"
- "Analyze these SaaS companies: Salesforce, HubSpot, Zendesk"

## When to Use Each Mode

| Use Traditional Mode When | Use Wide Research Mode When |
|---------------------------|------------------------------|
| Researching a single topic | Analyzing a list of items |
| Need subtopic decomposition | Need equal quality across items |
| Want integrated synthesis | Want comparative analysis |
| Deep dive on one subject | Research 5-100+ similar entities |

## Agents

**Lead Agent** - Coordinates everything, only uses `Task` tool
**Researcher Agents** - Use `WebSearch` and `Write` to gather information
**Report-Writer Agent** - Uses `Read`, `Glob`, `Write` to synthesize findings

## Subagent Tracking with Hooks

The system includes comprehensive tracking of all tool calls using **SDK hooks**. Every time any agent uses a tool, it's automatically logged.

### What Gets Tracked

- **Who**: Which agent (RESEARCHER-1, RESEARCHER-2, etc.)
- **What**: Tool name (WebSearch, Write, Read, etc.)
- **When**: Timestamp of call
- **Input**: Parameters passed to the tool
- **Output**: Success/failure and result size

### How It Works

**Hooks** intercept every tool call before and after execution:

```python
hooks = {
    'PreToolUse': [HookMatcher(hooks=[tracker.pre_tool_use_hook])],
    'PostToolUse': [HookMatcher(hooks=[tracker.post_tool_use_hook])]
}
```

**parent_tool_use_id** links tool calls to their subagent:
- When lead agent spawns a researcher via `Task` tool → gets ID "task_123"
- All messages from that researcher include `parent_tool_use_id = "task_123"`
- Hooks use this ID to look up which subagent made the call

### Output Logs

Each session creates timestamped logs in `logs/session_YYYYMMDD_HHMMSS/`:

**transcript.txt** - Human-readable conversation with tool details:
```
[RESEARCHER-1] → WebSearch
    Input: query='quantum computing 2025'
[RESEARCHER-1] → Write
    Input: file='quantum_hardware.md' (1234 chars)
```

**tool_calls.jsonl** - Structured JSON for analysis:
```json
{"event":"tool_call_start","agent_id":"RESEARCHER-1","tool_name":"WebSearch",...}
{"event":"tool_call_complete","success":true,"output_size":15234}
```

### Key Files

- `agent.py` - Main entry point, registers hooks
- `utils/subagent_tracker.py` - Hook implementation
- `utils/message_handler.py` - Extracts parent_tool_use_id
- `prompts/` - Agent instructions


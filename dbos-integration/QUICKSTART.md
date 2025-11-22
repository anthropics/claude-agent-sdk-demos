# Quick Start Guide

Get started with DBOS + Claude Agent SDK integration in 5 minutes.

## Prerequisites

✅ Python 3.11 or higher
✅ PostgreSQL installed and running
✅ Anthropic API key ([get one here](https://console.anthropic.com))

## Installation

### 1. Install PostgreSQL

**macOS** (using Homebrew):
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian**:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows**:
Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)

### 2. Create Database User

```bash
# Create a PostgreSQL user for DBOS
sudo -u postgres createuser -s $USER

# Set a password
sudo -u postgres psql -c "ALTER USER $USER WITH PASSWORD 'your-password';"
```

### 3. Install Python Dependencies

```bash
cd dbos-integration

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -e .
```

### 4. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env and add your keys
nano .env  # or use your preferred editor
```

Set these values in `.env`:
```env
ANTHROPIC_API_KEY=sk-ant-api03-...
PGPASSWORD=your-postgres-password
```

### 5. Initialize DBOS Database

```bash
dbos migrate
```

This creates the necessary database tables for DBOS workflows.

## Running Examples

### Simple Query Example

Ask Claude a single question:

```bash
python examples/simple_query.py
```

Expected output:
```
Question: Explain Python's asyncio in one paragraph.

Querying Claude...

Response:
============================================================
Python's asyncio is a library for writing concurrent code...
============================================================
```

### Research Workflow Example

Run a multi-step research workflow:

```bash
python examples/research_workflow.py
```

This will:
1. Generate research questions about a topic
2. Research each question (with checkpoints)
3. Synthesize a final report

Expected output:
```
============================================================
Starting research workflow for: Python's asyncio and event loops
============================================================

Step 1: Generating research questions...
Generated 3 questions:
  1. What is the event loop in Python asyncio?
  2. How do coroutines work in asyncio?
  3. What are common asyncio patterns?

Step 2: Researching each question...
  Researching question 1/3...
  Researching question 2/3...
  Researching question 3/3...

Step 3: Synthesizing final report...

============================================================
FINAL REPORT
============================================================
[Comprehensive report here...]
```

## Starting DBOS Server (Optional)

For production use, run DBOS as a server:

```bash
dbos start
```

This starts an HTTP server on port 8000. You can invoke workflows via HTTP:

```bash
# Ask Claude a question
curl -X POST http://localhost:8000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What is Python asyncio?"}'

# Run research workflow
curl -X POST http://localhost:8000/api/research \
  -H "Content-Type: application/json" \
  -d '{"topic": "Machine learning"}'
```

## Understanding Checkpoints

DBOS automatically checkpoints your workflow. Try this:

1. **Run a workflow**:
   ```bash
   python examples/research_workflow.py
   ```

2. **Interrupt it** (Ctrl+C) after Step 1 completes

3. **Run it again** - DBOS will resume from the last checkpoint!

You'll see it skip Step 1 (already completed) and continue from Step 2.

## Troubleshooting

### `ANTHROPIC_API_KEY not set`

Make sure you:
1. Created `.env` file (copy from `.env.example`)
2. Added your API key to `.env`
3. Activated your virtual environment

### `Connection refused` (PostgreSQL)

Check if PostgreSQL is running:
```bash
# macOS
brew services list | grep postgresql

# Linux
sudo systemctl status postgresql
```

Start it if needed:
```bash
# macOS
brew services start postgresql@15

# Linux
sudo systemctl start postgresql
```

### `database "dbos_claude_demo" does not exist`

Run migrations:
```bash
dbos migrate
```

### Import errors

Ensure you installed dependencies:
```bash
pip install -e .
```

And activated your virtual environment:
```bash
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

## Next Steps

Now that you have the basics working:

1. **Read the [full README](./README.md)** for detailed explanations
2. **Modify the examples** to try your own prompts
3. **Build your own workflows** using the patterns shown
4. **Deploy with DBOS Cloud** ([docs](https://docs.dbos.dev/cloud-deployment))

## Key Concepts Recap

✅ **Workflows** = Top-level orchestration (gets checkpointed)
✅ **Steps** = Individual operations (accumulate Claude streams)
✅ **Streaming** = Handled internally in steps, not exposed to workflow
✅ **Checkpoints** = Happen automatically when steps complete

## Getting Help

- **DBOS Docs**: https://docs.dbos.dev/
- **Claude SDK Docs**: https://docs.anthropic.com/
- **Issues**: https://github.com/anthropics/claude-code-sdk-demos/issues

Happy building! 🚀

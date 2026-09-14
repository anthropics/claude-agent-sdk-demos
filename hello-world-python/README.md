# Claude Agent SDK Hello World (Python)

The smallest Python example in this repository: send one prompt with
`query()` and print the text blocks from Claude's assistant response. The
example does not need a separate Claude Code installation because the Python
SDK bundles the CLI.

## Setup

Requires Python 3.10+ and an Anthropic API key.

```bash
cd hello-world-python
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
python -m pip install -e .
export ANTHROPIC_API_KEY="your-api-key"
python hello_world.py
```

For a reproducible environment, the same commands can be run with
[uv](https://docs.astral.sh/uv/):

```bash
uv run --with claude-agent-sdk python hello_world.py
```

## How it works

`query()` is an async iterator. It yields several message types while the
agent runs, so the example checks for `AssistantMessage` and then prints only
its `TextBlock` content. This keeps tool-use and system messages out of the
terminal while showing the typed SDK API.

See the [Python Agent SDK documentation](https://platform.claude.com/docs/en/agent-sdk/python)
for options such as `ClaudeAgentOptions`, working directories, hooks, and
custom tools.

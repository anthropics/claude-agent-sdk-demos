#!/usr/bin/env bash
# Run a Claude Agent SDK application by name from repo root.
# Usage: ./run-app.sh <app-name>
# Applications: hello-world, hello-world-v2, excel-demo, email-agent, research-agent, resume-generator, simple-chatapp

set -e
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_ROOT"

APP="${1:-}"
if [[ -z "$APP" ]]; then
  echo "Usage: $0 <app-name>"
  echo "Applications: hello-world | hello-world-v2 | excel-demo | email-agent | research-agent | resume-generator | simple-chatapp"
  echo "See APPLICATIONS.md for details."
  exit 1
fi

if [[ -z "${ANTHROPIC_API_KEY:-}" ]]; then
  echo "Warning: ANTHROPIC_API_KEY is not set. Some applications will prompt or fail."
  echo "Export it or add to .env in the application directory."
fi

case "$APP" in
  hello-world)
    mkdir -p "$REPO_ROOT/hello-world/agent/custom_scripts"
    cd "$REPO_ROOT/hello-world"
    if [[ ! -d node_modules ]]; then npm install; fi
    npx tsx hello-world.ts
    ;;
  hello-world-v2)
    cd "$REPO_ROOT/hello-world-v2"
    if [[ ! -d node_modules ]]; then npm install; fi
    npx tsx v2-examples.ts basic
    ;;
  excel-demo)
    cd "$REPO_ROOT/excel-demo"
    if [[ ! -d node_modules ]]; then npm install; fi
    npm start
    ;;
  email-agent)
    if [[ ! -f "$REPO_ROOT/email-agent/.env" ]]; then
      echo "Warning: email-agent/.env not found. Copy from .env.example and set ANTHROPIC_API_KEY and IMAP/EMAIL vars."
      if [[ -f "$REPO_ROOT/email-agent/.env.example" ]]; then
        cp "$REPO_ROOT/email-agent/.env.example" "$REPO_ROOT/email-agent/.env"
        echo "Created email-agent/.env from .env.example. Edit it before running."
        exit 1
      fi
    fi
    cd "$REPO_ROOT/email-agent"
    if command -v bun >/dev/null 2>&1; then
      if [[ ! -d node_modules ]]; then bun install; fi
      bun run dev
    else
      if [[ ! -d node_modules ]]; then npm install; fi
      npm run dev
    fi
    ;;
  research-agent)
    cd "$REPO_ROOT/research-agent"
    if command -v uv >/dev/null 2>&1; then
      uv sync
      uv run python research_agent/agent.py
    else
      echo "Research agent requires 'uv'. Install: https://docs.astral.sh/uv/"
      exit 1
    fi
    ;;
  resume-generator)
    cd "$REPO_ROOT/resume-generator"
    if [[ ! -d node_modules ]]; then npm install; fi
    npm start
    ;;
  simple-chatapp)
    cd "$REPO_ROOT/simple-chatapp"
    if [[ ! -d node_modules ]]; then npm install; fi
    npm run dev
    ;;
  *)
    echo "Unknown application: $APP"
    echo "Applications: hello-world | hello-world-v2 | excel-demo | email-agent | research-agent | resume-generator | simple-chatapp"
    exit 1
    ;;
esac

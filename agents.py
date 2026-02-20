#!/usr/bin/env python3
"""
Single entry point to run any Claude Agent SDK application.
Usage:
  python agents.py                    # interactive menu
  python agents.py <agent-name>        # run one application
  python agents.py --list              # list application names
"""
import os
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent

AGENTS = {
    "hello-world": {
        "description": "Simple getting-started example (streamed prompt)",
        "run": lambda: _run_hello_world(),
    },
    "hello-world-v2": {
        "description": "V2 Session API examples (multi-turn, resume)",
        "run": lambda: _run_hello_world_v2(),
    },
    "excel-demo": {
        "description": "Electron desktop app for spreadsheets with Claude",
        "run": lambda: _run_excel_demo(),
    },
    "email-agent": {
        "description": "IMAP email assistant (inbox, search, AI help)",
        "run": lambda: _run_email_agent(),
    },
    "research-agent": {
        "description": "Multi-agent research (subtopics, researchers, reports)",
        "run": lambda: _run_research_agent(),
    },
    "resume-generator": {
        "description": "Generate .docx resumes via web search (npm start \"Name\")",
        "run": lambda: _run_resume_generator(),
    },
    "simple-chatapp": {
        "description": "React + Express chat app (frontend :5173, backend :3001)",
        "run": lambda: _run_simple_chatapp(),
    },
}


def _env_warn():
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("Warning: ANTHROPIC_API_KEY is not set. Some applications will prompt or fail.", file=sys.stderr)
        print("Export it or add to .env in the application directory.", file=sys.stderr)


def _run_hello_world():
    (REPO_ROOT / "hello-world" / "agent" / "custom_scripts").mkdir(parents=True, exist_ok=True)
    cwd = REPO_ROOT / "hello-world"
    if not (cwd / "node_modules").exists():
        subprocess.run(["npm", "install"], cwd=cwd, check=True)
    subprocess.run(["npx", "tsx", "hello-world.ts"], cwd=cwd, check=True)


def _run_hello_world_v2():
    cwd = REPO_ROOT / "hello-world-v2"
    if not (cwd / "node_modules").exists():
        subprocess.run(["npm", "install"], cwd=cwd, check=True)
    subprocess.run(["npx", "tsx", "v2-examples.ts", "basic"], cwd=cwd, check=True)


def _run_excel_demo():
    cwd = REPO_ROOT / "excel-demo"
    if not (cwd / "node_modules").exists():
        subprocess.run(["npm", "install"], cwd=cwd, check=True)
    subprocess.run(["npm", "start"], cwd=cwd, check=True)


def _run_email_agent():
    env_file = REPO_ROOT / "email-agent" / ".env"
    example = REPO_ROOT / "email-agent" / ".env.example"
    if not env_file.exists():
        print("Warning: email-agent/.env not found. Set ANTHROPIC_API_KEY and IMAP/EMAIL vars.", file=sys.stderr)
        if example.exists():
            env_file.write_text(example.read_text())
            print("Created email-agent/.env from .env.example. Edit it, then run again.", file=sys.stderr)
            sys.exit(1)
    cwd = REPO_ROOT / "email-agent"
    if not (cwd / "node_modules").exists():
        if _has_cmd("bun"):
            subprocess.run(["bun", "install"], cwd=cwd, check=True)
        else:
            subprocess.run(["npm", "install"], cwd=cwd, check=True)
    if _has_cmd("bun"):
        subprocess.run(["bun", "run", "dev"], cwd=cwd, check=True)
    else:
        subprocess.run(["npm", "run", "dev"], cwd=cwd, check=True)


def _run_research_agent():
    if not _has_cmd("uv"):
        print("Research agent requires 'uv'. Install: https://docs.astral.sh/uv/", file=sys.stderr)
        sys.exit(1)
    cwd = REPO_ROOT / "research-agent"
    subprocess.run(["uv", "sync"], cwd=cwd, check=True)
    subprocess.run(["uv", "run", "python", "research_agent/agent.py"], cwd=cwd, check=True)


def _run_resume_generator():
    cwd = REPO_ROOT / "resume-generator"
    if not (cwd / "node_modules").exists():
        subprocess.run(["npm", "install"], cwd=cwd, check=True)
    subprocess.run(["npm", "start"], cwd=cwd, check=True)


def _run_simple_chatapp():
    cwd = REPO_ROOT / "simple-chatapp"
    if not (cwd / "node_modules").exists():
        subprocess.run(["npm", "install"], cwd=cwd, check=True)
    subprocess.run(["npm", "run", "dev"], cwd=cwd, check=True)


def _has_cmd(name: str) -> bool:
    return subprocess.run(
        [name, "--version"],
        capture_output=True,
        timeout=5,
    ).returncode == 0


def list_agents():
    print("Agents (use: python agents.py <name>):")
    for name, info in AGENTS.items():
        print(f"  {name:<16} {info['description']}")


def main():
    _env_warn()
    args = [a for a in sys.argv[1:] if a != "--list"]
    if "--list" in sys.argv[1:]:
        list_agents()
        return
    if not args:
        list_agents()
        print()
        try:
            choice = input("Enter agent name (or Ctrl+C to cancel): ").strip().lower()
        except (EOFError, KeyboardInterrupt):
            print()
            return
        if not choice:
            return
        if choice not in AGENTS:
            print(f"Unknown agent: {choice}. Use --list to see names.", file=sys.stderr)
            sys.exit(1)
        AGENTS[choice]["run"]()
        return
    name = args[0].lower()
    if name not in AGENTS:
        print(f"Unknown agent: {name}", file=sys.stderr)
        list_agents()
        sys.exit(1)
    AGENTS[name]["run"]()


if __name__ == "__main__":
    main()

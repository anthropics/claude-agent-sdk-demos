# Verified Ops Agent (Python)

A small, verification-heavy ops agent built with the **Python** Claude Agent SDK
(`claude-agent-sdk`). It handles a simulated production incident in three
stages, and never applies a change that hasn't survived independent scrutiny:

1. **Propose** — an ops agent (`ClaudeSDKClient`) investigates the incident
   with read-only tools and produces a structured diagnosis + fix proposal.
2. **Adversarially verify** — a *fresh-context* verifier agent (`query()`) is
   prompted to **refute** the proposal, not to evaluate it. The burden of proof
   sits on the proposal, and an unparseable verdict counts as a refutation
   (fail closed).
3. **Apply behind a tripwire** — only a confirmed proposal is applied. Every
   tool call routes through a `can_use_tool` gate with a **deterministic
   keyword tripwire**: dangerous actions (restarts, deletes, deploys, ...)
   require a human `y` on stdin, and non-interactive runs fail closed.

The pattern is distilled from production multi-agent systems: a neutral
"evaluate this" verifier rubber-stamps almost everything, and an LLM must never
classify its own action's risk — one mislabel silently defeats the gate.

## Quick Start

```bash
cd verified-ops-agent

# Install dependencies
uv sync

# Set your API key
export ANTHROPIC_API_KEY="your-api-key"   # or copy .env.example to .env

# Run the demo
uv run python -m verified_ops_agent.agent
```

The incident is copied to a temp directory on every run, so the demo is
repeatable. Run it interactively (a real terminal) to approve the final restart
yourself; run it non-interactively (`< /dev/null`) to see the fail-closed path.

## The Incident

`sample_incident/` contains the evidence: an app log showing DB connection-pool
exhaustion, a config whose `pool_size` was temporarily lowered for a schema
migration, and deploy notes saying the migration finished — but the pool size
was never restored. There's also a red herring (an unrelated release minutes
before the outage) for the agents to reason past.

## SDK Features Demonstrated

| Feature | Where | What it does here |
|---|---|---|
| `ClaudeSDKClient` (multi-turn) | `agent.py` | One session investigates, then later applies — the applier keeps the investigation context |
| `query()` (one-shot, fresh context) | `verifier.py` | The verifier shares **no** context with the proposer — independence is the point |
| `can_use_tool` callback | `tripwire.py` | Deterministic permission gate on every tool call, with human confirmation |
| `PreToolUse` hook (`HookMatcher`) | `agent.py` | Audit line for every tool call |
| `allowed_tools` / `disallowed_tools` | `verifier.py` | Verifier is hard-restricted to read-only tools |
| `setting_sources=[]` | both | Hermetic runs — no user/project settings leak into the demo |

## Design Notes

- **Default-refute.** The verifier's system prompt puts the burden of proof on
  the proposal and instructs it to refute when uncertain. This is the single
  biggest quality lever: a neutral verifier passes plausible-but-wrong output.
- **Fail-closed parsing.** The verdict must match `VERDICT: CONFIRMED|REFUTED |
  <reason>` exactly; anything else is treated as refuted. A parsing bug must
  never turn into an approval.
- **Deterministic tripwire.** The dangerous-action check is blunt keyword
  matching over the serialized tool input (`tripwire.py`), independent of
  anything the model says about its own action. A false "needs human" is cheap;
  a false auto-approve is not. Read-only tools skip the scan but still route
  through the gate, so the whole policy lives in one auditable place.
- **Nothing is pre-approved.** Pre-approving a tool via `allowed_tools` would
  bypass `can_use_tool` entirely (the SDK warns about this shadowing), so the
  ops session pre-approves nothing.

## Example Run (non-interactive)

Real output, lightly trimmed:

```text
============================================================
STAGE 1 — PROPOSE (ops agent investigates, read-only)
============================================================
   [audit] Bash ls -la
   [audit] Read .../incident/app.log
   [audit] Read .../incident/deploy_notes.md
   [audit] Read .../incident/config/app.yaml

DIAGNOSIS: The orders-api DB connection pool was temporarily lowered from 50
to 5 for a schema migration on 2025-11-01 (deploy_notes.md lines 5-7;
config/app.yaml line 9 `pool_size: 5`) and was never restored after the
migration finished ... The v2.41.0 deploy at 14:02 is unrelated — it just
coincides in time.

FIX: In config/app.yaml, restore `db.pool_size` from `5` back to `50`.

FOLLOW-UP: Restart the service: `sudo systemctl restart orders-api` ...

============================================================
STAGE 2 — ADVERSARIAL VERIFY (independent, default-refute)
============================================================

Verdict: CONFIRMED ✅
Reason:  All log/config/deploy-note citations check out exactly, the
pool-exhaustion mechanism is internally consistent (30001ms 504 matches the
30000ms http timeout), and the fix restores the documented config value.

============================================================
STAGE 3 — APPLY (tripwire guards every tool call)
============================================================
   [audit] Edit .../incident/config/app.yaml
   [audit] Bash sudo systemctl restart orders-api

🚨 TRIPWIRE hit on keyword 'restart':
   Bash: sudo systemctl restart orders-api
   Non-interactive run -> DENIED (fail closed).

1. ✅ Config fix applied — `pool_size` changed from `5` → `50`.
2. ⛔ Follow-up blocked — the restart was intercepted by the tripwire and
   requires a human to execute it.
```

In an interactive terminal, the tripwire instead prompts
`Approve this action? [y/N]` and proceeds on `y`.

## Files

```
verified-ops-agent/
├── verified_ops_agent/
│   ├── agent.py       # pipeline: propose → verify → apply
│   ├── verifier.py    # adversarial verify + fail-closed verdict parsing
│   └── tripwire.py    # deterministic keyword tripwire (can_use_tool gate)
└── sample_incident/   # logs, config, deploy notes (copied to a temp dir per run)
```

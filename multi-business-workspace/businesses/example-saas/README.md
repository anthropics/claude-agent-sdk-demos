# Example SaaS Business

This is an example business demonstrating the multi-business workspace architecture.

## What This Business Does

A hypothetical SaaS platform (you would replace this with your actual business).

## Structure

```
example-saas/
├── .claude/
│   ├── agents/
│   │   └── example-saas-agent.md    # Business-specific agent
│   └── rules/                       # Auto-synced from _template
│       ├── two-pc-continuity-system.md
│       └── autonomous-agent-decision-framework.md
├── LEARNINGS.md                     # Patterns discovered here
├── README.md                        # This file
└── src/                             # Your actual code
```

## How Patterns Work

### 1. Discover Patterns
As you build this business, document discoveries in `LEARNINGS.md`:

```markdown
## Pattern: Your Discovery
**Category:** Performance
**Date Discovered:** 2026-03-08
**Problem:** What you solved
**Solution:** How you solved it
**Evidence:** Results (numbers!)
**Generalizability:** HIGH/MEDIUM/LOW
```

### 2. Auto-Extract
Run workspace agent from root:
```bash
cd ../..  # Go to workspace root
@workspace-agent "extract patterns from example-saas"
```

### 3. Auto-Sync
Patterns sync to ALL businesses automatically:
```bash
python _template/sync-learnings.py --verbose
```

### 4. Everyone Benefits
All businesses now have your pattern in `.claude/rules/`!

## Inherited Patterns

This business automatically inherits all workspace patterns:
- ✅ Two-PC Continuity System
- ✅ Autonomous Agent Decision Framework
- ✅ Native LRU Cache for APIs
- ✅ ...and more as they're discovered

## Getting Started

1. **Use the business agent:**
   ```bash
   @example-saas-agent "implement user authentication"
   ```

2. **Agent automatically applies patterns** from `.claude/rules/`

3. **Document new discoveries** in `LEARNINGS.md`

4. **Contribute back** to the ecosystem

---

**This business is part of a compound learning system. What you discover here helps every other business.** 🚀

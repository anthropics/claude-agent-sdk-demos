# Patterns Discovered Across Businesses

**Pattern Count:** 3
**Last Updated:** 2026-03-08
**Businesses Contributing:** 2 (content-services, marketplace-app)

This document catalogs all patterns extracted from production businesses in this workspace.

---

## Overview

Patterns are automatically extracted from business `LEARNINGS.md` files and synced to all businesses via `.claude/rules/`.

**Value Ratings:**
- **HIGH**: Universal benefit, 50%+ time savings or major error prevention
- **MEDIUM**: Useful for many businesses, 10-50% time savings
- **LOW**: Optional, minimal impact

---

### Pattern 1: Two-PC Continuity System
**Category:** Development Workflow
**Value:** HIGH
**Source:** content-services
**Date Discovered:** 2026-03-07

**Problem Solved:**
Working across multiple machines (personal PC, work PC, different locations) loses context because Claude Code conversation history is local.

**Solution:**
Use Git as shared brain with three key files:
- `.ai/MEMORY.md` - Current state tracker (what you're working on NOW)
- `knowledge/SPRINT_LOG.md` - Operational memory (recent wins, active tasks)
- `knowledge/CHRONICLE.md` - Historical narrative (how you got here)

Plus a `/start-session` command that loads all three files automatically.

**Evidence of Success:**
- Zero context-switch overhead when moving between machines
- Can resume work after days/weeks with full context
- Git commits become knowledge checkpoints

**Applicability:** Universal (benefits all businesses)

**Implementation:**
See `businesses/content-services/LEARNINGS.md` for detailed implementation.

---

### Pattern 2: Autonomous Agent Decision Framework
**Category:** Agent Architecture
**Value:** HIGH
**Source:** content-services
**Date Discovered:** 2026-03-07

**Problem Solved:**
Agents hesitate on safe operations (file moves, cleanup, etc.) asking for approval unnecessarily, slowing down autonomous work.

**Solution:**
Clear decision boundary in `.claude/rules/decision-framework.md`:
- **Reversible = Autonomous**: File operations (git reversible), documentation updates, cleanup
- **Irreversible = Ask**: Deletions, production pushes, breaking changes

Key insight: "Reversibility = confidence. Information-additive = safe."

**Evidence of Success:**
- One business went from 147 files → 122 files (-17%) autonomously with zero errors
- Agent works faster, user trusts more
- No "paralysis by permission"

**Applicability:** Universal (benefits all businesses)

**Implementation:**
See `businesses/content-services/LEARNINGS.md` for detailed implementation.

---

### Pattern 3: Native LRU Cache for External APIs
**Category:** Performance
**Value:** MEDIUM
**Source:** marketplace-app
**Date Discovered:** 2026-03-07

**Problem Solved:**
External API calls are slow (500ms+) and hit rate limits, degrading UX.

**Solution:**
Native JavaScript/Python Map-based LRU cache:
- 100-item capacity
- 15-minute TTL
- Zero dependencies
- Simple to implement (~50 lines)

**Evidence of Success:**
- 90% fewer API calls
- Instant responses for cached data
- No rate limit errors

**Applicability:** Useful for many businesses

**Implementation:**
See `businesses/marketplace-app/LEARNINGS.md` for detailed implementation.

---

## How to Add New Patterns

1. **Document in your business's LEARNINGS.md:**
   ```markdown
   ## Pattern: Your Pattern Name
   **Category:** Category name
   **Date Discovered:** YYYY-MM-DD
   **Problem:** What it solves
   **Solution:** How it works
   **Evidence:** Measurable results
   **Generalizability:** HIGH/MEDIUM/LOW
   ```

2. **Extract with workspace agent:**
   ```bash
   @workspace-agent "extract patterns from my-business"
   ```

3. **Patterns auto-sync to all businesses** (no manual work!)

---

## Pattern Categories

- **Development Workflow**: Tools and processes for building
- **Agent Architecture**: How agents work and make decisions
- **Performance**: Speed optimizations
- **Data Management**: Handling state and persistence
- **User Experience**: Interface patterns

---

**Each pattern makes your entire workspace smarter. Compound learning in action!** 🧠

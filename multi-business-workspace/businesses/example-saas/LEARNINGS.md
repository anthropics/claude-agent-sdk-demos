# Learnings - Example SaaS

This file documents patterns discovered while building this business.

**How This Works:**
1. You discover a pattern while building
2. Document it here using the template below
3. Workspace agent extracts HIGH/MEDIUM value patterns
4. Patterns sync to ALL businesses automatically
5. Everyone benefits from your discovery

---

## Template

```markdown
## Pattern: [Name]
**Category:** [Development Workflow | Agent Architecture | Performance | Data Management | User Experience]
**Date Discovered:** YYYY-MM-DD
**Problem:** What problem did this solve?
**Solution:** How did you solve it? (code examples welcome)
**Evidence:** Measurable results (time saved, errors prevented, performance gain)
**Generalizability:** HIGH | MEDIUM | LOW
```

**Generalizability Guide:**
- **HIGH**: Universal benefit (all businesses should use)
- **MEDIUM**: Useful for many businesses (optional but recommended)
- **LOW**: Specific to this business (not extracted)

---

## Discovered Patterns

(Your patterns will be documented here as you build)

---

## Example Pattern (for reference)

## Pattern: Native LRU Cache for External APIs
**Category:** Performance
**Date Discovered:** 2026-03-07
**Problem:** External API calls were slow (500ms+) and hitting rate limits, degrading UX.
**Solution:** Implemented native JavaScript Map-based LRU cache with 100-item capacity and 15-minute TTL. Zero dependencies, ~50 lines of code.

```javascript
class LRUCache {
  constructor(maxSize = 100, ttl = 15 * 60 * 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, item);
    return item.value;
  }

  set(key, value) {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }
}

// Usage
const apiCache = new LRUCache();

async function fetchUser(id) {
  const cached = apiCache.get(`user:${id}`);
  if (cached) return cached;

  const user = await fetch(`/api/users/${id}`).then(r => r.json());
  apiCache.set(`user:${id}`, user);
  return user;
}
```

**Evidence:**
- 90% fewer API calls (100 calls → 10 calls for same workflow)
- Instant responses for cached data (0ms vs 500ms)
- Zero rate limit errors
- No external dependencies

**Generalizability:** MEDIUM (useful for any business with external API calls)

---

**Keep discovering. Keep documenting. The whole workspace benefits.** 🧠

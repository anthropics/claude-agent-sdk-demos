---
description: Fact-check claims or verify information
argument-hint: "<claim or statement to verify>"
---

Fact-check the following claim: $ARGUMENTS

## Verification Process

### 1. Claim Decomposition
- Break the claim into verifiable components
- Identify key facts that need checking
- Note any ambiguities in the claim

### 2. Source Search
For each factual component:
- Find primary sources (official data, academic papers)
- Find secondary sources (reputable journalism)
- Look for counter-evidence

### 3. Verification Assessment
For each component, determine:
- **TRUE**: Strong evidence supports this
- **FALSE**: Strong evidence contradicts this
- **PARTIALLY TRUE**: Some aspects correct, others not
- **UNVERIFIABLE**: Cannot confirm with available sources
- **MISLEADING**: Technically true but lacks context

### 4. Context Analysis
- Is the claim missing important context?
- Is it outdated information presented as current?
- Are there caveats being omitted?

### 5. Source Quality Evaluation
Rate sources on:
- Authority (expertise of source)
- Recency (how current)
- Objectivity (potential bias)
- Corroboration (multiple sources agree)

## Output Format

```
FACT CHECK REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Claim: [Original claim]
Verdict: [TRUE / FALSE / PARTIALLY TRUE / MISLEADING / UNVERIFIABLE]
Confidence: [HIGH / MEDIUM / LOW]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUMMARY:
[1-2 sentence summary of finding]

DETAILED ANALYSIS:
[Component-by-component breakdown]

KEY SOURCES:
[List of primary sources used]

IMPORTANT CONTEXT:
[Any context needed to fully understand]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Be rigorous and objective. Acknowledge uncertainty where it exists.

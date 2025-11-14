# Testing Guide for Wide Research

This guide shows you how to test both Traditional and Wide Research modes.

## Prerequisites

1. **API Key**: You need an Anthropic API key
2. **Python**: Python 3.10 or higher
3. **Dependencies**: Installed via `uv sync`

## Setup

### Step 1: Set Your API Key

Choose one of these methods:

**Option A: Create .env file (recommended)**
```bash
cd research-agent
echo 'ANTHROPIC_API_KEY="sk-ant-..."' > .env
```

**Option B: Export in shell**
```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

### Step 2: Install Dependencies

```bash
cd research-agent
uv sync
```

## Quick Test (Easiest)

Run the simple test script:

```bash
cd research-agent
uv run test_simple.py
```

Then try this query:
```
Research Apple, Microsoft, and Google
```

Type `exit` when done.

## Testing Traditional Mode

### Run Traditional Mode
```bash
uv run research_agent/agent.py
```

### Test Queries

**Query 1: Technology Topic**
```
Research quantum computing developments
```
- Expects: 2-4 subtopics (hardware, algorithms, industry, challenges)
- Output: Integrated synthesis report

**Query 2: Industry Analysis**
```
What are the latest trends in electric vehicles?
```
- Expects: Subtopics on technology, market, manufacturers, infrastructure
- Output: Comprehensive topic overview

**Query 3: Specific Subject**
```
Research the Detroit Lions 2025 season
```
- Expects: Team performance, key players, standings, outlook
- Output: Sports analysis report

### What to Look For

✓ Lead agent breaks topic into 2-4 subtopics
✓ Spawns 2-4 researcher agents in parallel
✓ Each researcher saves to `files/research_notes/{subtopic}.md`
✓ Report writer creates `files/reports/{topic}_summary_YYYYMMDD.txt`
✓ Report is 500-800 words with integrated synthesis

## Testing Wide Research Mode

### Run Wide Research Mode
```bash
uv run research_agent/agent_wide.py
```

### Test Queries (Progressive Difficulty)

**Level 1: Small List (3 items)**
```
Research Apple, Microsoft, and Google
```
- Expects: 3 parallel researchers
- Time: ~2-3 minutes
- Output: Individual summaries + comparison

**Level 2: Medium List (5 items)**
```
Compare quantum computing efforts at IBM, Google, Microsoft, Amazon, and Intel
```
- Expects: 5 parallel researchers
- Time: ~3-4 minutes
- Output: Detailed comparative analysis

**Level 3: Specific Aspect (5 items)**
```
Analyze the financial performance of Apple, Microsoft, Google, Amazon, and Tesla
```
- Expects: 5 researchers focusing on financials
- Output: Financial comparison report

**Level 4: Larger List (10 items)**
```
Research these AI companies: OpenAI, Anthropic, Google DeepMind, Microsoft AI, Meta AI, Nvidia, Cohere, Stability AI, Mistral AI, Hugging Face
```
- Expects: 10 parallel researchers
- Time: ~4-5 minutes
- Output: Comprehensive multi-company analysis

**Level 5: Different Formats**

Test list parsing with different formats:

*Numbered list:*
```
Compare these companies:
1. Apple
2. Microsoft
3. Google
```

*Bullet points:*
```
Analyze:
- Tesla stock performance
- Ford stock performance
- GM stock performance
```

*Natural language:*
```
Compare the latest AI models from OpenAI, Anthropic, and Google
```

### What to Look For

✓ Lead agent correctly parses the list
✓ Spawns ONE researcher per item (N items = N researchers)
✓ All researchers run in parallel (not sequential)
✓ Each researcher saves to `files/research_notes/{item}.md`
✓ All research notes have similar length (3-4 paragraphs)
✓ Report writer creates `files/reports/{topic}_wide_research_YYYYMMDD.txt`
✓ Report has three sections:
  - Section 1: Individual summaries (equal space per item)
  - Section 2: Comparative analysis
  - Section 3: Overall synthesis

### Equal Quality Verification

To verify the "equal quality guarantee", check that:

1. **All research notes have similar length:**
```bash
wc -l files/research_notes/*.md
```
All files should have similar line counts (~40-80 lines).

2. **All items get equal space in report:**
```bash
cat files/reports/$(ls -t files/reports/ | head -1)
```
Count paragraphs per item in Section 1 - should be 2-3 each.

3. **All researchers did similar work:**
```bash
cat logs/$(ls -t logs/ | head -1)/tool_calls.jsonl | grep WebSearch | wc -l
```
Should show 3-7 WebSearches per researcher.

## Comparing Results

### Traditional vs Wide Research

Try these queries to see the difference:

**Traditional Query:**
```
Research quantum computing
```
Result: Topic broken into subtopics, integrated synthesis

**Wide Research Query:**
```
Research quantum computing at IBM, Google, and Microsoft
```
Result: Individual company analyses + comparison

## Output Files

### Directory Structure After Test

```
research-agent/
├── files/
│   ├── research_notes/
│   │   ├── apple.md
│   │   ├── microsoft.md
│   │   ├── google.md
│   │   └── ...
│   └── reports/
│       ├── tech_companies_wide_research_20251114.txt
│       └── ...
└── logs/
    └── session_20251114_143022/
        ├── transcript.txt
        └── tool_calls.jsonl
```

### Viewing Results

**View latest report:**
```bash
cat files/reports/$(ls -t files/reports/ | head -1)
```

**View research notes:**
```bash
ls -la files/research_notes/
cat files/research_notes/apple.md
```

**View session transcript:**
```bash
cat logs/$(ls -t logs/ | head -1)/transcript.txt
```

**View tool call logs:**
```bash
cat logs/$(ls -t logs/ | head -1)/tool_calls.jsonl | jq .
```

## Performance Testing

### Small Scale (Good for Initial Testing)
- **List size**: 3-5 items
- **Expected time**: 2-4 minutes
- **Cost**: ~$0.10-0.20 (with Haiku)

### Medium Scale
- **List size**: 10-20 items
- **Expected time**: 3-5 minutes (parallel execution)
- **Cost**: ~$0.30-0.60

### Large Scale (Advanced Testing)
- **List size**: 50-100 items
- **Expected time**: 4-6 minutes (with batching)
- **Cost**: ~$1.50-3.00
- **Note**: Agent will ask for confirmation before proceeding

## Troubleshooting

### Error: "ANTHROPIC_API_KEY not found"
**Solution**: Set your API key (see Setup above)

### Error: "Module not found"
**Solution**:
```bash
uv sync
```

### No research notes created
**Check**:
```bash
ls -la files/research_notes/
cat logs/$(ls -t logs/ | head -1)/transcript.txt
```
Look for errors in transcript.

### Report quality seems low
**Verify**: Each researcher did 3-7 WebSearches
```bash
cat logs/$(ls -t logs/ | head -1)/tool_calls.jsonl | grep -c WebSearch
```

### Items getting unequal treatment
**Check research note sizes:**
```bash
wc -l files/research_notes/*.md
```
Should be similar (~40-80 lines each).

## Success Criteria

A successful Wide Research test should show:

✅ **List parsing**: Lead agent correctly identifies all items
✅ **Parallel spawning**: All researchers start simultaneously
✅ **Equal searches**: Each researcher does 3-7 WebSearches
✅ **Consistent notes**: All .md files are 3-4 paragraphs (~40-80 lines)
✅ **Complete report**: Three-section report with equal representation
✅ **No errors**: Clean execution in transcript.txt
✅ **Quality**: Item #1 and last item have similar detail

## Next Steps

After successful testing:

1. **Try larger lists** (10, 20, 50 items)
2. **Test different domains** (papers, products, people, etc.)
3. **Experiment with aspects** ("financial performance", "AI efforts", etc.)
4. **Compare with traditional mode** (same topic, different approaches)
5. **Analyze tool call logs** (understand agent behavior)

## Configuration Options

You can configure Wide Research via environment variables:

```bash
# Maximum parallel researchers (default: 100)
export WIDE_RESEARCH_MAX_PARALLEL=50

# Batch size for large lists (default: 50)
export WIDE_RESEARCH_BATCH_SIZE=25

# Auto-batch without asking (default: false)
export WIDE_RESEARCH_AUTO_BATCH=true

# Minimum items for confirmation prompt (default: 20)
export WIDE_RESEARCH_MIN_CONFIRM=15
```

Then run:
```bash
uv run research_agent/agent_wide.py
```

## Example Test Session

```bash
$ cd research-agent
$ export ANTHROPIC_API_KEY="sk-ant-..."
$ uv sync
$ uv run research_agent/agent_wide.py

=== Wide Research Agent ===
Provide a list of items (companies, papers, products, etc.) to research.
Each item gets a dedicated researcher - ensuring equal quality from item #1 to #100.

You: Research Apple, Microsoft, and Google

Agent: Processing 3 companies. Spawning dedicated researcher for each.

[... researchers work in parallel ...]

Agent: Complete. 3 companies researched with equal depth. Report: files/reports/tech_companies_wide_research_20251114.txt

You: exit
```

Check output:
```bash
$ cat files/reports/tech_companies_wide_research_20251114.txt
```

## Automated Test Script

For quick testing, use the included test script:

```bash
./test_wide_research.sh
```

This will:
1. Check API key
2. Install dependencies
3. Run a 3-item test automatically
4. Show results

Happy testing! 🎉

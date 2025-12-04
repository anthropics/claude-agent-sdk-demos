# Wide Research Mode

## Overview

Wide Research is an architectural evolution of the research agent that solves the **"fabrication threshold" problem** - the tendency for AI systems to produce lower-quality outputs for later items in a list as context windows fill up.

## The Problem: Context Degradation

When asked to research a list of items (e.g., "Analyze 50 companies"), traditional approaches suffer from quality degradation:

- **Item #1**: Detailed, comprehensive analysis
- **Item #20**: Brief summary
- **Item #50**: Generic filler or fabricated content

This happens because all items share the same context window, leading to:
- Context accumulation
- Memory constraints
- Attention dilution
- Quality inconsistency

## The Solution: Wide Research Architecture

Wide Research ensures **equal quality for every item** by spawning **one dedicated researcher per list item**:

```
Traditional: One agent → All 50 items → Quality degrades
Wide Research: 50 agents → One item each → Consistent quality
```

### Key Guarantees

✅ **Equal Attention**: Item #1 and item #100 receive identical treatment
✅ **Fresh Context**: Each researcher starts with a clean context window
✅ **Parallel Execution**: All researchers work simultaneously
✅ **Consistent Depth**: Same number of searches, same analysis depth
✅ **No Fabrication**: Every item gets real research, not generic filler

## Architecture Comparison

### Traditional Research Agent

**Use Case**: Deep exploration of a single topic

**Architecture**:
```
User: "Research quantum computing"
  ↓
Lead Agent: Breaks into 2-4 subtopics
  ↓
Researchers: Investigate each subtopic in parallel
  ↓
Report Writer: Synthesizes all subtopics into one report
```

**Example**:
- Subtopic 1: Quantum hardware/qubits
- Subtopic 2: Quantum algorithms
- Subtopic 3: Industry players
- Subtopic 4: Challenges/timeline

**Best For**:
- Comprehensive topic exploration
- Single-subject deep dives
- Synthesized reports on complex topics

### Wide Research Agent

**Use Case**: Analyzing lists of items with equal quality

**Architecture**:
```
User: "Research Apple, Microsoft, Google, ... (100 companies)"
  ↓
Lead Agent: Spawns ONE researcher per company
  ↓
Researchers: Each investigates their assigned company (100 parallel agents)
  ↓
Report Writer: Aggregates all individual reports + comparative analysis
```

**Example**:
- Researcher 1: Apple
- Researcher 2: Microsoft
- Researcher 3: Google
- ...
- Researcher 100: Company #100

**Best For**:
- Analyzing lists of items (companies, papers, products, people)
- Ensuring equal quality across all items
- Comparative analysis
- Large-scale research projects

## Usage

### Running Wide Research Mode

```bash
# Option 1: Direct Python execution
python -m research_agent.agent_wide

# Option 2: After installation with pip install -e .
research-agent-wide
```

### Running Traditional Mode

```bash
# Option 1: Direct Python execution
python -m research_agent.agent

# Option 2: After installation
research-agent
```

### Example Queries

**Wide Research Mode**:
```
"Research Apple, Microsoft, Google, Amazon, Tesla"
"Compare quantum computing efforts at IBM, Google, and Microsoft"
"Analyze these SaaS companies: Salesforce, HubSpot, Zendesk, Slack"
"Research the top 20 AI research papers from 2024"
"Compare financial performance of FAANG companies"
```

**Traditional Mode**:
```
"Research quantum computing developments"
"Analyze the electric vehicle market"
"Research renewable energy trends"
```

## Configuration

Wide Research can be configured via environment variables:

```bash
# Maximum number of parallel researchers (default: 100)
export WIDE_RESEARCH_MAX_PARALLEL=100

# Batch size for very large lists (default: 50)
export WIDE_RESEARCH_BATCH_SIZE=50

# Auto-batch without user confirmation (default: false)
export WIDE_RESEARCH_AUTO_BATCH=false

# Minimum items to trigger confirmation prompt (default: 20)
export WIDE_RESEARCH_MIN_CONFIRM=20
```

### Large List Handling

For lists with 100+ items, the agent will:

1. **Detect large list**: "150 items detected"
2. **Ask for confirmation**: "This will spawn 150 parallel researchers. Proceed?"
3. **Batch if needed**: "Processing in batches of 50"
4. **Report progress**: "Batch 1/3 complete"

You can bypass confirmation with `WIDE_RESEARCH_AUTO_BATCH=true`.

## Report Structure

Wide Research reports have three sections:

### Section 1: Individual Item Summaries
- Dedicated subsection for each item
- 2-3 paragraphs per item
- Key findings and sources
- Equal length/depth for all items

### Section 2: Comparative Analysis
- Patterns and trends across items
- Leaders and laggards
- Comparison tables
- Outlier identification

### Section 3: Overall Synthesis
- High-level insights
- Key takeaways
- Recommendations
- Summary statistics

## File Organization

Wide Research uses the same file structure:

```
research-agent/
├── files/
│   ├── research_notes/
│   │   ├── apple.md              # Individual item research
│   │   ├── microsoft.md
│   │   ├── google.md
│   │   └── ...
│   └── reports/
│       └── tech_companies_wide_research_20251114.txt
└── logs/
    └── session_20251114_143022/
        ├── transcript.txt
        └── tool_calls.jsonl
```

## Performance Characteristics

| Metric | Traditional | Wide Research |
|--------|-------------|---------------|
| **Items per run** | 1 topic | 1-100+ items |
| **Parallel agents** | 2-4 researchers | 1 per item |
| **Quality consistency** | N/A (single topic) | Guaranteed equal |
| **Best for** | Deep dives | List analysis |
| **Context window** | Shared | Individual per item |
| **Fabrication risk** | Low | Eliminated |

## Technical Details

### Prompt Files

Wide Research uses dedicated prompts:
- `prompts/lead_agent_wide.txt` - List parsing and orchestration
- `prompts/researcher_wide.txt` - Individual item research
- `prompts/report_writer_wide.txt` - Multi-item aggregation

### Agent Definitions

```python
agents = {
    "researcher": AgentDefinition(
        description="Research ONE specific item from a list",
        tools=["WebSearch", "Write"],
        prompt=researcher_wide_prompt,
        model="haiku"
    ),
    "report-writer": AgentDefinition(
        description="Aggregate multi-item research",
        tools=["Skill", "Write", "Glob", "Read"],
        prompt=report_writer_wide_prompt,
        model="haiku"
    )
}
```

### Execution Flow

1. **User input**: "Research companies: A, B, C, D, E"
2. **Lead agent**: Parses list → [A, B, C, D, E]
3. **Spawning**: Creates 5 researcher subagents in parallel
4. **Research phase**: Each researcher:
   - Uses WebSearch 3-7 times
   - Saves findings to `files/research_notes/{item}.md`
   - Maintains same quality standards
5. **Aggregation**: Report-writer reads all notes
6. **Report generation**: Creates three-section report
7. **Output**: `files/reports/companies_wide_research_YYYYMMDD.txt`

## Preventing Quality Degradation

Wide Research prevents quality degradation through:

1. **Dedicated Context**: Each item gets its own fresh context window
2. **Parallel Processing**: No sequential context accumulation
3. **Identical Instructions**: Same prompt template for all researchers
4. **Consistent Standards**: Hard-coded quality requirements (3-7 searches, 3-4 paragraphs)
5. **Equal Representation**: Report writer enforces equal space for all items

## When to Use Each Mode

### Use Traditional Research Agent When:
- Researching a single complex topic
- Need subtopic decomposition
- Want integrated synthesis report
- Topic exploration and discovery

### Use Wide Research Agent When:
- Analyzing a list of items (companies, papers, products)
- Need equal quality across all items
- Performing comparative analysis
- Researching 5-100+ similar entities
- Quality consistency is critical

## Comparison to Manus Wide Research

This implementation is inspired by Manus's Wide Research approach:

**Similarities**:
- One agent per list item
- Equal quality guarantee
- Parallel execution
- Prevents fabrication threshold

**Differences**:
- **Scale**: Manus uses 100+ full autonomous agents; this uses lightweight Haiku specialists
- **Agent Type**: Manus uses complete Manus instances; this uses purpose-built researchers
- **Cost**: This is more cost-efficient with Haiku model
- **Complexity**: This has simpler architecture with hierarchical coordination

## Examples

### Example 1: Research 5 Tech Companies

**Input**:
```
Research Apple, Microsoft, Google, Amazon, Tesla
```

**Process**:
- Spawns 5 parallel researchers
- Each researches their assigned company
- Report writer creates comparative analysis

**Output**: `files/reports/tech_companies_wide_research_20251114.txt`

### Example 2: Compare Quantum Computing Efforts

**Input**:
```
Compare quantum computing at IBM, Google, Microsoft, IonQ, and Rigetti
```

**Process**:
- 5 researchers investigate quantum computing at each company
- Equal depth for all companies
- Comparative analysis of approaches

**Output**: Individual summaries + comparison + synthesis

### Example 3: Large List (50 Items)

**Input**:
```
Analyze the top 50 SaaS companies
```

**Process**:
- Agent asks: "50 items detected. Proceed with 50 parallel researchers?"
- User confirms
- Spawns 50 researchers simultaneously
- Creates comprehensive report

**Output**: 50 individual summaries + comparative analysis

## Limitations and Considerations

### API Costs
- More researchers = more API calls
- 100 items = 100 parallel Haiku agents
- Consider costs for very large lists

### Rate Limits
- Parallel spawning may hit rate limits
- Batching helps manage this
- Configure `WIDE_RESEARCH_BATCH_SIZE` appropriately

### Optimal List Size
- **Sweet Spot**: 5-50 items
- **Manageable**: 51-100 items (with batching)
- **Large**: 100+ items (consider sub-selection or batching)

### Not Suitable For
- Single topic research (use traditional mode)
- Unrelated items requiring different research approaches
- Items needing different analysis frameworks

## Future Enhancements

Potential improvements:
- Dynamic batch size based on API limits
- Progress tracking for long-running lists
- Resume capability for interrupted sessions
- Custom researcher templates per item type
- Adaptive depth based on item complexity
- Smart list parsing (auto-detect format)

## Summary

Wide Research transforms the research agent from a **topic explorer** into a **list analyzer**, ensuring that every item receives equal treatment regardless of its position in the list. This architectural evolution solves the fabrication threshold problem and enables consistent, high-quality research at scale.

**Key Innovation**: One researcher per item = Equal quality from #1 to #100

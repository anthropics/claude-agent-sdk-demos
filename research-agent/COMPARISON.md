# Research Agent vs Wide Research: Architecture Comparison

## Side-by-Side Comparison

| Aspect | Traditional Research Agent | Wide Research Agent |
|--------|---------------------------|---------------------|
| **Primary Use Case** | Deep exploration of a single topic | Analyzing lists of items with equal quality |
| **Input Type** | Research topic/question | List of items (comma-separated, numbered, etc.) |
| **Decomposition Strategy** | Topic → 2-4 subtopics | List → Individual items (1:1 mapping) |
| **Researcher Spawning** | 2-4 researchers (subtopics) | N researchers (one per item, N can be 100+) |
| **Quality Guarantee** | Comprehensive topic coverage | Equal quality for all items (#1 = #100) |
| **Context Management** | Shared knowledge across subtopics | Isolated per item (prevents degradation) |
| **Parallelization** | Medium (2-4 parallel agents) | High (potentially 100+ parallel agents) |
| **Report Structure** | Integrated synthesis of subtopics | Individual summaries + comparative analysis |
| **Best For** | "Research quantum computing" | "Research 50 tech companies" |
| **Problem Solved** | Topic complexity | Fabrication threshold / quality degradation |

## Detailed Comparison

### Input Processing

**Traditional**:
```
Input: "Research quantum computing"
↓
Parse: Topic = "quantum computing"
↓
Analyze: What subtopics cover this comprehensively?
↓
Decompose: [hardware, algorithms, industry, challenges]
```

**Wide Research**:
```
Input: "Research Apple, Microsoft, Google"
↓
Parse: List = ["Apple", "Microsoft", "Google"]
↓
Extract context: General research (no specific aspect)
↓
Map: 1 researcher per item
```

### Agent Spawning

**Traditional**:
```python
# Spawn 2-4 researchers for subtopics
spawn researcher → "quantum hardware and qubits"
spawn researcher → "quantum algorithms"
spawn researcher → "industry players"
spawn researcher → "challenges and timeline"

# Total: ~4 agents for 1 topic
```

**Wide Research**:
```python
# Spawn 1 researcher per list item
spawn researcher → "Apple"
spawn researcher → "Microsoft"
spawn researcher → "Google"
# ... continues for all items

# Total: N agents for N items (scalable to 100+)
```

### Research Execution

**Traditional**:
| Agent | Assignment | Output |
|-------|------------|--------|
| Researcher 1 | Quantum hardware subtopic | `files/research_notes/quantum_hardware.md` |
| Researcher 2 | Quantum algorithms subtopic | `files/research_notes/quantum_algorithms.md` |
| Researcher 3 | Industry players subtopic | `files/research_notes/industry_players.md` |
| Researcher 4 | Challenges subtopic | `files/research_notes/challenges.md` |

**Wide Research**:
| Agent | Assignment | Output |
|-------|------------|--------|
| Researcher 1 | Apple (company) | `files/research_notes/apple.md` |
| Researcher 2 | Microsoft (company) | `files/research_notes/microsoft.md` |
| Researcher 3 | Google (company) | `files/research_notes/google.md` |
| ... | ... | ... |
| Researcher N | Item N | `files/research_notes/item_n.md` |

### Report Generation

**Traditional**:
```
Report Writer reads:
├── quantum_hardware.md
├── quantum_algorithms.md
├── industry_players.md
└── challenges.md

Synthesizes into:
└── quantum_computing_summary_YYYYMMDD.txt
    (Integrated narrative covering all subtopics)
```

**Wide Research**:
```
Report Writer reads:
├── apple.md
├── microsoft.md
├── google.md
└── ... (all items)

Creates:
└── tech_companies_wide_research_YYYYMMDD.txt
    ├── Section 1: Individual Summaries (one per item)
    ├── Section 2: Comparative Analysis
    └── Section 3: Overall Synthesis
```

### Quality Characteristics

**Traditional**:
- **Depth**: Deep dive into each subtopic
- **Breadth**: Comprehensive coverage of topic
- **Integration**: Subtopics woven together
- **Risk**: None (single topic, no list degradation)

**Wide Research**:
- **Consistency**: Equal depth for all items
- **Comparison**: Built-in comparative analysis
- **Scalability**: Handles 5-100+ items
- **Guarantee**: No quality degradation (item #1 = item #100)

### Example Outputs

**Traditional Report Structure**:
```
QUANTUM COMPUTING RESEARCH SUMMARY
===================================

Overview:
[Integrated synthesis of all subtopics]

Hardware and Qubits:
[Detailed findings from Researcher 1]

Algorithms and Applications:
[Detailed findings from Researcher 2]

Industry Landscape:
[Detailed findings from Researcher 3]

Challenges and Timeline:
[Detailed findings from Researcher 4]

Conclusion:
[Overall synthesis]
```

**Wide Research Report Structure**:
```
WIDE RESEARCH REPORT: TECH COMPANIES
=====================================

SECTION 1: INDIVIDUAL ITEM SUMMARIES

--- Apple ---
[2-3 paragraphs with equal depth]

--- Microsoft ---
[2-3 paragraphs with equal depth]

--- Google ---
[2-3 paragraphs with equal depth]

[Equal space for all items]

SECTION 2: COMPARATIVE ANALYSIS

Market Leaders: Apple, Microsoft
Innovation Focus: Google (AI/ML)
Common Patterns: Cloud-first strategies
Key Differences: Hardware vs Software

SECTION 3: OVERALL SYNTHESIS

Key Takeaways:
1. [Insight across all items]
2. [Trend observed]
3. [Recommendation]
```

## Use Case Examples

### Traditional Research Agent

✅ **Perfect For**:
1. "Research quantum computing developments in 2025"
2. "What are the latest trends in renewable energy?"
3. "Analyze the impact of AI on healthcare"
4. "Research the history and future of space exploration"

❌ **Not Ideal For**:
1. "Compare these 20 companies..." (use Wide Research)
2. "Analyze each of these 50 papers..." (use Wide Research)

### Wide Research Agent

✅ **Perfect For**:
1. "Research Apple, Microsoft, Google, Amazon, Tesla"
2. "Compare quantum computing efforts at IBM, Google, Microsoft, IonQ"
3. "Analyze the top 30 AI research papers from 2024"
4. "Research FAANG companies' financial performance"

❌ **Not Ideal For**:
1. "Research quantum computing" (use Traditional - better subtopic decomposition)
2. "What's happening in AI?" (use Traditional - topic exploration)

## Performance Characteristics

### Traditional Research

**Speed**:
- 2-4 parallel researchers
- ~2-5 minutes for typical research task

**Cost**:
- Lower (fewer agents)
- Typical: 4 Haiku agents

**Output**:
- 1 integrated report
- 500-800 words

### Wide Research

**Speed**:
- N parallel researchers (where N = item count)
- ~2-5 minutes regardless of list size (due to parallelism)

**Cost**:
- Higher (one agent per item)
- Typical: 5-50 Haiku agents
- Large lists (50-100): Consider cost implications

**Output**:
- Multi-section report
- Length scales with item count (1200-8000 words)

## Architectural Diagrams

### Traditional Research Flow

```
User Query: "Research quantum computing"
           ↓
    Lead Agent (Haiku)
    [Task tool only]
           ↓
    Decomposes into 2-4 subtopics
           ↓
    ┌──────┴──────┬──────────┬──────────┐
    ↓             ↓          ↓          ↓
Researcher 1  Researcher 2  ...   Researcher 4
[WebSearch]   [WebSearch]         [WebSearch]
[Write]       [Write]             [Write]
    ↓             ↓          ↓          ↓
quantum_      quantum_              challenges.md
hardware.md   algorithms.md
           ↓
    All research complete
           ↓
    Report Writer (Haiku)
    [Read, Glob, Write]
           ↓
    Synthesizes all subtopic notes
           ↓
quantum_computing_summary.txt
```

### Wide Research Flow

```
User Query: "Research Apple, Microsoft, Google"
           ↓
    Lead Agent (Haiku)
    [Task tool only]
           ↓
    Parses list: [Apple, Microsoft, Google]
           ↓
    Spawns 1 researcher per item (parallel)
           ↓
    ┌──────┴──────┬──────────┐
    ↓             ↓          ↓
Researcher 1  Researcher 2  Researcher 3
[Item: Apple] [Item: MSFT]  [Item: Google]
[WebSearch]   [WebSearch]   [WebSearch]
[Write]       [Write]       [Write]
    ↓             ↓          ↓
apple.md      microsoft.md  google.md
           ↓
    All research complete
           ↓
    Report Writer (Haiku)
    [Read, Glob, Write]
           ↓
    Aggregates individual reports
           ↓
tech_companies_wide_research.txt
├── Individual Summaries (3 sections)
├── Comparative Analysis
└── Overall Synthesis
```

## Key Innovation: The Fabrication Threshold Problem

### Problem Illustration

**Without Wide Research (Single Agent, Multiple Items)**:
```
Agent researching 50 companies:

Item #1:  ████████████ (100% quality, full context available)
Item #10: ██████████   (80% quality, context filling up)
Item #25: ██████       (50% quality, context mostly full)
Item #40: ████         (30% quality, fabricating details)
Item #50: ██           (20% quality, generic filler)
```

**With Wide Research (One Agent Per Item)**:
```
50 parallel researchers, each researching 1 company:

Item #1:  ████████████ (100% quality, fresh context)
Item #10: ████████████ (100% quality, fresh context)
Item #25: ████████████ (100% quality, fresh context)
Item #40: ████████████ (100% quality, fresh context)
Item #50: ████████████ (100% quality, fresh context)
```

### Solution Mechanism

Wide Research prevents quality degradation through:

1. **Context Isolation**: Each item gets its own fresh context window
2. **Parallel Processing**: No sequential context accumulation
3. **Identical Instructions**: Same prompt template for all researchers
4. **Hard Constraints**: Enforced quality standards (3-7 searches, 3-4 paragraphs)
5. **Equal Representation**: Report writer ensures equal space for all items

## Summary

The research agent architecture has evolved from a **hierarchical topic explorer** to include a **parallel list analyzer** mode:

- **Traditional Mode**: Best for exploring complex topics through subtopic decomposition
- **Wide Research Mode**: Best for analyzing lists with guaranteed equal quality

Both modes share the same underlying infrastructure (hooks, tracking, file organization) but differ fundamentally in how they approach the research task.

**Choose based on your input**:
- Single topic/question → Traditional
- List of items → Wide Research

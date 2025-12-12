---
description: Start a focused research session on any topic
argument-hint: "<topic>"
---

Research the following topic thoroughly: $ARGUMENTS

## Research Strategy

1. **Break Down the Topic**
   - Identify 2-4 key subtopics or angles to investigate
   - Ensure comprehensive coverage without redundancy

2. **Parallel Research**
   - Spawn researcher subagents for each subtopic
   - Each researcher should conduct 3-7 web searches
   - Focus on authoritative, recent sources (2024-2025)

3. **Source Quality**
   - Prioritize: academic papers, official docs, reputable news
   - Cross-reference claims from multiple sources
   - Note any conflicting information

4. **Output Requirements**
   - Save findings to files/research_notes/
   - Use clear, descriptive filenames
   - Include source URLs for citations

5. **Synthesis**
   - After all research is complete, automatically spawn report-writer
   - Create a comprehensive synthesis in files/reports/

## Quality Standards
- Minimum 3 sources per subtopic
- Include diverse perspectives
- Flag areas where information is uncertain or conflicting
- Note knowledge gaps for potential follow-up

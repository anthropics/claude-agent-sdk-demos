# Document Processing Skills Setup

This guide explains how to add document processing capabilities (Excel, Word, PDF, PowerPoint) to the research agent using Claude Agent SDK skills.

## Overview

The research agent now supports document processing skills that extend its capabilities to work with:
- 📊 **Excel (.xlsx)** - Spreadsheets with formulas, formatting, and data analysis
- 📄 **Word (.docx)** - Professional documents with tracked changes and comments
- 📑 **PDF** - PDF manipulation, form filling, and text extraction
- 📊 **PowerPoint (.pptx)** - Presentation creation and editing

## Quick Setup

The skills have already been set up in `.claude/skills/` directory:

```bash
research-agent/
└── .claude/
    └── skills/
        ├── README.md          # Skills documentation
        ├── xlsx/              # Excel processing
        │   ├── SKILL.md
        │   ├── recalc.py
        │   └── LICENSE.txt
        ├── docx/              # Word processing
        │   ├── SKILL.md
        │   ├── scripts/
        │   └── LICENSE.txt
        ├── pdf/               # PDF processing
        │   ├── SKILL.md
        │   ├── scripts/
        │   └── LICENSE.txt
        └── pptx/              # PowerPoint processing
            ├── SKILL.md
            ├── scripts/
            └── LICENSE.txt
```

## How It Works

### Automatic Discovery

The research agent automatically discovers skills because:

1. **Configuration in agent.py (line 97):**
   ```python
   options = ClaudeAgentOptions(
       setting_sources=["project"],  # ✅ Loads skills from .claude directory
       ...
   )
   ```

2. **Report-writer has Skill tool access (line 73):**
   ```python
   "report-writer": AgentDefinition(
       tools=["Skill", "Write", "Glob", "Read"],  # ✅ Can use skills
       ...
   )
   ```

3. **Skills placed in `.claude/skills/`:** ✅ All 4 document skills installed

### No Code Changes Needed!

The SDK automatically:
- Scans `.claude/skills/` directory on startup
- Parses each `SKILL.md` file's YAML frontmatter
- Makes skills available to agents with `Skill` tool access
- Loads skills when relevant based on descriptions

## Usage Examples

### Example 1: Excel Report

**User:** "Research Tesla, Ford, and GM, then create an Excel spreadsheet comparing them"

**What happens:**
1. Lead agent spawns 3 researchers (one per company)
2. Researchers gather information and save to `files/research_notes/`
3. Report-writer loads the **xlsx skill** (auto-discovered)
4. Creates Excel file with comparison table, formulas, and formatting
5. Output: Professional spreadsheet in `files/reports/`

### Example 2: Word Document

**User:** "Research quantum computing and create a Word document report"

**What happens:**
1. Lead agent spawns researchers for quantum computing
2. Researchers gather findings
3. Report-writer loads the **docx skill** (auto-discovered)
4. Creates formatted Word document with sections, styles, and references
5. Output: Professional .docx in `files/reports/`

### Example 3: PowerPoint Presentation

**User:** "Research AI trends in 2025 and create a PowerPoint presentation"

**What happens:**
1. Researchers gather AI trends information
2. Report-writer loads the **pptx skill** (auto-discovered)
3. Creates presentation with slides, layouts, and charts
4. Output: Professional .pptx in `files/reports/`

### Example 4: PDF Processing

**User:** "Extract key findings from this PDF and create a summary"

**What happens:**
1. Report-writer loads the **pdf skill**
2. Uses PDF extraction scripts to parse content
3. Creates summary document
4. Output: Processed PDF or summary report

## Skills Architecture

### SKILL.md Format

Each skill has a `SKILL.md` file with:

```yaml
---
name: skill-name                    # Unique identifier
description: "When to use this"     # Critical for auto-discovery
license: Proprietary                # Optional
---

# Skill Instructions

Detailed instructions that Claude follows when skill is loaded...
```

### Skill Components

1. **SKILL.md** - Core instructions and guidelines
2. **scripts/** - Python/Node.js utilities for processing
3. **reference.md** - Additional documentation
4. **ooxml.md** - Office Open XML format specs (for docx/pptx)
5. **LICENSE.txt** - Proprietary license terms

## Skill Sources

| Skill | Source | Description |
|-------|--------|-------------|
| xlsx | excel-demo | Adapted from claude-code-sdk-demos/excel-demo |
| docx | anthropics/skills | Official Anthropic document-skills |
| pdf | anthropics/skills | Official Anthropic document-skills |
| pptx | anthropics/skills | Official Anthropic document-skills |

## Verification

To verify skills are loaded:

1. **Check configuration:**
   ```bash
   grep -n "setting_sources\|Skill" research-agent/research_agent/agent.py
   ```
   Should show:
   - Line 73: `tools=["Skill", "Write", "Glob", "Read"]`
   - Line 97: `setting_sources=["project"]`

2. **Check skills directory:**
   ```bash
   ls -la .claude/skills/
   ```
   Should show: `docx/`, `pdf/`, `pptx/`, `xlsx/`, `README.md`

3. **Verify SKILL.md files:**
   ```bash
   find .claude/skills -name "SKILL.md"
   ```
   Should find 4 SKILL.md files

## Manual Setup (If Needed)

If the skills aren't set up, you can add them manually:

### Option 1: Copy from anthropics/skills

```bash
# Clone Anthropic's skills repository
git clone https://github.com/anthropics/skills.git /tmp/skills

# Create skills directory
mkdir -p .claude/skills

# Copy document skills
cp -r /tmp/skills/document-skills/docx .claude/skills/
cp -r /tmp/skills/document-skills/pdf .claude/skills/
cp -r /tmp/skills/document-skills/pptx .claude/skills/
cp -r /tmp/skills/document-skills/xlsx .claude/skills/

# Cleanup
rm -rf /tmp/skills
```

### Option 2: Copy from excel-demo

```bash
# Copy xlsx skill from excel-demo
mkdir -p .claude/skills
cp -r ../excel-demo/agent/.claude/skills/xlsx .claude/skills/
```

## Creating Custom Skills

To add your own skills:

1. **Create skill directory:**
   ```bash
   mkdir -p .claude/skills/my-skill
   ```

2. **Create SKILL.md:**
   ```yaml
   ---
   name: my-skill
   description: "When Claude needs to [describe use case]"
   ---

   # My Skill

   Instructions for Claude to follow...
   ```

3. **Add resources (optional):**
   ```bash
   mkdir -p .claude/skills/my-skill/scripts
   # Add Python scripts, templates, etc.
   ```

4. **Restart agent** - Skills auto-discovered!

## Troubleshooting

### Skills Not Loading?

1. Check `setting_sources` in `agent.py`:
   ```python
   setting_sources=["project"]  # Must include "project"
   ```

2. Verify `.claude/skills/` exists in project root

3. Check SKILL.md has valid YAML frontmatter:
   ```yaml
   ---
   name: skill-name
   description: "Description here"
   ---
   ```

4. Ensure report-writer has `Skill` tool:
   ```python
   tools=["Skill", "Write", "Glob", "Read"]
   ```

### Permission Issues?

Skills include Python scripts that may need execute permissions:

```bash
chmod +x .claude/skills/*/scripts/*.py
```

## License Information

All skills are **Proprietary** and subject to license terms in each skill's `LICENSE.txt` file.

- **xlsx:** From excel-demo (Anthropic)
- **docx, pdf, pptx:** From anthropics/skills repository

See individual LICENSE.txt files for complete terms.

## Resources

- **Anthropic Skills Repo:** https://github.com/anthropics/skills
- **Claude Agent SDK:** https://docs.claude.com/en/docs/agent-sdk/overview
- **Skills Documentation:** https://docs.claude.com/en/docs/claude-code/skills
- **Research Agent README:** [README.md](README.md)

## Summary

✅ **Skills are ready to use!**

The research agent can now:
- Create Excel spreadsheets with formulas and formatting
- Generate Word documents with professional styling
- Process and fill PDF forms
- Create PowerPoint presentations

No additional configuration needed - just run the agent and ask for document creation!

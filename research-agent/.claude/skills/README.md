# Document Processing Skills

These skills extend the research agent's report-writer with document creation capabilities.

## Available Skills

### 📊 xlsx - Excel Spreadsheet Processing
- Create and edit Excel spreadsheets (.xlsx, .xlsm)
- Work with formulas, formatting, and data analysis
- Recalculate formulas automatically
- Support for multiple sheets and complex data

**Source**: Anthropic document-skills

### 📄 docx - Word Document Processing
- Create and edit Word documents (.docx)
- Track changes and comments
- Professional formatting and styles
- Preserve document structure

**Source**: Anthropic document-skills

### 📑 pdf - PDF Processing
- Extract text and tables from PDFs
- Create new PDF documents
- Merge and split PDFs
- Fill PDF forms

**Source**: Anthropic document-skills

### 📊 pptx - PowerPoint Presentation Processing
- Create and edit presentations (.pptx)
- Work with slides, layouts, and themes
- Add speaker notes and comments
- Professional presentation formatting

**Source**: Anthropic document-skills

## Usage

The report-writer agent automatically discovers and uses these skills when needed. Simply request document creation in your preferred format:

```
"Research Apple, Microsoft, Google and create an Excel comparison"
"Create a Word document report on quantum computing"
"Make a PowerPoint presentation about AI trends"
```

## How It Works

1. **Auto-Discovery**: Skills are loaded from `.claude/skills/` on startup
2. **Tool Access**: Report-writer has `Skill` tool in its toolset
3. **Smart Loading**: Skills load automatically based on task description
4. **Format Support**: Choose output format naturally in your request

## Architecture

```
research-agent/
└── .claude/
    └── skills/
        ├── README.md (this file)
        ├── docx/
        │   └── SKILL.md
        ├── pdf/
        │   └── SKILL.md
        ├── pptx/
        │   └── SKILL.md
        └── xlsx/
            └── SKILL.md
```

## License

All skills are proprietary and subject to Anthropic's license terms. See individual LICENSE.txt files in each skill directory.

## Resources

- **Skills Repository**: https://github.com/anthropics/skills
- **Documentation**: See [SKILLS_SETUP.md](../../SKILLS_SETUP.md)

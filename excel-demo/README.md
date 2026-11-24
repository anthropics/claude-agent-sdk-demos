# Excel Demo

> ⚠️ **IMPORTANT**: This is a demo application by Anthropic. It is intended for local development only and should NOT be deployed to production or used at scale.

A demonstration desktop application powered by Claude and the [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk), showcasing AI-powered spreadsheet creation, analysis, and manipulation capabilities.

## What This Demo Shows

This Electron-based desktop application demonstrates how to:
- Create sophisticated Excel spreadsheets with formulas, formatting, and multiple sheets
- Analyze and manipulate existing spreadsheet data
- Use Claude to assist with data organization and spreadsheet design
- Work with Python scripts to generate complex spreadsheet structures
- Integrate the Claude Agent SDK with desktop applications

### Example Use Cases

The `agent/` folder holds the Excel agent's instructions and the xlsx skill. Things you can ask the agent to build include:
- **Workout Tracker**: A fitness log with automatic summary statistics and multiple sheets
- **Budget Tracker**: Financial tracking with formulas and data validation
- Custom spreadsheet generation with styling, borders, and conditional formatting

## Prerequisites

- [Node.js 18+](https://nodejs.org) or [Bun](https://bun.sh)
- An Anthropic API key ([get one here](https://console.anthropic.com))
- Python 3.9+ (for the Python agent examples)
- LibreOffice (optional, for formula recalculation)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/anthropics/sdk-demos.git
cd sdk-demos/excel-demo
```

2. Install dependencies:
```bash
npm install
# or bun install
```

3. Configure your Anthropic API key:
   - Set the `ANTHROPIC_API_KEY` environment variable, or
   - The application will prompt you on first run

4. Run the Electron application:
```bash
npm start
# or bun start
```

## Working with the Python Agent Setup

The `agent/` directory contains the Excel agent's instructions (`CLAUDE.MD`), its Python requirements, and the xlsx skill (`.claude/skills/xlsx/`). It does not include ready-made example scripts; the agent generates spreadsheets with `openpyxl` on request.

### Setup Python Environment

```bash
cd agent
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Recalculate Formulas

After the agent writes a workbook, recalculate its formulas with the bundled script (requires LibreOffice):

```bash
python .claude/skills/xlsx/recalc.py <excel_file> [timeout_seconds]
```

See the [agent/README.md](./agent/README.md) for more details on the Excel agent setup and capabilities.

## Features

- **AI-Powered Spreadsheet Generation**: Let Claude create complex spreadsheets based on your requirements
- **Formula Management**: Work with Excel formulas, calculations, and automatic recalculation
- **Professional Styling**: Generate spreadsheets with headers, colors, borders, and formatting
- **Multi-Sheet Workbooks**: Create workbooks with multiple related sheets
- **Data Analysis**: Analyze existing spreadsheets and extract insights
- **Desktop Integration**: Native desktop application built with Electron

## Project Structure

```
excel-demo/
├── agent/              # Excel agent setup
│   ├── CLAUDE.MD       # Excel agent instructions
│   ├── requirements.txt
│   ├── .claude/skills/xlsx/  # xlsx skill and recalc.py
│   └── README.md       # Excel agent documentation
├── src/
│   ├── main/          # Electron main process
│   └── renderer/      # React UI components
└── package.json
```

## Resources

- [Claude Agent SDK Documentation](https://platform.claude.com/docs/en/agent-sdk)
- [Electron Documentation](https://www.electronjs.org/docs/latest/)
- [openpyxl Documentation](https://openpyxl.readthedocs.io/) (Python library used)

## Support

This is a demo application provided as-is. For issues related to:
- **Claude Agent SDK**: [SDK Documentation](https://platform.claude.com/docs/en/agent-sdk)
- **Demo Issues**: [GitHub Issues](https://github.com/anthropics/sdk-demos/issues)
- **API Questions**: [Anthropic Support](https://support.anthropic.com)

## License

MIT - This is sample code for demonstration purposes.

---

Built by Anthropic to demonstrate the [Claude Agent SDK](https://github.com/anthropics/claude-code-sdk)

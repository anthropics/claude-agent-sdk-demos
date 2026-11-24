# Excel Agent Setup

This folder contains an Excel-specialized agent that uses the xlsx skill to work with spreadsheets.

## Prerequisites

The setup has been completed and includes:

- Python 3.13.5
- LibreOffice (for formula recalculation)
- Python virtual environment with required packages

## Python Environment

A virtual environment has been created in `.venv` with the following packages:
- `openpyxl` - For creating and editing Excel files with formulas and formatting
- `pandas` - For data analysis and manipulation

### Activating the Virtual Environment

To use the Python environment, activate it first:

```bash
# From the agent folder
source .venv/bin/activate
```

To deactivate:

```bash
deactivate
```

### Installing Dependencies

If you need to reinstall dependencies:

```bash
source .venv/bin/activate
pip install -r requirements.txt
```

## Using the xlsx Skill

The agent has access to the xlsx skill located in `.claude/skills/xlsx/`. This skill provides:

- Creating new spreadsheets with formulas and formatting
- Reading and analyzing spreadsheet data
- Modifying existing spreadsheets while preserving formulas
- Data analysis and visualization
- Formula recalculation using LibreOffice

## Formula Recalculation

The xlsx skill includes a `recalc.py` script that uses LibreOffice to recalculate formulas:

```bash
source .venv/bin/activate
python .claude/skills/xlsx/recalc.py <excel_file> [timeout_seconds]
```

Example:
```bash
python .claude/skills/xlsx/recalc.py my_workbook.xlsx 30
```

The script will:
- Automatically configure LibreOffice on first run
- Recalculate all formulas
- Check for errors (#REF!, #DIV/0!, etc.)
- Return JSON with error details

## Files in this Folder

- `CLAUDE.MD` - Instructions for the Excel Agent
- `.venv/` - Python virtual environment
- `requirements.txt` - Python dependencies
- `.claude/skills/xlsx/` - xlsx skill files

## Testing the Setup

See the test results below to verify everything is working correctly.

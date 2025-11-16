# Codebase Cartographer & Code Review Tools UI

A comprehensive web-based interface for analyzing codebases and performing high-quality code reviews, powered by the Claude Agent SDK.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Python](https://img.shields.io/badge/python-3.8+-green)
![Flask](https://img.shields.io/badge/flask-3.0-red)

## 🎯 Overview

This UI provides intuitive access to powerful codebase analysis and code review capabilities:

### 🧭 **Codebase Cartographer** (5 Analysis Tools)
1. **Hotspot Analysis** - Identify high-complexity, high-churn files needing refactoring
2. **Git Archaeology** - Extract institutional knowledge from version control history
3. **Dependency Graph** - Visualize module relationships and architecture
4. **Data Flow Mapping** - Map architectural planes (Management/Control/Data)
5. **JTBD Story Extraction** - Extract user journeys from code patterns

### 🔍 **Code Review Tool**
- 4-stage review process (Pre-Review → Understanding → Code Review → Feedback)
- 80+ comprehensive checklist items
- High standards for code quality and documentation
- Automated quality scoring

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation & Running

From the project root:

```bash
cd codebase-cartographer-ui
./start.sh
```

Then open http://localhost:5000

### Manual Start

```bash
# Install backend dependencies
cd backend
pip install -r requirements.txt

# Start the API server
python server.py

# Open http://localhost:5000 in your browser
```

## 📁 Project Structure

```
codebase-cartographer-ui/
├── frontend/
│   ├── index.html          # Main React UI (single-file app)
│   └── package.json        # Frontend metadata
├── backend/
│   ├── server.py           # Flask API server
│   ├── requirements.txt    # Python dependencies
│   └── extracted_skills/   # Auto-extracted from .skill files
├── start.sh                # Quick start script
└── README.md              # This file
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│  Frontend (React + Tailwind CSS)       │
│  Single-page app with 3 main sections  │
│  - Home Dashboard                       │
│  - Cartographer Tools                   │
│  - Code Review                          │
└─────────────────────────────────────────┘
                 ↓ HTTP/JSON API
┌─────────────────────────────────────────┐
│  Backend (Flask REST API)               │
│  - Serves frontend                      │
│  - Orchestrates analysis scripts        │
│  - Generates Mandala Chart data         │
└─────────────────────────────────────────┘
                 ↓ Subprocess
┌─────────────────────────────────────────┐
│  Analysis Scripts (Python)              │
│  From codebase-cartographer.skill and   │
│  code-review-skill.skill                │
└─────────────────────────────────────────┘
```

## 🔌 API Endpoints

### Health Check
```bash
GET /api/health
```

### List Available Tools
```bash
GET /api/list-tools
```

### Run Cartographer Analysis
```bash
POST /api/cartographer/analyze
Content-Type: application/json

{
  "tool": "hotspots|archaeology|dependencies|dataflow|jtbd",
  "repo_path": "/path/to/repository",
  "config": {
    "months": 6,
    "extensions": [".py", ".js"]
  }
}
```

### Run Full Analysis
```bash
POST /api/cartographer/full-analysis
Content-Type: application/json

{
  "repo_path": "/path/to/repository"
}
```

### Code Review Analysis
```bash
POST /api/code-review/analyze
Content-Type: application/json

{
  "pr_url": "https://github.com/user/repo/pull/123",
  "stage": "pre-review|understanding|code-review|feedback"
}
```

## 🎨 Features

### Modern UI
- Responsive design with Tailwind CSS
- Dark gradient theme with purple/indigo accents
- Interactive cards and smooth transitions
- Font Awesome icons throughout
- Real-time analysis output display

### Codebase Cartographer Panel
- Select from 5 different analysis tools
- Configure analysis parameters
- View real-time output in terminal-style display
- Export results in JSON format

### Code Review Panel
- 4-stage review workflow
- Interactive checklists for each stage
- Quality score calculation (0-100%)
- Feedback templates (Blocking/Important/Nitpick)

### Upcoming: Mandala Chart Visualization
- Interactive SVG-based concentric rings
- Color-coded health indicators
- Clickable segments for drill-down
- Based on architectural planes

## 🛠️ Development

### Frontend Development

The frontend is a single-file HTML application with embedded React. To modify:

1. Edit `frontend/index.html`
2. Reload browser to see changes
3. No build step required!

### Backend Development

The backend is a Flask application. To develop:

```bash
cd backend
python server.py
# Server runs in debug mode by default
```

### Adding New Analysis Tools

1. Add script to the `.skill` file in project root
2. Update `server.py` with new tool mapping
3. Update frontend `tools.cartographer` array in `index.html`

## 📊 Tool Details

### Hotspot Analysis
- **Metrics**: Commit frequency, LOC, risk score
- **Formula**: `score = (commits × LOC) / 1000`
- **Config**: months, top_n, file extensions

### Git Archaeology
- **Output**: Authorship breakdown, knowledge silos, temporal coupling
- **Identifies**: Bus factor, single-owner risks

### Dependency Graph
- **Supports**: Python, JS/TS, Go, Ruby
- **Output**: Mermaid diagrams, module categorization

### Data Flow Mapping
- **Maps**: Management/Control/Data architectural planes
- **Uses**: Pattern-based classification

### JTBD Story Extraction
- **Extracts**: User journeys from code
- **Supports**: Express, Flask, FastAPI, Django, Rails

## 🐛 Troubleshooting

### API Server Won't Start
```bash
# Install dependencies
pip install -r backend/requirements.txt

# Try with --break-system-packages if needed
pip install --break-system-packages flask flask-cors
```

### Can't Connect to API
- Ensure `backend/server.py` is running
- Check console for errors
- Verify server is on http://localhost:5000

### Script Not Found Errors
- The server auto-extracts `.skill` files from project root
- Ensure `codebase-cartographer.skill` and `code-review-skill.skill` exist

## 🗺️ Roadmap

- [x] Web UI with React
- [x] Flask API server
- [x] Integration with cartographer scripts
- [x] Code review checklist interface
- [ ] Mandala Chart interactive visualization
- [ ] Historical comparison tracking
- [ ] GitHub API integration
- [ ] PDF export
- [ ] Team collaboration features

## 📝 License

Part of the Claude Agent SDK demos repository.

## 🤝 Contributing

This is a demo project showcasing Claude Agent SDK integration. Feel free to:
- Test with your repositories
- Report issues
- Share customizations
- Suggest improvements

---

**Built with:** React, Tailwind CSS, Flask, Python
**Powered by:** Claude Agent SDK

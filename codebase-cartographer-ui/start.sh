#!/bin/bash
# Startup script for Codebase Cartographer & Code Review Tools UI

echo "============================================================"
echo "Codebase Cartographer & Code Review Tools UI"
echo "============================================================"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/backend"

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

echo "✓ Python 3 found: $(python3 --version)"

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip3."
    exit 1
fi

echo "✓ pip3 found"
echo ""

# Navigate to backend directory
cd "$BACKEND_DIR"

# Install requirements if not already installed
echo "📦 Checking dependencies..."

if ! python3 -c "import flask" 2>/dev/null; then
    echo "Installing Flask..."
    pip3 install --user -r requirements.txt 2>/dev/null || pip3 install --break-system-packages -r requirements.txt
else
    echo "✓ Flask already installed"
fi

if ! python3 -c "import flask_cors" 2>/dev/null; then
    echo "Installing Flask-CORS..."
    pip3 install --user flask-cors 2>/dev/null || pip3 install --break-system-packages flask-cors
else
    echo "✓ Flask-CORS already installed"
fi

echo ""
echo "✓ All dependencies ready"
echo ""
echo "🚀 Starting API server..."
echo ""
echo "   Access the UI at: http://localhost:5000"
echo ""
echo "   Press Ctrl+C to stop the server"
echo ""
echo "============================================================"
echo ""

# Start the API server
python3 server.py

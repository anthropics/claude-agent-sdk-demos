#!/bin/bash
# Quick test script for Wide Research mode

set -e

echo "=================================="
echo "Wide Research Test Script"
echo "=================================="
echo ""

# Check API key
if [ -z "$ANTHROPIC_API_KEY" ]; then
    if [ -f .env ]; then
        echo "✓ Found .env file"
        export $(cat .env | grep ANTHROPIC_API_KEY | xargs)
    else
        echo "✗ Error: ANTHROPIC_API_KEY not set and no .env file found"
        echo ""
        echo "Please set your API key:"
        echo "  export ANTHROPIC_API_KEY='your-key-here'"
        echo "  or create a .env file with: ANTHROPIC_API_KEY='your-key-here'"
        exit 1
    fi
fi

echo "✓ API key is set"
echo ""

# Install dependencies
echo "Installing dependencies..."
uv sync --quiet
echo "✓ Dependencies installed"
echo ""

# Run a quick test
echo "=================================="
echo "Running Wide Research Test"
echo "=================================="
echo "Query: Research Apple, Microsoft, and Google"
echo ""
echo "This will:"
echo "  1. Spawn 3 parallel researchers (one per company)"
echo "  2. Each does 3-7 web searches"
echo "  3. Each saves findings to files/research_notes/"
echo "  4. Report writer aggregates into comparative report"
echo ""
echo "Press Ctrl+C to cancel, or wait 5 seconds to start..."
sleep 5

# Create a test input file
cat > /tmp/wide_research_test_input.txt <<'EOF'
Research Apple, Microsoft, and Google
exit
EOF

echo ""
echo "Starting Wide Research agent..."
echo "=================================="
echo ""

# Run the agent with test input
uv run research_agent/agent_wide.py < /tmp/wide_research_test_input.txt

echo ""
echo "=================================="
echo "Test Complete!"
echo "=================================="
echo ""
echo "Check the output:"
echo "  - Research notes: files/research_notes/"
echo "  - Final report: files/reports/"
echo "  - Session logs: logs/session_*/"
echo ""
echo "To view the latest report:"
echo "  cat files/reports/\$(ls -t files/reports/ | head -1)"
echo ""

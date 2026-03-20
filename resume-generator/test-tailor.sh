#!/bin/bash

echo "Testing Resume Tailor End-to-End..."
echo "==================================="
echo ""
echo "Sample Resume: examples/sample_resume.docx"
echo "Job URL: https://job-boards.greenhouse.io/anthropic/jobs/5098984008"
echo "Job Title: Full Stack Software Engineer, Reinforcement Learning"
echo ""
echo "Starting tailoring process..."
echo ""

curl -X POST http://localhost:3002/api/tailor \
  -F "resume=@examples/sample_resume.docx" \
  -F "jobDescriptionUrl=https://job-boards.greenhouse.io/anthropic/jobs/5098984008" \
  --max-time 600 \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -o test-result.json

echo ""
echo "==================================="
echo "Test completed! Check test-result.json for results"
echo ""

if [ -f "agent/custom_scripts/tailored_resume.docx" ]; then
  echo "✅ Tailored resume generated successfully!"
  ls -lh agent/custom_scripts/tailored_resume.docx
else
  echo "❌ Tailored resume not found"
fi

if [ -f "agent/custom_scripts/tailoring_analysis.md" ]; then
  echo "✅ Analysis generated successfully!"
  echo ""
  echo "First 50 lines of analysis:"
  head -50 agent/custom_scripts/tailoring_analysis.md
else
  echo "❌ Analysis not found"
fi

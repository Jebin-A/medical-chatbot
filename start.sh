#!/bin/bash

# MediScan AI - Start Script
# Double-click this file or run: bash start.sh

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🩺 Starting MediScan AI..."
echo ""

# Kill anything on port 8000
lsof -t -i:8000 | xargs kill -9 2>/dev/null
echo "✓ Cleared port 8000"

# Start FastAPI backend
echo "✓ Starting FastAPI backend..."
osascript -e "tell application \"Terminal\"
  do script \"cd '$PROJECT_DIR/backend' && source '../venv/bin/activate' && uvicorn main:app --port 8000\"
end tell"

# Wait for backend to start
sleep 3

# Start React frontend
echo "✓ Starting React frontend..."
osascript -e "tell application \"Terminal\"
  do script \"cd '$PROJECT_DIR/frontend-react' && npm run dev\"
end tell"

# Wait for frontend to start
sleep 3

# Open in Chrome
echo "✓ Opening Chrome..."
open -a "Google Chrome" http://localhost:5173

echo ""
echo "🎉 MediScan AI is running at http://localhost:5173"

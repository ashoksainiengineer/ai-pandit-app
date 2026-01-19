#!/bin/sh

# 🚀 AI PANDIT - UNIFIED STARTUP SCRIPT
# Runs both Next.js and Express Backend in the same container

echo "📡 Starting Backend (Port 8080)..."
cd /app/backend && npm start &

echo "🎨 Starting Frontend (Port 3000)..."
# Standalone Next.js server runs from /app
cd /app && node server.js

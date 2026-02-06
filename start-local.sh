#!/bin/bash
# AI Pandit - Local Development Startup Script
# Uses same Turso database as production

echo "🚀 Starting AI Pandit Local Development"
echo "========================================"
echo ""

# Check if .env.local exists
if [ ! -f "backend/.env.local" ]; then
    echo "❌ backend/.env.local not found!"
    exit 1
fi

echo "✅ Environment files configured"
echo "✅ Using Turso database (production)"
echo ""
echo "📋 Setup Summary:"
echo "   - Backend: http://localhost:3001"
echo "   - Frontend: http://localhost:3002"
echo "   - Database: Turso (Production)"
echo ""

# Terminal 1: Backend
echo "🖥️  Starting Backend..."
cd backend
cp .env.local .env  # Use local env for development
npm run dev &
BACKEND_PID=$!
cd ..

sleep 3

# Terminal 2: Frontend
echo "🖥️  Starting Frontend..."
npm run dev -- --port 3002 &
FRONTEND_PID=$!

echo ""
echo "✨ Both servers starting..."
echo ""
echo "📱 Open: http://localhost:3002"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID

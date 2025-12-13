#!/bin/bash

# Local Development Startup Script
# This script starts both backend and frontend for local development

echo "🚀 Starting Glowify Marketing AI - Local Development"
echo "=================================================="

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo "⚠️  backend/.env not found!"
    echo "📝 Copy backend/.env.example to backend/.env and fill in your values"
    exit 1
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "⚠️  frontend/.env.local not found!"
    echo "📝 Copy frontend/.env.local.example to frontend/.env.local and fill in your values"
    exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "⚠️  PostgreSQL is not running!"
    echo "💡 Start PostgreSQL: sudo systemctl start postgresql"
    exit 1
fi

# Check if Redis is running
if ! redis-cli ping > /dev/null 2>&1; then
    echo "⚠️  Redis is not running!"
    echo "💡 Start Redis: sudo systemctl start redis"
    exit 1
fi

echo ""
echo "✅ Prerequisites checked"
echo ""

# Start backend
echo "📦 Starting Backend..."
cd backend
npm install > /dev/null 2>&1
npx prisma generate > /dev/null 2>&1

# Start backend in background
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

# Start worker in background
npm run worker > ../logs/worker.log 2>&1 &
WORKER_PID=$!
echo "✅ Worker started (PID: $WORKER_PID)"

cd ..

# Wait a bit for backend to start
sleep 3

# Start frontend
echo "📦 Starting Frontend..."
cd frontend
npm install > /dev/null 2>&1

# Start frontend in background
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"

cd ..

# Create logs directory if it doesn't exist
mkdir -p logs

echo ""
echo "=================================================="
echo "✅ All services started!"
echo ""
echo "📍 Backend API: http://localhost:5000"
echo "📍 Frontend: http://localhost:3000"
echo "📍 Health Check: http://localhost:5000/health"
echo ""
echo "📋 Process IDs:"
echo "   Backend: $BACKEND_PID"
echo "   Worker: $WORKER_PID"
echo "   Frontend: $FRONTEND_PID"
echo ""
echo "📝 Logs:"
echo "   Backend: logs/backend.log"
echo "   Worker: logs/worker.log"
echo "   Frontend: logs/frontend.log"
echo ""
echo "🛑 To stop all services:"
echo "   kill $BACKEND_PID $WORKER_PID $FRONTEND_PID"
echo "   OR: pkill -f 'npm run dev'"
echo "=================================================="

# Wait for user interrupt
trap "echo ''; echo '🛑 Stopping all services...'; kill $BACKEND_PID $WORKER_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

wait


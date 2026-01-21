#!/bin/bash

# Stop existing processes
echo "🛑 Stopping existing services..."
pkill -f "next-server" || true
pkill -f "node.*index.js" || true
pkill -f "tsx" || true
docker-compose up -d postgres redis

# Check ports
echo "🔍 Checking ports..."
if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 5001 is still in use. Killing..."
    kill -9 $(lsof -ti :5001)
fi
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 3001 is still in use. Killing..."
    kill -9 $(lsof -ti :3001)
fi

# Start Backend
echo "🚀 Starting Backend (Port 5001)..."
cd backend

# Build the backend
echo "   Building backend..."
npm run build

# The compiled output is at dist/backend/src/index.js (due to project structure)
# Use tsx as ESM loader to handle imports without .js extensions
PORT=5001 nohup node --import tsx dist/backend/src/index.js > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"
echo $BACKEND_PID > ../backend.pid
cd ..

# Wait for Backend
echo "⏳ Waiting for Backend to initialize..."
sleep 5
RETRY_COUNT=0
MAX_RETRIES=30
until curl -s http://localhost:5001/health > /dev/null; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "❌ Backend failed to start after $MAX_RETRIES attempts."
        echo "   Check backend.log for errors:"
        tail -20 backend.log
        exit 1
    fi
    echo "   ...waiting for backend... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done
echo "✅ Backend is UP!"

# Start Frontend
echo "🚀 Starting Frontend (Port 3001)..."
cd frontend
PORT=3001 nohup npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"
echo $FRONTEND_PID > ../frontend.pid
cd ..

echo "----------------------------------------"
echo "🎉 Development Environment Started!"
echo "----------------------------------------"
echo "Backend:  http://localhost:5001"
echo "Frontend: http://localhost:3001"
echo "Logs:     tail -f backend.log frontend.log"
echo "----------------------------------------"

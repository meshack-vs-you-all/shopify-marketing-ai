#!/bin/bash

# Stop existing processes
echo "🛑 Stopping existing services..."
pkill -f "next-server" || true
pkill -f "node.*index.js" || true
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
npm run build
PORT=5001 nohup npm start > ../backend.log 2>&1 &
echo "   Backend PID: $!"
cd ..

# Wait for Backend
echo "⏳ Waiting for Backend to initialize..."
sleep 5
until curl -s http://localhost:5001/api/ai/health > /dev/null; do
    echo "   ...waiting for backend..."
    sleep 2
done
echo "✅ Backend is UP!"

# Start Frontend
echo "🚀 Starting Frontend (Port 3001)..."
cd frontend
nohup npm run dev > ../frontend.log 2>&1 &
echo "   Frontend PID: $!"
cd ..

echo "----------------------------------------"
echo "🎉 Development Environment Started!"
echo "----------------------------------------"
echo "Backend:  http://localhost:5001"
echo "Frontend: http://localhost:3001"
echo "Logs:     tail -f backend.log frontend.log"
echo "----------------------------------------"

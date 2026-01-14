#!/bin/bash

# Simple test runner for Shopify Marketing AI Platform
# This script starts the application for local testing

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Shopify Marketing AI - Quick Test${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Set test environment variables
export NODE_ENV=development
export KLAVIYO_API_KEY=""  # Optional, not required for testing

# Check if dependencies are installed
if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    cd frontend && npm install && cd ..
fi

# Generate Prisma client
echo -e "${BLUE}Setting up database...${NC}"
cd backend
npx prisma generate 2>/dev/null
cd ..

# Kill any existing processes on our ports
echo -e "${BLUE}Checking ports...${NC}"
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null

# Start backend
echo -e "${GREEN}Starting Backend API on port 3001...${NC}"
cd backend
npx tsx src/index.ts > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo -e "${BLUE}Waiting for backend to start...${NC}"
sleep 5

# Check if backend is running
if curl -f http://localhost:3001/health >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running!${NC}"
else
    echo -e "${YELLOW}⚠ Backend health check failed, but may still be starting...${NC}"
fi

# Start frontend
echo -e "${GREEN}Starting Frontend on port 3000...${NC}"
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend
echo -e "${BLUE}Waiting for frontend to compile (this may take a minute)...${NC}"
sleep 10

# Print success message
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Application Started!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${CYAN}Access the application at:${NC}"
echo -e "  Frontend: ${BLUE}http://localhost:3000${NC}"
echo -e "  Backend:  ${BLUE}http://localhost:3001${NC}"
echo -e "  Health:   ${BLUE}http://localhost:3001/health${NC}"
echo ""
echo -e "${CYAN}View logs:${NC}"
echo -e "  Backend:  ${YELLOW}tail -f backend.log${NC}"
echo -e "  Frontend: ${YELLOW}tail -f frontend.log${NC}"
echo ""
echo -e "${CYAN}Testing Guide:${NC}"
echo -e "  1. Open ${BLUE}http://localhost:3000${NC} in your browser"
echo -e "  2. The login page should appear"
echo -e "  3. Create a test account or use existing credentials"
echo -e "  4. Test the following features:"
echo -e "     - Campaign creation"
echo -e "     - AI content generation"
echo -e "     - Analytics dashboard"
echo -e "     - Settings page"
echo ""
echo -e "${RED}To stop all services:${NC}"
echo -e "  Press ${YELLOW}Ctrl+C${NC} or run: ${YELLOW}kill $BACKEND_PID $FRONTEND_PID${NC}"
echo ""

# Create a stop script
echo "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" > stop-test.sh
chmod +x stop-test.sh

# Trap Ctrl+C to cleanup
trap "echo -e '\n${RED}Stopping services...${NC}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT

# Keep script running and monitor services
echo -e "${CYAN}Services are running. Press Ctrl+C to stop.${NC}"
echo ""

# Monitor loop
while true; do
    sleep 5

    # Check if processes are still running
    if ! ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "${RED}Backend stopped! Check backend.log for errors${NC}"
        kill $FRONTEND_PID 2>/dev/null
        exit 1
    fi

    if ! ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo -e "${RED}Frontend stopped! Check frontend.log for errors${NC}"
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
done

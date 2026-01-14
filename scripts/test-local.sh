#!/bin/bash

# ==============================================================
# Local Testing Script for Shopify Marketing AI (No Docker)
# ==============================================================
# This script helps you test the application locally without Docker
# ==============================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Header
echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   🧪 Local Testing Environment Setup                   ║${NC}"
echo -e "${CYAN}║      (No Docker Required)                             ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
is_port_in_use() {
    lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1
}

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -Pi :$port -sTCP:LISTEN -t 2>/dev/null)
    if [ ! -z "$pid" ]; then
        kill -9 $pid 2>/dev/null
        echo -e "${GREEN}✓${NC} Killed process on port $port"
    fi
}

# Check Node.js
echo -e "${YELLOW}📦 Checking Prerequisites${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if ! command_exists node; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    echo "Please install Node.js 18+ first"
    exit 1
else
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} Node.js installed: $NODE_VERSION"
fi

# Check for local PostgreSQL or use SQLite fallback
echo ""
echo -e "${YELLOW}🗄️ Database Setup${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

USE_SQLITE=false
if command_exists psql; then
    echo -e "${GREEN}✓${NC} PostgreSQL found locally"

    # Check if PostgreSQL is running
    if pg_isready >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} PostgreSQL is running"
    else
        echo -e "${YELLOW}⚠${NC} PostgreSQL is installed but not running"
        echo -e "${BLUE}Starting PostgreSQL...${NC}"

        # Try to start PostgreSQL based on OS
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            sudo service postgresql start 2>/dev/null || sudo systemctl start postgresql 2>/dev/null
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            brew services start postgresql 2>/dev/null || pg_ctl -D /usr/local/var/postgres start 2>/dev/null
        fi

        if ! pg_isready >/dev/null 2>&1; then
            echo -e "${YELLOW}⚠${NC} Could not start PostgreSQL. Will use SQLite instead."
            USE_SQLITE=true
        fi
    fi
else
    echo -e "${YELLOW}⚠${NC} PostgreSQL not found. Using SQLite for testing."
    USE_SQLITE=true
fi

# Configure database URL
if [ "$USE_SQLITE" = true ]; then
    # Update backend/.env to use SQLite
    echo -e "${BLUE}Configuring SQLite database...${NC}"

    # Backup original .env
    cp backend/.env backend/.env.backup.$(date +%s) 2>/dev/null

    # Update DATABASE_URL for SQLite
    if grep -q "^DATABASE_URL=" backend/.env; then
        sed -i.bak 's|^DATABASE_URL=.*|DATABASE_URL="file:./dev.db"|' backend/.env
    else
        echo 'DATABASE_URL="file:./dev.db"' >> backend/.env
    fi

    echo -e "${GREEN}✓${NC} SQLite configured for testing"
    echo -e "${YELLOW}  Note: SQLite is for testing only. Use PostgreSQL in production.${NC}"
fi

# Check for Redis or use memory fallback
echo ""
echo -e "${YELLOW}🔄 Cache/Queue Setup${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━"

USE_MEMORY_QUEUE=false
if command_exists redis-cli; then
    if redis-cli ping >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Redis is running"
    else
        echo -e "${YELLOW}⚠${NC} Redis is installed but not running"
        echo -e "${BLUE}Trying to start Redis...${NC}"

        # Try to start Redis
        redis-server --daemonize yes >/dev/null 2>&1

        if ! redis-cli ping >/dev/null 2>&1; then
            echo -e "${YELLOW}⚠${NC} Could not start Redis. Will use in-memory queue."
            USE_MEMORY_QUEUE=true
        else
            echo -e "${GREEN}✓${NC} Redis started successfully"
        fi
    fi
else
    echo -e "${YELLOW}⚠${NC} Redis not found. Using in-memory queue for testing."
    USE_MEMORY_QUEUE=true
fi

if [ "$USE_MEMORY_QUEUE" = true ]; then
    # Update REDIS_URL to use memory
    if grep -q "^REDIS_URL=" backend/.env; then
        sed -i.bak 's|^REDIS_URL=.*|REDIS_URL="memory://localhost"|' backend/.env
    fi
    echo -e "${YELLOW}  Note: In-memory queue is for testing only. Use Redis in production.${NC}"
fi

# Install dependencies if needed
echo ""
echo -e "${YELLOW}📚 Checking Dependencies${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}Installing root dependencies...${NC}"
    npm install --silent
fi

if [ ! -d "backend/node_modules" ]; then
    echo -e "${BLUE}Installing backend dependencies...${NC}"
    cd backend && npm install --silent && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo -e "${BLUE}Installing frontend dependencies...${NC}"
    cd frontend && npm install --silent && cd ..
fi

echo -e "${GREEN}✓${NC} All dependencies installed"

# Setup database
echo ""
echo -e "${YELLOW}🗄️ Setting up Database${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━"

cd backend

# Generate Prisma client
echo -e "${BLUE}Generating Prisma client...${NC}"
npx prisma generate --silent

# Run migrations
echo -e "${BLUE}Running database migrations...${NC}"
if [ "$USE_SQLITE" = true ]; then
    # For SQLite, we need to push the schema
    npx prisma db push --force-reset --silent
else
    # For PostgreSQL, run migrations
    npx prisma migrate deploy 2>/dev/null || npx prisma db push --silent
fi

echo -e "${GREEN}✓${NC} Database setup complete"
cd ..

# Check and free up ports
echo ""
echo -e "${YELLOW}🔌 Checking Ports${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━"

BACKEND_PORT=3001
FRONTEND_PORT=3000

if is_port_in_use $BACKEND_PORT; then
    echo -e "${YELLOW}⚠${NC} Port $BACKEND_PORT is in use"
    echo -n "Kill the process using it? (y/N): "
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        kill_port $BACKEND_PORT
    else
        echo -e "${RED}Cannot continue without port $BACKEND_PORT${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓${NC} Port $BACKEND_PORT is available"
fi

if is_port_in_use $FRONTEND_PORT; then
    echo -e "${YELLOW}⚠${NC} Port $FRONTEND_PORT is in use"
    echo -n "Kill the process using it? (y/N): "
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        kill_port $FRONTEND_PORT
    else
        echo -e "${RED}Cannot continue without port $FRONTEND_PORT${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓${NC} Port $FRONTEND_PORT is available"
fi

# Start services
echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║              🚀 Starting Services                     ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Create a temp file to track PIDs
PID_FILE="/tmp/shopify-ai-pids.txt"
rm -f $PID_FILE

# Start backend
echo -e "${BLUE}Starting Backend API...${NC}"
cd backend
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID >> $PID_FILE
cd ..

# Wait for backend to start
sleep 3

# Check if backend is running
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Backend started (PID: $BACKEND_PID)"
else
    echo -e "${RED}✗${NC} Backend failed to start. Check logs/backend.log"
    exit 1
fi

# Start frontend
echo -e "${BLUE}Starting Frontend...${NC}"
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID >> $PID_FILE
cd ..

# Wait for frontend to start
sleep 5

# Check if frontend is running
if kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Frontend started (PID: $FRONTEND_PID)"
else
    echo -e "${RED}✗${NC} Frontend failed to start. Check logs/frontend.log"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start worker (optional)
echo -e "${BLUE}Starting Worker (optional)...${NC}"
cd backend
npm run worker > ../logs/worker.log 2>&1 &
WORKER_PID=$!
echo $WORKER_PID >> $PID_FILE
cd ..

sleep 2

if kill -0 $WORKER_PID 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Worker started (PID: $WORKER_PID)"
else
    echo -e "${YELLOW}⚠${NC} Worker failed to start (not critical for testing)"
fi

# Health check
echo ""
echo -e "${YELLOW}🏥 Health Check${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━"

sleep 3

# Check backend health
if curl -f http://localhost:3001/health >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Backend API is healthy"
else
    echo -e "${RED}✗${NC} Backend API health check failed"
fi

# Check frontend
if curl -f http://localhost:3000 >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Frontend is accessible"
else
    echo -e "${YELLOW}⚠${NC} Frontend may still be building..."
fi

# Success message
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     ✅ Local Test Environment is Ready!               ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}📱 Access Points:${NC}"
echo -e "   Frontend:  ${BLUE}http://localhost:3000${NC}"
echo -e "   Backend:   ${BLUE}http://localhost:3001${NC}"
echo -e "   Health:    ${BLUE}http://localhost:3001/health${NC}"
echo ""
echo -e "${CYAN}🧪 Test Credentials:${NC}"
echo -e "   Use any email/password to create a test account"
echo -e "   API Key is already configured"
echo ""
echo -e "${CYAN}📋 Testing Checklist:${NC}"
echo -e "   1. Open ${BLUE}http://localhost:3000${NC}"
echo -e "   2. Create an account or login"
echo -e "   3. Create a test campaign"
echo -e "   4. Test AI content generation"
echo -e "   5. Check analytics dashboard"
echo -e "   6. Test approval workflow"
echo ""
echo -e "${YELLOW}📝 Logs:${NC}"
echo -e "   Backend:  tail -f logs/backend.log"
echo -e "   Frontend: tail -f logs/frontend.log"
echo -e "   Worker:   tail -f logs/worker.log"
echo ""
echo -e "${YELLOW}🛑 To Stop:${NC}"
echo -e "   Press Ctrl+C or run: bash scripts/stop-test.sh"
echo ""
echo -e "${MAGENTA}Happy Testing! 🚀${NC}"

# Create stop script
cat > scripts/stop-test.sh << 'EOF'
#!/bin/bash
echo "Stopping test environment..."
if [ -f /tmp/shopify-ai-pids.txt ]; then
    while read pid; do
        kill $pid 2>/dev/null && echo "Stopped process $pid"
    done < /tmp/shopify-ai-pids.txt
    rm /tmp/shopify-ai-pids.txt
fi
echo "Test environment stopped."
EOF
chmod +x scripts/stop-test.sh

# Trap to cleanup on exit
trap "bash scripts/stop-test.sh" EXIT

# Keep script running
echo ""
echo -e "${CYAN}Press Ctrl+C to stop all services${NC}"
echo ""

# Monitor services
while true; do
    sleep 5

    # Check if services are still running
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${RED}Backend stopped unexpectedly. Check logs/backend.log${NC}"
        break
    fi

    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${RED}Frontend stopped unexpectedly. Check logs/frontend.log${NC}"
        break
    fi
done

# Cleanup
bash scripts/stop-test.sh

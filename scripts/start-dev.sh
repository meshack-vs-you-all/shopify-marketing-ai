#!/bin/bash
# ==============================================================
# Safe Local Startup Script for Shopify Marketing AI
# ==============================================================
# This script helps developers start the local environment safely
# by detecting port conflicts and offering interactive resolution.
#
# Usage:
#   ./scripts/start-dev.sh          # Interactive mode
#   ./scripts/start-dev.sh --dry-run  # Show what would be done
# ==============================================================

set -e

DRY_RUN=false

# Parse arguments
for arg in "$@"; do
    case $arg in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
    esac
done

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Shopify Marketing AI - Local Startup${NC}"
echo "============================================"

# Ports to check
PORTS=(3000 5000 5432 5434 6379 6380)

echo -e "\n${YELLOW}📡 Checking for port conflicts...${NC}"

CONFLICTS=()

for port in "${PORTS[@]}"; do
    pid=$(lsof -ti :$port 2>/dev/null || true)
    if [ -n "$pid" ]; then
        process_name=$(ps -p $pid -o comm= 2>/dev/null || echo "unknown")
        echo -e "  ${RED}⚠️  Port $port is in use by PID $pid ($process_name)${NC}"
        CONFLICTS+=("$port:$pid")
    else
        echo -e "  ${GREEN}✓ Port $port is available${NC}"
    fi
done

if [ ${#CONFLICTS[@]} -gt 0 ]; then
    echo -e "\n${YELLOW}Found ${#CONFLICTS[@]} port conflict(s)${NC}"
    
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}[DRY-RUN] Would prompt to kill the following processes:${NC}"
        for conflict in "${CONFLICTS[@]}"; do
            port=$(echo $conflict | cut -d: -f1)
            pid=$(echo $conflict | cut -d: -f2)
            echo "  - PID $pid on port $port"
        done
    else
        echo -e "Would you like to kill these processes? (y/N): "
        read -r response
        
        if [[ "$response" =~ ^[Yy]$ ]]; then
            for conflict in "${CONFLICTS[@]}"; do
                pid=$(echo $conflict | cut -d: -f2)
                echo -e "  Killing PID $pid..."
                kill -9 $pid 2>/dev/null || true
            done
            echo -e "${GREEN}Done.${NC}"
        else
            echo -e "${YELLOW}Skipping. Services may fail to start.${NC}"
        fi
    fi
fi

echo -e "\n${YELLOW}🐳 Starting Docker services...${NC}"

if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}[DRY-RUN] Would run: docker-compose up -d${NC}"
else
    docker-compose up -d
fi

echo -e "\n${GREEN}✅ Startup complete!${NC}"
echo "============================================"
echo "Services:"
echo "  - Frontend:  http://localhost:3000"
echo "  - Backend:   http://localhost:5000"
echo "  - Postgres:  localhost:5434"
echo "  - Redis:     localhost:6379"
echo ""
echo "Useful commands:"
echo "  docker-compose logs -f backend   # Backend logs"
echo "  docker-compose logs -f worker    # Worker logs"
echo "  docker-compose down              # Stop all"

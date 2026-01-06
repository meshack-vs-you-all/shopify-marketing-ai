#!/bin/bash

# ==============================================================
# Environment Validation Script for Shopify Marketing AI
# ==============================================================
# Checks for existence of required .env files and variables.
# ==============================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🔍 Validating Environment Configuration...${NC}"
echo "============================================="

FAILED=0

# 1. Check for files
check_file() {
    if [ -f "$1" ]; then
        echo -e "  ${GREEN}✓ Found $1${NC}"
    else
        echo -e "  ${RED}✗ Missing $1${NC}"
        FAILED=1
    fi
}

check_file "backend/.env"
check_file "frontend/.env.local"

if [ $FAILED -eq 1 ]; then
    echo -e "\n${RED}Error: One or more configuration files are missing.${NC}"
    echo "Please copy the example files and fill in your values:"
    echo "  cp backend/.env.example backend/.env"
    echo "  cp frontend/.env.local.example frontend/.env.local"
    exit 1
fi

# 2. Check for critical backend variables
echo -e "\n${YELLOW}📡 Checking Backend variables...${NC}"

check_var() {
    if grep -q "^$1=" backend/.env; then
        VAL=$(grep "^$1=" backend/.env | cut -d'=' -f2-)
        if [ -z "$VAL" ] || [ "$VAL" == "your-$1" ] || [[ "$VAL" == *"your-"* ]]; then
            echo -e "  ${RED}✗ $1 is not set or still has placeholder value${NC}"
            FAILED=1
        else
            echo -e "  ${GREEN}✓ $1 is configured${NC}"
        fi
    else
        echo -e "  ${RED}✗ $1 is missing from backend/.env${NC}"
        FAILED=1
    fi
}

check_var "DATABASE_URL"
check_var "GEMINI_API_KEY"
check_var "SHOPIFY_STORE_URL"
check_var "SHOPIFY_ACCESS_TOKEN"
check_var "API_KEY"

# 3. Summary
echo -e "\n============================================="
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ Environment validation passed! You are ready to go.${NC}"
    exit 0
else
    echo -e "${RED}❌ Environment validation failed.${NC}"
    echo "Please update your backend/.env with actual credentials."
    exit 1
fi

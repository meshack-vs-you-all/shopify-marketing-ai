#!/bin/bash

# ==============================================================
# Environment Validation Script for Shopify Marketing AI
# ==============================================================
# Comprehensive validation for deployment readiness
# ==============================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🚀 Shopify Marketing AI - Environment Validator     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

ERRORS=0
WARNINGS=0

# Helper functions
check_file() {
    if [ -f "$1" ]; then
        echo -e "  ${GREEN}✓${NC} Found: $1"
        return 0
    else
        echo -e "  ${RED}✗${NC} Missing: $1"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

check_required_var() {
    local file=$1
    local var=$2
    local desc=$3

    if [ ! -f "$file" ]; then
        return 1
    fi

    if grep -q "^$var=" "$file" 2>/dev/null; then
        VAL=$(grep "^$var=" "$file" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
        if [ -z "$VAL" ] || [[ "$VAL" == *"your-"* ]] || [[ "$VAL" == "changeme"* ]] || [[ "$VAL" == "xxx"* ]]; then
            echo -e "  ${RED}✗${NC} $var - $desc (placeholder value detected)"
            ERRORS=$((ERRORS + 1))
        else
            echo -e "  ${GREEN}✓${NC} $var - $desc"
        fi
    else
        echo -e "  ${RED}✗${NC} $var - $desc (not found)"
        ERRORS=$((ERRORS + 1))
    fi
}

check_optional_var() {
    local file=$1
    local var=$2
    local desc=$3

    if [ ! -f "$file" ]; then
        return 1
    fi

    if grep -q "^$var=" "$file" 2>/dev/null; then
        VAL=$(grep "^$var=" "$file" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
        if [ -z "$VAL" ]; then
            echo -e "  ${YELLOW}⚠${NC} $var - $desc (empty, optional)"
            WARNINGS=$((WARNINGS + 1))
        else
            echo -e "  ${GREEN}✓${NC} $var - $desc"
        fi
    else
        echo -e "  ${YELLOW}⚠${NC} $var - $desc (not set, optional)"
        WARNINGS=$((WARNINGS + 1))
    fi
}

# 1. Check for configuration files
echo -e "${YELLOW}📁 Checking Configuration Files${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_file "backend/.env"
check_file "frontend/.env.local"
check_file "docker-compose.yml"
check_file "package.json"

echo ""

# 2. Backend Environment Variables
echo -e "${YELLOW}🔧 Backend Environment Variables${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Core Database
check_required_var "backend/.env" "DATABASE_URL" "PostgreSQL connection string"
check_required_var "backend/.env" "REDIS_URL" "Redis connection string"

# Authentication & Security
check_required_var "backend/.env" "API_KEY" "Backend API authentication key"
check_required_var "backend/.env" "JWT_SECRET" "JWT token signing secret"

# AI Services
check_required_var "backend/.env" "GEMINI_API_KEY" "Google Gemini API key"
check_optional_var "backend/.env" "OPENAI_API_KEY" "OpenAI API key (backup)"

# Shopify Integration
check_required_var "backend/.env" "SHOPIFY_STORE_URL" "Shopify store URL"
check_required_var "backend/.env" "SHOPIFY_ACCESS_TOKEN" "Shopify Admin API token"
check_required_var "backend/.env" "SHOPIFY_API_KEY" "Shopify app API key"
check_required_var "backend/.env" "SHOPIFY_API_SECRET" "Shopify app secret"

# Email Service
check_optional_var "backend/.env" "AWS_ACCESS_KEY_ID" "AWS access key for SES"
check_optional_var "backend/.env" "AWS_SECRET_ACCESS_KEY" "AWS secret for SES"
check_optional_var "backend/.env" "AWS_REGION" "AWS region for SES"
check_optional_var "backend/.env" "SES_FROM_EMAIL" "Sender email address"

# Meta Ads (Optional but recommended)
check_optional_var "backend/.env" "META_APP_ID" "Meta app ID"
check_optional_var "backend/.env" "META_APP_SECRET" "Meta app secret"
check_optional_var "backend/.env" "META_ACCESS_TOKEN" "Meta access token"

# Google Ads (Optional)
check_optional_var "backend/.env" "GOOGLE_ADS_DEVELOPER_TOKEN" "Google Ads developer token"
check_optional_var "backend/.env" "GOOGLE_ADS_CLIENT_ID" "Google Ads OAuth client ID"
check_optional_var "backend/.env" "GOOGLE_ADS_CLIENT_SECRET" "Google Ads OAuth secret"

# Application Config
check_optional_var "backend/.env" "PORT" "Backend port (default: 3001)"
check_optional_var "backend/.env" "NODE_ENV" "Environment (development/production)"

echo ""

# 3. Frontend Environment Variables
echo -e "${YELLOW}🎨 Frontend Environment Variables${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_required_var "frontend/.env.local" "NEXT_PUBLIC_API_URL" "Backend API URL"
check_required_var "frontend/.env.local" "NEXT_PUBLIC_API_KEY" "API authentication key"
check_optional_var "frontend/.env.local" "NEXT_PUBLIC_APP_NAME" "Application name"
check_optional_var "frontend/.env.local" "NEXT_PUBLIC_APP_URL" "Frontend URL"

echo ""

# 4. Check Docker services
echo -e "${YELLOW}🐳 Docker Services Check${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v docker &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} Docker is installed"

    # Check if docker-compose exists
    if command -v docker-compose &> /dev/null || docker compose version &> /dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} Docker Compose is available"

        # Check if containers are running
        if docker ps --format "table {{.Names}}" | grep -q "shopify-marketing-ai"; then
            echo -e "  ${GREEN}✓${NC} Docker containers are running"
        else
            echo -e "  ${YELLOW}⚠${NC} Docker containers are not running (run: docker-compose up -d)"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        echo -e "  ${RED}✗${NC} Docker Compose is not installed"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "  ${RED}✗${NC} Docker is not installed"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# 5. Check Node.js and npm
echo -e "${YELLOW}📦 Node.js Environment${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "  ${GREEN}✓${NC} Node.js installed: $NODE_VERSION"

    # Check if version is 18 or higher
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -ge 18 ]; then
        echo -e "  ${GREEN}✓${NC} Node.js version meets requirements (≥18)"
    else
        echo -e "  ${YELLOW}⚠${NC} Node.js version should be 18 or higher"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "  ${RED}✗${NC} Node.js is not installed"
    ERRORS=$((ERRORS + 1))
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "  ${GREEN}✓${NC} npm installed: v$NPM_VERSION"
else
    echo -e "  ${RED}✗${NC} npm is not installed"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# 6. Check dependencies installation
echo -e "${YELLOW}📚 Dependencies Check${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "node_modules" ]; then
    echo -e "  ${GREEN}✓${NC} Root dependencies installed"
else
    echo -e "  ${YELLOW}⚠${NC} Root dependencies not installed (run: npm install)"
    WARNINGS=$((WARNINGS + 1))
fi

if [ -d "backend/node_modules" ]; then
    echo -e "  ${GREEN}✓${NC} Backend dependencies installed"
else
    echo -e "  ${YELLOW}⚠${NC} Backend dependencies not installed (run: cd backend && npm install)"
    WARNINGS=$((WARNINGS + 1))
fi

if [ -d "frontend/node_modules" ]; then
    echo -e "  ${GREEN}✓${NC} Frontend dependencies installed"
else
    echo -e "  ${YELLOW}⚠${NC} Frontend dependencies not installed (run: cd frontend && npm install)"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# 7. Check database migrations
echo -e "${YELLOW}🗄️ Database Status${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "backend/prisma/migrations" ]; then
    echo -e "  ${GREEN}✓${NC} Migrations folder exists"

    # Check if DATABASE_URL is set to run migration check
    if grep -q "^DATABASE_URL=" "backend/.env" 2>/dev/null; then
        DB_URL=$(grep "^DATABASE_URL=" "backend/.env" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
        if [[ "$DB_URL" != *"your-"* ]] && [[ -n "$DB_URL" ]]; then
            echo -e "  ${BLUE}ℹ${NC} Run 'cd backend && npx prisma migrate deploy' to apply migrations"
        fi
    fi
else
    echo -e "  ${YELLOW}⚠${NC} No migrations found (run: cd backend && npx prisma migrate dev)"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# 8. Production Build Check
echo -e "${YELLOW}🏗️ Production Build Status${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "backend/dist" ]; then
    echo -e "  ${GREEN}✓${NC} Backend build exists"
else
    echo -e "  ${YELLOW}⚠${NC} Backend not built (run: cd backend && npm run build)"
    WARNINGS=$((WARNINGS + 1))
fi

if [ -d "frontend/.next" ]; then
    echo -e "  ${GREEN}✓${NC} Frontend build exists"
else
    echo -e "  ${YELLOW}⚠${NC} Frontend not built (run: cd frontend && npm run build)"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# 9. Summary and Recommendations
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    📊 SUMMARY                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ Perfect! Your environment is fully configured for deployment.${NC}"
    echo ""
    echo -e "${GREEN}Next steps:${NC}"
    echo "1. Start development: npm run dev"
    echo "2. Build for production: npm run build"
    echo "3. Deploy to your platform of choice"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ No critical errors found${NC}"
    echo -e "${YELLOW}⚠ $WARNINGS warning(s) detected${NC}"
    echo ""
    echo -e "${YELLOW}Your system can run but consider addressing the warnings above.${NC}"
    echo ""
    echo -e "${BLUE}Quick fixes:${NC}"
    echo "• Install dependencies: npm run install:all"
    echo "• Start Docker services: docker-compose up -d"
    echo "• Build for production: npm run build"
    exit 0
else
    echo -e "${RED}✗ $ERRORS critical error(s) found${NC}"
    echo -e "${YELLOW}⚠ $WARNINGS warning(s) detected${NC}"
    echo ""
    echo -e "${RED}Please fix the critical errors before proceeding:${NC}"
    echo ""
    echo "1. Copy example files:"
    echo "   • cp backend/.env.example backend/.env"
    echo "   • cp frontend/.env.local.example frontend/.env.local"
    echo ""
    echo "2. Fill in required credentials in .env files"
    echo ""
    echo "3. Install dependencies:"
    echo "   • npm run install:all"
    echo ""
    echo "4. Start Docker services:"
    echo "   • docker-compose up -d"
    echo ""
    echo "5. Run this script again to verify"
    exit 1
fi

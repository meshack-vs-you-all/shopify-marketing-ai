#!/bin/bash

# ==============================================================
# Environment Fix Script for Shopify Marketing AI
# ==============================================================
# Adds missing required environment variables
# ==============================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🔧 Fixing Missing Environment Variables             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to generate a secure random string
generate_secret() {
    openssl rand -base64 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1
}

# Function to add variable if missing
add_if_missing() {
    local file=$1
    local var=$2
    local value=$3
    local description=$4

    if [ ! -f "$file" ]; then
        echo -e "${RED}✗ File $file does not exist${NC}"
        return 1
    fi

    if ! grep -q "^$var=" "$file" 2>/dev/null; then
        echo -e "${YELLOW}Adding $var to $file${NC}"
        echo "" >> "$file"
        echo "# $description" >> "$file"
        echo "$var=$value" >> "$file"
        echo -e "${GREEN}✓ Added $var${NC}"
    else
        echo -e "${GREEN}✓ $var already exists in $file${NC}"
    fi
}

# 1. Fix Backend Environment Variables
echo -e "${YELLOW}Checking backend/.env...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -f "backend/.env" ]; then
    echo -e "${RED}Error: backend/.env not found${NC}"
    echo "Please create it first: cp backend/.env.example backend/.env"
    exit 1
fi

# Add JWT_SECRET if missing
JWT_SECRET_VALUE=$(generate_secret)
add_if_missing "backend/.env" "JWT_SECRET" "$JWT_SECRET_VALUE" "JWT token signing secret (auto-generated)"

# Add other commonly missing variables with defaults
add_if_missing "backend/.env" "CORS_ORIGIN" "http://localhost:3000" "CORS allowed origin"
add_if_missing "backend/.env" "RATE_LIMIT_MAX" "100" "Max requests per minute"
add_if_missing "backend/.env" "LOG_LEVEL" "info" "Logging level (debug, info, warn, error)"
add_if_missing "backend/.env" "SESSION_SECRET" "$(generate_secret)" "Session secret (auto-generated)"

echo ""

# 2. Fix Frontend Environment Variables
echo -e "${YELLOW}Checking frontend/.env.local...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -f "frontend/.env.local" ]; then
    echo -e "${RED}Error: frontend/.env.local not found${NC}"
    echo "Please create it first: cp frontend/.env.local.example frontend/.env.local"
    exit 1
fi

# Get API_KEY from backend/.env to use in frontend
if grep -q "^API_KEY=" "backend/.env" 2>/dev/null; then
    API_KEY_VALUE=$(grep "^API_KEY=" "backend/.env" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    if [ -n "$API_KEY_VALUE" ] && [[ "$API_KEY_VALUE" != *"your-"* ]]; then
        add_if_missing "frontend/.env.local" "NEXT_PUBLIC_API_KEY" "$API_KEY_VALUE" "API authentication key (synced from backend)"
    else
        # Generate new API key if backend has placeholder
        NEW_API_KEY=$(generate_secret)
        echo -e "${YELLOW}Generating new API key for both backend and frontend...${NC}"

        # Update backend API_KEY
        sed -i.bak "s/^API_KEY=.*/API_KEY=$NEW_API_KEY/" "backend/.env"
        rm -f "backend/.env.bak"

        # Add to frontend
        add_if_missing "frontend/.env.local" "NEXT_PUBLIC_API_KEY" "$NEW_API_KEY" "API authentication key (auto-generated)"
    fi
else
    # API_KEY doesn't exist in backend, create for both
    NEW_API_KEY=$(generate_secret)
    add_if_missing "backend/.env" "API_KEY" "$NEW_API_KEY" "API authentication key (auto-generated)"
    add_if_missing "frontend/.env.local" "NEXT_PUBLIC_API_KEY" "$NEW_API_KEY" "API authentication key (auto-generated)"
fi

# Add optional frontend variables with good defaults
add_if_missing "frontend/.env.local" "NEXT_PUBLIC_APP_NAME" "Shopify Marketing AI" "Application name"
add_if_missing "frontend/.env.local" "NEXT_PUBLIC_APP_URL" "http://localhost:3000" "Frontend URL"
add_if_missing "frontend/.env.local" "NEXT_PUBLIC_GA_ID" "" "Google Analytics ID (optional)"

echo ""

# 3. Create .env.production files for deployment
echo -e "${YELLOW}Creating production environment templates...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Backend production template
if [ ! -f "backend/.env.production.example" ]; then
    cat > backend/.env.production.example << EOF
# Production Environment Variables
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname
REDIS_URL=redis://host:6379

# Security
API_KEY=$(generate_secret)
JWT_SECRET=$(generate_secret)
SESSION_SECRET=$(generate_secret)

# CORS
CORS_ORIGIN=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info

# AI Services
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key-optional

# Shopify
SHOPIFY_STORE_URL=https://your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=your-access-token
SHOPIFY_API_KEY=your-api-key
SHOPIFY_API_SECRET=your-api-secret

# AWS SES (Email)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
SES_FROM_EMAIL=noreply@yourdomain.com

# Meta Ads
META_APP_ID=your-meta-app-id
META_APP_SECRET=your-meta-app-secret
META_ACCESS_TOKEN=your-meta-access-token

# Google Ads (Optional)
GOOGLE_ADS_DEVELOPER_TOKEN=
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_CLIENT_SECRET=
EOF
    echo -e "${GREEN}✓ Created backend/.env.production.example${NC}"
fi

# Frontend production template
if [ ! -f "frontend/.env.production.example" ]; then
    cat > frontend/.env.production.example << EOF
# Production Environment Variables
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_API_KEY=$(grep "^API_KEY=" "backend/.env" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
NEXT_PUBLIC_APP_NAME=Shopify Marketing AI
NEXT_PUBLIC_APP_URL=https://app.yourdomain.com
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
EOF
    echo -e "${GREEN}✓ Created frontend/.env.production.example${NC}"
fi

echo ""

# 4. Validate the fixes
echo -e "${YELLOW}Validating environment...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ERRORS=0

# Check backend critical vars
for var in "DATABASE_URL" "REDIS_URL" "API_KEY" "JWT_SECRET" "GEMINI_API_KEY" "SHOPIFY_STORE_URL" "SHOPIFY_ACCESS_TOKEN"; do
    if grep -q "^$var=" "backend/.env" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Backend: $var is set"
    else
        echo -e "${RED}✗${NC} Backend: $var is missing"
        ERRORS=$((ERRORS + 1))
    fi
done

# Check frontend critical vars
for var in "NEXT_PUBLIC_API_URL" "NEXT_PUBLIC_API_KEY"; do
    if grep -q "^$var=" "frontend/.env.local" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Frontend: $var is set"
    else
        echo -e "${RED}✗${NC} Frontend: $var is missing"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""

# 5. Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    📊 SUMMARY                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All critical environment variables are now configured!${NC}"
    echo ""
    echo -e "${GREEN}Next steps:${NC}"
    echo "1. Review and update any placeholder values in backend/.env"
    echo "2. Run: bash scripts/check-env.sh"
    echo "3. Build for production: bash scripts/build-production.sh"
    echo "4. Deploy to your platform"
    exit 0
else
    echo -e "${RED}❌ Some environment variables are still missing.${NC}"
    echo "Please check the files manually and add the missing variables."
    exit 1
fi

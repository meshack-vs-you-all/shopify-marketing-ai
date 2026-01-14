#!/bin/bash

# ==============================================================
# Production Build Script for Shopify Marketing AI
# ==============================================================
# Builds the entire application for production deployment
# ==============================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Error handling
set -e
trap 'echo -e "${RED}❌ Build failed at line $LINENO${NC}"' ERR

# Track timing
START_TIME=$(date +%s)

# Header
echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   🚀 Shopify Marketing AI - Production Build          ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to print step headers
print_step() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Function to check command success
check_success() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
        exit 1
    fi
}

# 1. Environment Check
print_step "Step 1/8: Environment Validation"
echo "Checking environment configuration..."

# Check if environment files exist
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}❌ backend/.env not found${NC}"
    echo "Please create backend/.env from backend/.env.example"
    exit 1
fi

if [ ! -f "frontend/.env.local" ]; then
    echo -e "${RED}❌ frontend/.env.local not found${NC}"
    echo "Please create frontend/.env.local from frontend/.env.local.example"
    exit 1
fi

# Run environment validation
if [ -f "scripts/check-env.sh" ]; then
    echo "Running environment validation..."
    bash scripts/check-env.sh > /dev/null 2>&1 || {
        echo -e "${YELLOW}⚠️  Environment validation had warnings, continuing...${NC}"
    }
fi

check_success "Environment validation completed"

# 2. Clean Previous Builds
print_step "Step 2/8: Cleaning Previous Builds"

echo "Removing old build artifacts..."
rm -rf backend/dist 2>/dev/null || true
rm -rf frontend/.next 2>/dev/null || true
rm -rf frontend/out 2>/dev/null || true

check_success "Previous builds cleaned"

# 3. Install Dependencies
print_step "Step 3/8: Installing Dependencies"

# Check if we should skip install (useful in CI/CD)
if [ "$SKIP_INSTALL" != "true" ]; then
    echo "Installing root dependencies..."
    npm install --silent
    check_success "Root dependencies installed"

    echo "Installing backend dependencies..."
    cd backend
    npm install --silent
    check_success "Backend dependencies installed"
    cd ..

    echo "Installing frontend dependencies..."
    cd frontend
    npm install --silent
    check_success "Frontend dependencies installed"
    cd ..
else
    echo -e "${YELLOW}Skipping dependency installation (SKIP_INSTALL=true)${NC}"
fi

# 4. Database Preparation
print_step "Step 4/8: Database Preparation"

cd backend

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate --silent
check_success "Prisma client generated"

# Check if we should run migrations (not in CI/CD typically)
if [ "$SKIP_MIGRATIONS" != "true" ]; then
    echo "Checking database migrations..."

    # Try to run migrations (will fail if DB not accessible, which is OK for build)
    npx prisma migrate deploy 2>/dev/null || {
        echo -e "${YELLOW}⚠️  Could not apply migrations (database may not be accessible)${NC}"
        echo -e "${YELLOW}   Run 'npx prisma migrate deploy' on your production server${NC}"
    }
else
    echo -e "${YELLOW}Skipping migrations (SKIP_MIGRATIONS=true)${NC}"
fi

cd ..

# 5. Backend Build
print_step "Step 5/8: Building Backend"

cd backend

echo "Compiling TypeScript..."
npm run build

# Check if build output exists
if [ -d "dist" ]; then
    FILE_COUNT=$(find dist -type f -name "*.js" | wc -l)
    echo -e "${GREEN}✅ Backend built successfully (${FILE_COUNT} files)${NC}"
else
    echo -e "${RED}❌ Backend build failed - dist folder not created${NC}"
    exit 1
fi

cd ..

# 6. Frontend Build
print_step "Step 6/8: Building Frontend"

cd frontend

echo "Building Next.js application..."
echo "This may take a few minutes..."

# Set production environment
export NODE_ENV=production

# Build the frontend
npm run build

# Check if build output exists
if [ -d ".next" ]; then
    # Get build size
    BUILD_SIZE=$(du -sh .next | cut -f1)
    echo -e "${GREEN}✅ Frontend built successfully (Size: ${BUILD_SIZE})${NC}"
else
    echo -e "${RED}❌ Frontend build failed - .next folder not created${NC}"
    exit 1
fi

cd ..

# 7. Build Verification
print_step "Step 7/8: Build Verification"

echo "Verifying build output..."

# Check backend build
if [ -f "backend/dist/index.js" ]; then
    echo -e "${GREEN}✅ Backend entry point found${NC}"
else
    echo -e "${RED}❌ Backend entry point missing${NC}"
    exit 1
fi

# Check frontend build
if [ -d "frontend/.next/static" ]; then
    echo -e "${GREEN}✅ Frontend static assets generated${NC}"
else
    echo -e "${RED}❌ Frontend static assets missing${NC}"
    exit 1
fi

# Check if package.json scripts exist for production
if grep -q '"start"' backend/package.json; then
    echo -e "${GREEN}✅ Backend start script available${NC}"
else
    echo -e "${YELLOW}⚠️  Backend start script not found${NC}"
fi

if grep -q '"start"' frontend/package.json; then
    echo -e "${GREEN}✅ Frontend start script available${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend start script not found${NC}"
fi

# 8. Create Production Bundle (Optional)
print_step "Step 8/8: Production Bundle"

if [ "$CREATE_BUNDLE" == "true" ]; then
    echo "Creating production bundle..."

    # Create dist directory
    mkdir -p dist

    # Copy necessary files
    echo "Copying production files..."

    # Backend files
    cp -r backend/dist dist/backend
    cp backend/package.json dist/backend/
    cp backend/package-lock.json dist/backend/ 2>/dev/null || true
    cp -r backend/prisma dist/backend/

    # Frontend files
    cp -r frontend/.next dist/frontend/
    cp -r frontend/public dist/frontend/ 2>/dev/null || true
    cp frontend/package.json dist/frontend/
    cp frontend/package-lock.json dist/frontend/ 2>/dev/null || true

    # Root files
    cp package.json dist/
    cp package-lock.json dist/ 2>/dev/null || true

    # Create production docker-compose
    cat > dist/docker-compose.prod.yml << EOF
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: shopify_marketing
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: unless-stopped

  backend:
    build: ./backend
    environment:
      NODE_ENV: production
      DATABASE_URL: \${DATABASE_URL}
      REDIS_URL: \${REDIS_URL}
    depends_on:
      - postgres
      - redis
    ports:
      - "3001:3001"
    restart: unless-stopped

  frontend:
    build: ./frontend
    environment:
      NODE_ENV: production
    ports:
      - "3000:3000"
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
EOF

    # Create deployment instructions
    cat > dist/DEPLOY.md << EOF
# Deployment Instructions

## Quick Start

1. Set environment variables in .env files
2. Run database migrations: \`cd backend && npx prisma migrate deploy\`
3. Start services: \`docker-compose -f docker-compose.prod.yml up -d\`

## Manual Deployment

### Backend
\`\`\`bash
cd backend
npm install --production
npx prisma migrate deploy
npm start
\`\`\`

### Frontend
\`\`\`bash
cd frontend
npm install --production
npm start
\`\`\`

## Environment Variables

Ensure all required environment variables are set in production.
See backend/.env.example and frontend/.env.local.example for reference.
EOF

    echo -e "${GREEN}✅ Production bundle created in ./dist${NC}"

    # Calculate bundle size
    BUNDLE_SIZE=$(du -sh dist | cut -f1)
    echo -e "${CYAN}Bundle size: ${BUNDLE_SIZE}${NC}"
else
    echo -e "${YELLOW}Skipping bundle creation (set CREATE_BUNDLE=true to enable)${NC}"
fi

# Calculate build time
END_TIME=$(date +%s)
BUILD_TIME=$((END_TIME - START_TIME))
BUILD_MINUTES=$((BUILD_TIME / 60))
BUILD_SECONDS=$((BUILD_TIME % 60))

# Final Summary
echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║               🎉 BUILD SUCCESSFUL                     ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Production build completed successfully!${NC}"
echo -e "${CYAN}Build time: ${BUILD_MINUTES}m ${BUILD_SECONDS}s${NC}"
echo ""
echo -e "${MAGENTA}📋 Next Steps:${NC}"
echo "1. Deploy backend from: ${CYAN}backend/dist${NC}"
echo "2. Deploy frontend from: ${CYAN}frontend/.next${NC}"
echo "3. Run migrations on production: ${CYAN}npx prisma migrate deploy${NC}"
echo "4. Set NODE_ENV=production on your servers"
echo "5. Start services with: ${CYAN}npm start${NC}"
echo ""
echo -e "${YELLOW}📦 Deployment Commands:${NC}"
echo "   Backend:  ${CYAN}cd backend && npm start${NC}"
echo "   Frontend: ${CYAN}cd frontend && npm start${NC}"
echo "   Worker:   ${CYAN}cd backend && npm run worker${NC}"
echo ""
echo -e "${GREEN}Good luck with your deployment! 🚀${NC}"

exit 0

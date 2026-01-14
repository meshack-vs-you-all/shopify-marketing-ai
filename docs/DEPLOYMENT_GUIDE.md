# Deployment Guide - Shopify Marketing AI Platform

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Preparation](#environment-preparation)
- [Railway Deployment](#railway-deployment)
- [Alternative Deployment Options](#alternative-deployment-options)
- [Post-Deployment](#post-deployment)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

### Required Accounts & Credentials
- [ ] **Database**: PostgreSQL connection string
- [ ] **Redis**: Redis server access
- [ ] **Shopify**: Store URL, Access Token, API Key & Secret
- [ ] **Google Gemini**: API key for AI content generation
- [ ] **AWS SES**: Access keys for email delivery (optional)
- [ ] **Meta Ads**: App ID, Secret & Access Token (optional)

### Local Environment
- [ ] Node.js 18+ installed
- [ ] Docker & Docker Compose installed
- [ ] Git repository access
- [ ] All environment variables configured

### Verification Steps
```bash
# 1. Validate environment
bash scripts/check-env.sh

# 2. Run production build
bash scripts/build-production.sh

# 3. Test locally
docker-compose up -d
npm run dev
```

---

## Environment Preparation

### 1. Configure Environment Variables

#### Backend (.env)
```env
# Core Configuration
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://user:password@host:5432/shopify_marketing
REDIS_URL=redis://host:6379

# Security
API_KEY=your-secure-api-key-32-chars
JWT_SECRET=your-jwt-secret-32-chars
SESSION_SECRET=your-session-secret-32-chars

# AI Services
GEMINI_API_KEY=your-gemini-api-key

# Shopify Integration
SHOPIFY_STORE_URL=https://your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxx
SHOPIFY_API_KEY=your-shopify-api-key
SHOPIFY_API_SECRET=your-shopify-api-secret

# Email (AWS SES)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=xxxxx
AWS_REGION=us-east-1
SES_FROM_EMAIL=noreply@yourdomain.com

# Meta Ads
META_APP_ID=xxxxx
META_APP_SECRET=xxxxx
META_ACCESS_TOKEN=xxxxx

# CORS & Security
CORS_ORIGIN=https://app.yourdomain.com
RATE_LIMIT_MAX=100
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_API_KEY=your-secure-api-key-32-chars
NEXT_PUBLIC_APP_NAME=Shopify Marketing AI
NEXT_PUBLIC_APP_URL=https://app.yourdomain.com
```

### 2. Generate Secure Keys

```bash
# Generate secure random keys
openssl rand -base64 32  # For API_KEY
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For SESSION_SECRET
```

### 3. Build for Production

```bash
# Run the production build script
bash scripts/build-production.sh

# Or manually:
cd backend && npm run build && cd ..
cd frontend && npm run build && cd ..
```

---

## Railway Deployment

### Quick Deploy with Railway Button

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/yourusername/shopify-marketing-ai)

### Manual Railway Deployment

#### 1. Install Railway CLI
```bash
# macOS/Linux
curl -fsSL https://railway.app/install.sh | sh

# Windows
npm install -g @railway/cli
```

#### 2. Initialize Railway Project
```bash
# Login to Railway
railway login

# Initialize new project
railway init

# Link to existing project (if applicable)
railway link
```

#### 3. Configure Services

Create services in Railway dashboard:
1. **PostgreSQL Database**
2. **Redis Instance**
3. **Backend Service**
4. **Frontend Service**
5. **Worker Service**

#### 4. Set Environment Variables

```bash
# Set backend variables
railway variables set NODE_ENV=production
railway variables set DATABASE_URL=${{POSTGRES_URL}}
railway variables set REDIS_URL=${{REDIS_URL}}
railway variables set API_KEY=your-secure-key
railway variables set JWT_SECRET=your-jwt-secret
railway variables set GEMINI_API_KEY=your-gemini-key
# ... add all other required variables

# Set frontend variables
railway variables set NEXT_PUBLIC_API_URL=https://backend.railway.app
railway variables set NEXT_PUBLIC_API_KEY=your-secure-key
```

#### 5. Deploy

```bash
# Deploy all services
railway up

# Or deploy specific service
railway up --service backend
railway up --service frontend
railway up --service worker
```

#### 6. Run Migrations

```bash
# Connect to Railway shell
railway run --service backend bash

# Run migrations
npx prisma migrate deploy

# Seed database (optional)
npm run seed
```

### Railway Configuration File

The project includes `railway.toml` for automated configuration:
- Auto-builds on push
- Health checks configured
- Resource limits set
- Scaling rules defined

---

## Alternative Deployment Options

### Option 1: Heroku

#### Setup
```bash
# Create Heroku apps
heroku create your-app-backend
heroku create your-app-frontend

# Add buildpacks
heroku buildpacks:add heroku/nodejs -a your-app-backend
heroku buildpacks:add heroku/nodejs -a your-app-frontend

# Add Postgres addon
heroku addons:create heroku-postgresql:hobby-dev -a your-app-backend

# Add Redis addon
heroku addons:create heroku-redis:hobby-dev -a your-app-backend
```

#### Deploy
```bash
# Deploy backend
git subtree push --prefix backend heroku-backend main

# Deploy frontend
git subtree push --prefix frontend heroku-frontend main
```

### Option 2: DigitalOcean App Platform

#### app.yaml
```yaml
name: shopify-marketing-ai
region: nyc
services:
  - name: backend
    environment_slug: node-js
    build_command: cd backend && npm install && npm run build
    run_command: cd backend && npm start
    source_dir: /
    envs:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        value: ${db.DATABASE_URL}
      - key: REDIS_URL
        value: ${redis.REDIS_URL}
    
  - name: frontend
    environment_slug: node-js
    build_command: cd frontend && npm install && npm run build
    run_command: cd frontend && npm start
    source_dir: /
    envs:
      - key: NEXT_PUBLIC_API_URL
        value: ${backend.PUBLIC_URL}

databases:
  - name: db
    engine: PG
    version: "14"
  
  - name: redis
    engine: REDIS
    version: "7"
```

### Option 3: AWS EC2 with Docker

#### 1. Launch EC2 Instance
```bash
# Minimum: t3.medium with 20GB storage
# OS: Ubuntu 22.04 LTS
```

#### 2. Install Docker
```bash
# SSH into instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 3. Deploy Application
```bash
# Clone repository
git clone https://github.com/yourusername/shopify-marketing-ai.git
cd shopify-marketing-ai

# Create environment files
cp backend/.env.production.example backend/.env
cp frontend/.env.production.example frontend/.env.local
# Edit files with production values

# Build and run
docker-compose -f docker-compose.prod.yml up -d
```

### Option 4: Vercel (Frontend) + Railway (Backend)

#### Deploy Frontend to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd frontend
vercel --prod
```

#### Configure Vercel Environment
1. Go to Vercel Dashboard
2. Settings → Environment Variables
3. Add all `NEXT_PUBLIC_*` variables

---

## Post-Deployment

### 1. Domain Configuration

#### Add Custom Domain
```bash
# Railway
railway domain add api.yourdomain.com --service backend
railway domain add app.yourdomain.com --service frontend

# Update DNS records
# A Record: @ → Railway IP
# CNAME: api → backend.railway.app
# CNAME: app → frontend.railway.app
```

### 2. SSL Configuration
- Railway: Automatic with Let's Encrypt
- Heroku: Automatic with ACM
- EC2: Use Certbot for Let's Encrypt

### 3. Database Migrations
```bash
# Production migrations
NODE_ENV=production npx prisma migrate deploy

# Verify migration status
npx prisma migrate status
```

### 4. Health Checks
```bash
# Backend health
curl https://api.yourdomain.com/health

# Frontend health
curl https://app.yourdomain.com

# Expected response
{"status":"ok","timestamp":"2024-..."}
```

### 5. Initial Data Setup
```bash
# Create admin user
npm run create:admin -- --email admin@yourdomain.com

# Import Shopify products
npm run sync:shopify

# Test email delivery
npm run test:email -- --to test@example.com
```

---

## Monitoring & Maintenance

### Application Monitoring

#### 1. Setup Logging
```javascript
// Already configured with Winston
// Logs available in Railway dashboard
```

#### 2. Error Tracking (Sentry)
```bash
# Install Sentry
npm install @sentry/node @sentry/nextjs

# Configure in environment
SENTRY_DSN=your-sentry-dsn
```

#### 3. Performance Monitoring
- Railway: Built-in metrics dashboard
- Custom: New Relic or DataDog integration

### Database Maintenance

#### Backups
```bash
# Manual backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20240101.sql

# Railway automatic backups
# Enable in dashboard → Database → Settings → Backups
```

#### Optimization
```bash
# Analyze query performance
npx prisma db execute --sql "EXPLAIN ANALYZE SELECT ..."

# Update statistics
npx prisma db execute --sql "ANALYZE;"
```

### Scaling

#### Horizontal Scaling
```yaml
# railway.toml
[scaling]
minReplicas = 2
maxReplicas = 10
targetCPU = 70
targetMemory = 80
```

#### Vertical Scaling
- Railway: Adjust in dashboard → Service → Resources
- Set CPU: 1-4 vCPU
- Set Memory: 1-8 GB

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check connection string
echo $DATABASE_URL

# Test connection
npx prisma db pull

# Common fixes:
# - Ensure SSL mode: ?sslmode=require
# - Check IP whitelist
# - Verify credentials
```

#### 2. Redis Connection Issues
```bash
# Test Redis connection
redis-cli -u $REDIS_URL ping

# Should return: PONG
```

#### 3. Build Failures
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build

# Check Node version
node --version  # Should be 18+
```

#### 4. Migration Errors
```bash
# Reset migrations (CAUTION: Data loss)
npx prisma migrate reset

# Force apply migrations
npx prisma db push --force-reset
```

#### 5. CORS Errors
```javascript
// Verify CORS_ORIGIN in backend/.env
CORS_ORIGIN=https://app.yourdomain.com

// Multiple origins
CORS_ORIGIN=https://app.yourdomain.com,https://localhost:3000
```

### Debug Mode

#### Enable Debug Logging
```env
# backend/.env
LOG_LEVEL=debug
DEBUG=prisma:*
```

#### Check Logs
```bash
# Railway
railway logs --service backend --tail

# Docker
docker logs shopify-marketing-ai-backend-1 -f

# PM2
pm2 logs backend
```

### Performance Issues

#### 1. Slow Queries
```sql
-- Find slow queries
SELECT query, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

#### 2. Memory Leaks
```javascript
// Add heap snapshot
if (process.env.NODE_ENV === 'production') {
  require('heapdump');
}
```

#### 3. Rate Limiting
```env
# Adjust in backend/.env
RATE_LIMIT_MAX=200
RATE_LIMIT_WINDOW=60000
```

---

## Security Checklist

### Pre-Deployment
- [ ] All secrets are unique and secure
- [ ] Environment variables are set correctly
- [ ] No sensitive data in code
- [ ] Dependencies are up to date
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured

### Post-Deployment
- [ ] SSL certificates active
- [ ] Database backups configured
- [ ] Monitoring alerts set up
- [ ] Error tracking enabled
- [ ] Access logs reviewed
- [ ] Security updates scheduled

---

## Support & Resources

### Documentation
- [API Documentation](/docs/API.md)
- [Database Schema](/docs/DATABASE.md)
- [Environment Variables](/docs/ENVIRONMENT.md)

### Getting Help
- GitHub Issues: [Report bugs](https://github.com/yourusername/shopify-marketing-ai/issues)
- Discord: [Join community](https://discord.gg/xxxxx)
- Email: support@yourdomain.com

### Useful Commands
```bash
# Health check
curl https://api.yourdomain.com/health

# Database status
npx prisma migrate status

# View logs
railway logs --tail

# Restart services
railway restart

# Scale services
railway scale --replicas 3
```

---

*Last Updated: December 2024*
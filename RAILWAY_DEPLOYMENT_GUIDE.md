# Complete Railway Deployment Guide

**Project**: Shopify Marketing AI  
**Generated**: 2026-01-15T14:58:00+03:00  
**Status**: ✅ Build Verified — Ready for Deployment

---

## 📊 Build Verification Status

| Component | Status | Exit Code |
|-----------|--------|-----------|
| Backend TypeScript Build | ✅ PASS | 0 |
| Frontend Next.js Build | ✅ PASS | 0 |
| Prisma Client Generation | ✅ PASS | 0 |
| Railway Config (backend) | ✅ Valid | - |
| Railway Config (frontend) | ✅ Valid | - |
| CI Workflow Syntax | ✅ Valid | - |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Railway Project                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐    ┌─────────────────────┐             │
│  │      Backend        │    │      Frontend       │             │
│  │   (Node.js API)     │◄───│    (Next.js SSR)    │             │
│  │     Port: 5000      │    │     Port: 3000      │             │
│  └──────────┬──────────┘    └─────────────────────┘             │
│             │                                                   │
│             ▼                                                   │
│  ┌─────────────────────┐    ┌─────────────────────┐             │
│  │     PostgreSQL      │    │       Redis         │             │
│  │   (Railway Plugin)  │    │  (Railway Plugin)   │             │
│  │     Port: 5432      │    │     Port: 6379      │             │
│  └─────────────────────┘    └─────────────────────┘             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Step-by-Step Deployment

### Step 1: Create Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Empty Project"**
4. Name it: `shopify-marketing-ai`

### Step 2: Add PostgreSQL Database

1. In your project, click **"Add Service"** → **"Database"** → **"PostgreSQL"**
2. Wait for provisioning (takes ~30 seconds)
3. Railway automatically creates `DATABASE_URL` environment variable
4. **Copy the connection string** from Variables tab (you'll need it)

### Step 3: Add Redis (Optional - for job queues)

1. Click **"Add Service"** → **"Database"** → **"Redis"**
2. Railway creates `REDIS_URL` automatically
3. Click on Redis service → Variables → Copy `REDIS_URL`

### Step 4: Deploy Backend

**Option A: Via Railway CLI (Recommended)**
```bash
cd /path/to/shopify-marketing-ai/backend
railway link  # Select your project
railway up --detach
```

**Option B: Via GitHub**
1. Click **"Add Service"** → **"GitHub Repo"**
2. Connect your repository
3. Set **Root Directory**: `/backend`
4. Railway auto-detects `railway.json`

### Step 5: Configure Backend Environment Variables

Go to **Backend Service** → **Variables** tab and add:

#### Required Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Reference to Postgres service |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` | Reference to Redis service |
| `JWT_SECRET` | `your-32-char-secret-key` | For auth tokens (generate secure random string) |
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `5000` | Backend port (Railway uses this) |

#### Email Configuration (Choose One)

**Option 1: AWS SES (Production Recommended)**
| Variable | Value |
|----------|-------|
| `AWS_ACCESS_KEY_ID` | Your AWS access key |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret |
| `AWS_REGION` | `us-east-1` (or your region) |
| `SES_FROM_EMAIL` | `noreply@yourdomain.com` |

**Option 2: SMTP (Gmail/Custom)**
| Variable | Value |
|----------|-------|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `your-email@gmail.com` |
| `SMTP_PASS` | `your-app-password` |

#### Optional Integrations

| Variable | Description |
|----------|-------------|
| `META_ACCESS_TOKEN` | Meta/Facebook Ads API token |
| `META_AD_ACCOUNT_ID` | Your Meta ad account ID |
| `SHOPIFY_ACCESS_TOKEN` | Shopify Admin API token |
| `SHOPIFY_STORE_URL` | `https://your-store.myshopify.com` |
| `GEMINI_API_KEY` | Google Gemini for AI content |

### Step 6: Deploy Frontend

```bash
cd /path/to/shopify-marketing-ai/frontend
railway link  # Select your project, create new service
railway up --detach
```

Or via GitHub with **Root Directory**: `/frontend`

### Step 7: Configure Frontend Environment

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://your-backend-url.railway.app` |

> **Get your backend URL**: Backend Service → Settings → Domains → Copy the generated URL

### Step 8: Run Database Migrations

```bash
cd backend
railway run npx prisma migrate deploy
```

Or SSH into the service and run directly.

### Step 9: Generate Custom Domains (Optional)

1. Go to each service → **Settings** → **Domains**
2. Add custom domain (e.g., `api.yourdomain.com`, `app.yourdomain.com`)
3. Add DNS CNAME record pointing to Railway

---

## 📋 Railway Configuration Files

Your project includes these Railway configs:

**`backend/railway.json`**:
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npx prisma generate && npm run build"
  },
  "deploy": {
    "startCommand": "npx prisma migrate deploy && npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 30
  }
}
```

**`frontend/railway.json`**:
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/"
  }
}
```

---

## 🔧 Troubleshooting

### Build Fails with "prisma generate" Error

**Cause**: `DATABASE_URL` not set during build
**Fix**: 
1. Set `DATABASE_URL` as a Railway variable
2. Prisma generate runs during build, needs the URL format (not actual connection)
3. Add placeholder: `postgresql://user:pass@host:5432/db`

### "Cannot find module" Errors

**Cause**: Dependencies not installed
**Fix**: Ensure `buildCommand` includes `npm install`

### Database Connection Refused

**Cause**: Wrong DATABASE_URL or network issue
**Fix**:
1. Use Railway's variable reference: `${{Postgres.DATABASE_URL}}`
2. Check if Postgres service is running
3. Verify you're in the same Railway project

### Healthcheck Failing

**Cause**: App not responding on expected path
**Fix**:
1. Backend: Ensure `/health` endpoint exists
2. Frontend: Root `/` should respond
3. Increase `healthcheckTimeout` if app is slow to start

### Frontend Can't Connect to Backend

**Cause**: CORS or wrong API URL
**Fix**:
1. Set `NEXT_PUBLIC_API_URL` to full Railway backend URL
2. Ensure backend CORS allows frontend origin

---

## 🔐 Generating Secrets

### JWT Secret
```bash
# Generate a secure 32-character secret
openssl rand -base64 32
```

### Railway CLI Commands

```bash
# Login
railway login

# Link to project
railway link

# Deploy
railway up --detach

# View logs
railway logs -f

# Run command in service
railway run <command>

# Check status
railway status

# Open service in browser
railway open
```

---

## ✅ Pre-Deployment Checklist

- [ ] PostgreSQL service created in Railway
- [ ] Redis service created (optional)
- [ ] `DATABASE_URL` variable references Postgres
- [ ] `JWT_SECRET` set with secure random value
- [ ] Email credentials configured (SES or SMTP)
- [ ] Backend deployed and healthcheck passing
- [ ] Frontend deployed with `NEXT_PUBLIC_API_URL` set
- [ ] Database migrations run (`railway run npx prisma migrate deploy`)
- [ ] Custom domains configured (optional)

---

## 📌 Quick Reference

| Service | Local Port | Railway Default |
|---------|------------|-----------------|
| Backend | 5000 | Auto-assigned |
| Frontend | 3000 | Auto-assigned |
| PostgreSQL | 5432 | Internal |
| Redis | 6379 | Internal |

**Railway Dashboard**: https://railway.app/dashboard  
**Railway Docs**: https://docs.railway.app  
**Project Build Logs**: Check Railway dashboard → Service → Deployments

---

## 🆘 Support

If deployment fails:
1. Check Railway build logs in dashboard
2. Verify all environment variables are set
3. Try `railway logs` in CLI for runtime errors
4. Check healthcheck path responds with 200

For code issues, run locally first:
```bash
cd backend && npm install && npx prisma generate && npm run build && npm start
cd frontend && npm install && npm run build && npm start
```

# Railway Deployment Guide
**Platform:** Railway.app  
**Status:** ✅ Ready for Deployment

---

## 🚀 Railway Deployment Steps

### Prerequisites
- Railway account (sign up at railway.app)
- GitHub repository (push your code)
- API credentials ready

---

## Step 1: Prepare Repository

### 1.1 Push to GitHub
```bash
# If not already on GitHub
git remote add origin https://github.com/yourusername/shopify-marketing-ai.git
git push -u origin development

# Create main branch for production
git checkout -b main
git push -u origin main
```

### 1.2 Verify Files
- ✅ `backend/.env.example` exists
- ✅ `frontend/.env.local.example` exists
- ✅ `backend/package.json` has build scripts
- ✅ `frontend/package.json` has build scripts
- ✅ `railway.json` configured (optional)

---

## Step 2: Deploy Backend

### 2.1 Create New Project
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Select `development` or `main` branch

### 2.2 Add PostgreSQL Database
1. In your project, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway will create and provide `DATABASE_URL`
4. Copy the connection string

### 2.3 Add Redis
1. Click "New" → "Database" → "Redis"
2. Railway will provide `REDIS_URL`
3. Copy the connection string

### 2.4 Configure Backend Service
1. Railway should auto-detect Node.js
2. Set root directory: `backend`
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Set port: `5000` (or use `$PORT`)

### 2.5 Set Environment Variables
In Railway dashboard, add these variables:

**Required:**
```
API_KEY=your-secure-api-key-here
DATABASE_URL=<provided by Railway PostgreSQL>
REDIS_URL=<provided by Railway Redis>
SHOPIFY_STORE_URL=ccxwq4-cp.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_token
OPENAI_API_KEY=your_key
```

**Optional:**
```
META_ACCESS_TOKEN=your_token
META_AD_ACCOUNT_ID=your_id
META_PAGE_ID=your_page_id
FRONTEND_URL=https://your-frontend.railway.app
NODE_ENV=production
LOG_LEVEL=info
```

### 2.6 Run Database Migrations
1. In Railway, open backend service terminal
2. Run:
```bash
npx prisma migrate deploy
npx prisma generate
```

### 2.7 Deploy Worker (Separate Service)
1. Duplicate backend service
2. Rename to "backend-worker"
3. Change start command to: `npm run worker`
4. Use same environment variables

---

## Step 3: Deploy Frontend

### 3.1 Create Frontend Service
1. In same Railway project, click "New"
2. Select "GitHub Repo" (same repo)
3. Select branch: `development` or `main`
4. Set root directory: `frontend`

### 3.2 Configure Frontend
1. Set build command: `npm install && npm run build`
2. Set start command: `npm start`
3. Set port: `3000` (or use `$PORT`)

### 3.3 Set Environment Variables
```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
# Optional:
# NEXT_PUBLIC_API_KEY=your-key (if pre-configured)
```

### 3.4 Get Frontend URL
- Railway will provide a URL like: `https://your-frontend.railway.app`
- Update backend `FRONTEND_URL` with this value

---

## Step 4: Configure Domains (Optional)

### 4.1 Custom Domain
1. In Railway service settings
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

### 4.2 Update CORS
Update backend `FRONTEND_URL` with your custom domain

---

## Step 5: Verify Deployment

### 5.1 Test Backend
```bash
curl https://your-backend.railway.app/health
# Should return: {"status":"ok",...}
```

### 5.2 Test Frontend
1. Visit: `https://your-frontend.railway.app`
2. Should see login page
3. Enter API key
4. Should redirect to campaigns

### 5.3 Test API
```bash
curl -H "x-api-key: your-api-key" \
  https://your-backend.railway.app/api/campaigns
```

---

## 📋 Railway Configuration Files

### Backend Service
- **Root Directory:** `backend`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Port:** `5000` (or `$PORT`)

### Worker Service
- **Root Directory:** `backend`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm run worker`
- **Port:** Not needed (background service)

### Frontend Service
- **Root Directory:** `frontend`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Port:** `3000` (or `$PORT`)

---

## 🔧 Environment Variables Reference

### Backend Required
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://...` |
| `REDIS_URL` | Redis connection | `redis://...` |
| `API_KEY` | API authentication key | `your-secure-key` |
| `SHOPIFY_ACCESS_TOKEN` | Shopify API token | `shpat_...` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |

### Backend Optional
| Variable | Description |
|----------|-------------|
| `META_ACCESS_TOKEN` | Meta Ads API token |
| `META_AD_ACCOUNT_ID` | Meta ad account ID |
| `FRONTEND_URL` | Frontend URL for CORS |
| `PORT` | Server port (default: 5000) |

### Frontend Required
| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://backend.railway.app` |

---

## 💰 Railway Pricing Estimate

### Development/Staging
- **PostgreSQL:** $5/month (Hobby plan)
- **Redis:** $5/month (Hobby plan)
- **Backend Service:** $5/month
- **Worker Service:** $5/month
- **Frontend Service:** $5/month
- **Total:** ~$25/month

### Production
- **PostgreSQL:** $20/month (Pro plan)
- **Redis:** $10/month
- **Services:** $20/month
- **Total:** ~$50/month

---

## 🐛 Troubleshooting

### Backend Won't Start
1. Check environment variables are set
2. Verify `DATABASE_URL` is correct
3. Check logs in Railway dashboard
4. Ensure migrations ran: `npx prisma migrate deploy`

### Frontend Build Fails
1. Check `NEXT_PUBLIC_API_URL` is set
2. Verify Node.js version (20+)
3. Check build logs for errors

### Database Connection Issues
1. Verify `DATABASE_URL` format
2. Check database is running
3. Ensure migrations completed

### API Authentication Fails
1. Verify `API_KEY` matches in backend and frontend
2. Check CORS settings
3. Verify `FRONTEND_URL` is correct

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Code pushed to GitHub
- [ ] Environment variables documented
- [ ] Database migrations ready
- [ ] Build scripts tested locally

### Backend Deployment
- [ ] PostgreSQL database created
- [ ] Redis instance created
- [ ] Backend service deployed
- [ ] Worker service deployed
- [ ] Environment variables set
- [ ] Migrations run
- [ ] Health check passes

### Frontend Deployment
- [ ] Frontend service deployed
- [ ] Environment variables set
- [ ] Build successful
- [ ] Can access login page

### Post-Deployment
- [ ] Backend health check works
- [ ] Frontend loads correctly
- [ ] Authentication works
- [ ] API calls succeed
- [ ] Custom domain configured (if needed)

---

## 🚀 Quick Deploy Commands

### One-Time Setup
```bash
# 1. Push to GitHub
git push origin main

# 2. In Railway:
# - Create project from GitHub
# - Add PostgreSQL
# - Add Redis
# - Deploy backend
# - Deploy frontend
# - Set environment variables
# - Run migrations
```

### Updates
```bash
# Push changes
git push origin main

# Railway auto-deploys
# Or trigger manual deploy in dashboard
```

---

**Status:** ✅ Ready for Railway Deployment  
**Last Updated:** December 2024


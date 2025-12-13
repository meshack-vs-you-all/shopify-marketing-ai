# Setup Guide

Complete setup instructions for the Shopify Marketing Automation AI system.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** 20+ and npm/yarn installed
- **PostgreSQL** 15+ running locally or accessible
- **Redis** 7+ running locally or accessible
- API credentials for:
  - Shopify Admin API
  - Meta Business Suite (Facebook/Instagram Ads)
  - Google Ads API (optional initially)
  - OpenAI API

## Step 1: Clone and Install

```bash
cd shopify-marketing-ai

# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## Step 2: Database Setup

### Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE shopify_marketing_ai;

# Exit
\q
```

### Run Migrations

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed database with sample data
npx prisma db seed
```

## Step 3: Environment Configuration

### Backend Environment Variables

Create `backend/.env` file:

```bash
cd backend
cp .env.example .env
```

Edit `.env` and fill in your credentials:

```env
# Server
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/shopify_marketing_ai

# Redis
REDIS_URL=redis://localhost:6379

# Shopify
SHOPIFY_STORE_URL=your-store.myshopify.com
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_ACCESS_TOKEN=your_access_token

# Meta (Facebook/Instagram Ads)
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_ACCESS_TOKEN=your_meta_access_token
META_AD_ACCOUNT_ID=act_your_ad_account_id
META_PAGE_ID=your_page_id

# Google Ads (Optional)
GOOGLE_ADS_CLIENT_ID=your_google_client_id
GOOGLE_ADS_CLIENT_SECRET=your_google_client_secret
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token
GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token
GOOGLE_ADS_CUSTOMER_ID=your_customer_id

# OpenAI
OPENAI_API_KEY=your_openai_api_key
OPENAI_ORG_ID=your_org_id_optional

# Feature Flags
ENABLE_AI_CONTENT_GENERATION=true
ENABLE_AUTO_APPROVAL=false
AUTO_APPROVAL_THRESHOLD=20
```

### Frontend Environment Variables

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Step 4: Get API Credentials

### Shopify Admin API

1. Go to your Shopify admin: `https://your-store.myshopify.com/admin`
2. Navigate to **Settings** → **Apps and sales channels** → **Develop apps**
3. Click **Create an app**
4. Name it "Marketing AI" and click **Create app**
5. Configure Admin API scopes:
   - `read_products`
   - `read_orders`
   - `read_customers`
6. Click **Install app**
7. Copy the **API key** and **API secret**
8. Generate an **Admin API access token**

### Meta Business Suite (Facebook/Instagram Ads)

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app or use existing
3. Add **Marketing API** product
4. Get **App ID** and **App Secret**
5. Generate **Access Token** with `ads_management` permission
6. Get your **Ad Account ID** from [Meta Ads Manager](https://business.facebook.com/adsmanager/)
7. Get your **Page ID** from your Facebook page settings

### OpenAI API

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to **API keys**
4. Create a new secret key
5. Copy the key (you won't see it again!)

### Google Ads API (Optional)

1. Go to [Google Ads API Center](https://ads.google.com/aw/apicenter)
2. Apply for API access
3. Create OAuth 2.0 credentials in Google Cloud Console
4. Get **Client ID**, **Client Secret**, **Developer Token**
5. Generate **Refresh Token** using OAuth flow
6. Get your **Customer ID** from Google Ads account

## Step 5: Start Development Servers

You'll need **3 terminal windows**:

### Terminal 1: Backend API Server

```bash
cd backend
npm run dev
```

Server will run on `http://localhost:5000`

### Terminal 2: Background Worker

```bash
cd backend
npm run worker
```

This processes background jobs (metric syncing, optimization, etc.)

### Terminal 3: Frontend (Next.js)

```bash
cd frontend
npm run dev
```

Dashboard will run on `http://localhost:3000`

## Step 6: Verify Setup

### Test API Connection

```bash
# Health check
curl http://localhost:5000/health

# Test Shopify connection (via API endpoint - to be created)
curl http://localhost:5000/api/test/shopify

# Test Meta connection
curl http://localhost:5000/api/test/meta
```

### Test Database

```bash
cd backend
npx prisma studio
```

This opens a GUI to view your database at `http://localhost:5555`

## Step 7: Create Your First Campaign

### Via API

```bash
curl -X POST http://localhost:5000/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "META",
    "budget": 1000,
    "dailyBudget": 50,
    "objective": "CONVERSIONS",
    "autoApprove": false
  }'
```

### Via Dashboard

1. Open `http://localhost:3000`
2. Navigate to **Campaigns**
3. Click **Create Campaign**
4. Fill in the form
5. Submit for approval

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U postgres -d shopify_marketing_ai -c "SELECT 1;"
```

### Redis Connection Issues

```bash
# Check Redis is running
redis-cli ping
# Should return: PONG

# Test connection
redis-cli
> PING
```

### API Credential Issues

- Verify all environment variables are set correctly
- Check API keys haven't expired
- Ensure OAuth tokens are valid (Google/Meta)
- Test each API connection individually

### Port Already in Use

```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>
```

## Next Steps

- Read [Configuration Guide](CONFIGURATION.md) for advanced settings
- Check [API Documentation](API.md) for endpoint details
- Review [Deployment Guide](DEPLOYMENT.md) for production setup

## Getting Help

If you encounter issues:

1. Check the logs in `backend/logs/`
2. Review error messages in terminal
3. Verify all environment variables are set
4. Test API connections individually
5. Check database migrations completed successfully


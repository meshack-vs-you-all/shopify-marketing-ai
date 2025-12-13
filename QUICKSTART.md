# Quick Start Guide

Get up and running in 5 minutes!

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
# Backend
cd backend && npm install && cd ..

# Frontend (when ready)
cd frontend && npm install && cd ..
```

### 2. Set Up Database

```bash
cd backend

# Create .env file (copy from .env.example and fill in)
cp .env.example .env

# Edit .env with your database URL:
# DATABASE_URL=postgresql://user:password@localhost:5432/shopify_marketing_ai

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

### 3. Configure API Keys

Edit `backend/.env` and add your API credentials:

**Minimum Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection (default: `redis://localhost:6379`)
- `SHOPIFY_STORE_URL` - Your Shopify store
- `SHOPIFY_ACCESS_TOKEN` - Shopify Admin API token
- `OPENAI_API_KEY` - OpenAI API key

**For Meta Ads:**
- `META_ACCESS_TOKEN` - Meta Business API token
- `META_AD_ACCOUNT_ID` - Your ad account ID

### 4. Start Services

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Worker:**
```bash
cd backend
npm run worker
```

**Terminal 3 - Frontend (when ready):**
```bash
cd frontend
npm run dev
```

### 5. Test It

```bash
# Health check
curl http://localhost:5000/health

# Should return: {"status":"ok","timestamp":"...","uptime":...}
```

## ✅ You're Ready!

- **API Server**: http://localhost:5000
- **API Docs**: Check `/api/health` endpoint
- **Database GUI**: Run `npx prisma studio` in backend folder

## 📝 Next Steps

1. **Create your first campaign** via API:
   ```bash
   curl -X POST http://localhost:5000/api/campaigns \
     -H "Content-Type: application/json" \
     -d '{
       "platform": "META",
       "budget": 1000,
       "dailyBudget": 50,
       "objective": "CONVERSIONS"
     }'
   ```

2. **Check pending approvals**:
   ```bash
   curl http://localhost:5000/api/approvals
   ```

3. **View campaign metrics**:
   ```bash
   curl http://localhost:5000/api/campaigns/{campaignId}/metrics
   ```

## 🐛 Troubleshooting

**Database connection error?**
- Make sure PostgreSQL is running: `sudo systemctl status postgresql`
- Check your DATABASE_URL in `.env`

**Redis connection error?**
- Make sure Redis is running: `redis-cli ping`
- Should return `PONG`

**API errors?**
- Check all required environment variables are set
- Verify API keys are valid
- Check logs in `backend/logs/`

## 📚 Full Documentation

- [Complete Setup Guide](docs/SETUP.md)
- [API Documentation](docs/API.md) (coming soon)
- [Configuration Guide](docs/CONFIGURATION.md) (coming soon)


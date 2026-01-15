# Railway Deployment Guide

**Last Updated**: 2026-01-15T14:45:00+03:00

## Prerequisites

- Railway CLI installed and authenticated (`railway login`)
- Docker Desktop or compatible container runtime
- PostgreSQL database provisioned in Railway

## Required Environment Variables

Set these in Railway project settings:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ Yes |
| `REDIS_URL` | Redis connection string | ✅ Yes |
| `JWT_SECRET` | Secret for JWT tokens | ✅ Yes |
| `PORT` | Backend port (default: 5000) | No |
| `NODE_ENV` | Set to `production` | No |

### Email Configuration (at least one required)

**AWS SES (Recommended):**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `SES_FROM_EMAIL`

**Or SMTP Fallback:**
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`

### Optional Integrations

| Variable | Description |
|----------|-------------|
| `META_ACCESS_TOKEN` | Meta Ads API access token |
| `META_AD_ACCOUNT_ID` | Meta Ad Account ID |
| `SHOPIFY_ACCESS_TOKEN` | Shopify API access token |
| `SHOPIFY_STORE_URL` | Shopify store URL |
| `GEMINI_API_KEY` | Google Gemini for AI generation |

## Deployment Commands

### Initial Deploy

```bash
# Navigate to project root
cd /path/to/shopify-marketing-ai

# Deploy backend
cd backend
railway up --detach

# Check logs
railway logs --tail
```

### Database Migrations

```bash
# Run migrations (first deploy or schema changes)
railway run npx prisma migrate deploy

# Or push schema directly (dev only, may cause data loss)
railway run npx prisma db push
```

### Seed Database (Optional)

```bash
railway run npx prisma db seed
```

## Verification

1. Check deployment status:
   ```bash
   railway status
   ```

2. Test health endpoint:
   ```bash
   curl https://your-railway-url.railway.app/health
   ```

3. Monitor logs:
   ```bash
   railway logs -f
   ```

## Troubleshooting

### Build Fails with Prisma Error
Ensure `prisma generate` runs during build. The Dockerfile includes this step.

### Missing Environment Variables
Check Railway dashboard → Variables tab. All required vars must be set.

### Database Connection Issues
- Verify `DATABASE_URL` format: `postgresql://user:pass@host:port/db`
- Ensure Railway Postgres service is running
- Check if database needs migration

### Email Sending Fails
- Verify SES identities are configured (sandbox mode requires verified emails)
- Check AWS credentials and region
- Try SMTP fallback if SES unavailable

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Railway                        │
├─────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐              │
│  │   Backend   │  │   Frontend   │              │
│  │  (Node.js)  │  │  (Next.js)   │              │
│  │   :5000     │  │    :3000     │              │
│  └──────┬──────┘  └──────────────┘              │
│         │                                       │
│  ┌──────┴──────┐  ┌──────────────┐              │
│  │  PostgreSQL │  │    Redis     │              │
│  │   :5432     │  │    :6379     │              │
│  └─────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────┘
```

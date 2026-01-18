
# Production Readiness Report & Deployment Guide

**Date**: 2026-01-18
**Status**: Ready for Deployment (v1.0 Candidate)

## 1. Deployment Optimization (Railway)
I have optimized the application for deployment on Railway (or any Docker-based PaaS).

### Backend (`backend/Dockerfile`)
- **Multi-Stage Build**: Reduced image size by separating build (TypeScript compilation) from runtime.
- **Security**: Runs as non-root user (`expressjs`).
- **NPM & Workspaces**: Configured to use the root `package-lock.json` for reliable dependency resolution.
- **Migration Strategy**: The startup command automatically runs `prisma migrate deploy` before starting the server, ensuring the database schema is always in sync.

### Frontend (`frontend/Dockerfile`)
- **Standalone Mode**: Uses Next.js "standalone" output for ultra-lightweight containers (copying only necessary files).
- **Optimization**: Telemetry disabled, production environment forced.
- **Security**: Runs as non-root user (`nextjs`).

## 2. Configuration Checklist
Before deploying, ensure these variables are set in your Railway project dashboard:

### Backend Service Variables
| Variable | Value (Example) | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://...` | Provided by Railway Postgres plugin |
| `REDIS_URL` | `redis://...` | Provided by Railway Redis plugin |
| `SHOPIFY_STORE_URL` | `your-shop.myshopify.com` | Your live store domain |
| `SHOPIFY_ACCESS_TOKEN` | `shpat_...` | Admin API token |
| `SHOPIFY_WEBHOOK_SECRET` | `...` | From Shopify Admin > Notifications |
| `AWS_ACCESS_KEY_ID` | `...` | For SES Email sending |
| `AWS_SECRET_ACCESS_KEY` | `...` | For SES Email sending |
| `OPENROUTER_API_KEY` | `sk-or-...` | For AI generation |
| `JWT_SECRET` | `...` | Random secure string |
| `FRONTEND_URL` | `https://your-frontend.up.railway.app` | For CORS and redirects |

### Frontend Service Variables
| Variable | Value (Example) | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://your-backend.up.railway.app` | Point to the deployed backend URL |

## 3. Post-Deployment Verification
After pushing to Railway:
1.  **Check Logs**: Ensure Backend logs show "Server running on port 5000" and "Prisma migrations applied".
2.  **Verify Webhooks**: Use the `scripts/register-webhooks.ts` locally (pointing to prod URL) or configure manually in Shopify.
3.  **Test Auth**: Sign up a new user on the live site.
4.  **Test AI**: Generate a sample newsletter.

## 4. Maintenance & Monitoring
-   **Database Backups**: Enable Railway's automated backups (or configure a cron job).
-   **Logs**: Monitor Railway logs for `[ERROR]`. Consider integrating Sentry for real-time alerting.
-   **Updates**: To deploy updates, simply `git push railway development:master` (or connect GitHub repo for auto-deploy).

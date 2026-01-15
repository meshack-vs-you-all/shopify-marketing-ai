# URL Alignment Report

**Goal**: Align codebase with canonical DreamHost production URLs.
- **Frontend**: `https://marketing.glowifybabystores.com`
- **Backend API**: `https://api.marketing.glowifybabystores.com`

## 🔄 Changes Summary

| Category | Old Value / Placeholder | New Value (Canonical) | Files Modified |
|----------|-------------------------|------------------------|----------------|
| **Frontend Env** | `https://api.yourdomain.com`<br>`https://app.yourdomain.com` | `https://api.marketing.glowifybabystores.com`<br>`https://marketing.glowifybabystores.com` | `frontend/.env.production.example` |
| **Backend CORS** | `http://localhost:3000`<br>`process.env.FRONTEND_URL` | Added `https://marketing.glowifybabystores.com`<br>Added partial `CORS_ORIGIN` support | `backend/src/index.ts`<br>`backend/.env.production.example` |
| **Docs (Checklist)** | `*.up.railway.app` | `marketing.glowifybabystores.com` | `manual_checklist.md` |
| **Docs (Playbook)** | `<BACKEND_URL>` | `api.marketing.glowifybabystores.com` | `update_and_release_playbook.md` |
| **Docs (Status)** | `your-frontend.railway.app` | `marketing.glowifybabystores.com` | `RAILWAY_STATUS_REPORT.md` |

## ⚠️ Assumptions & Manual Actions

1.  **DNS Configuration**: We assume you have configured `marketing.glowifybabystores.com` and `api.marketing.glowifybabystores.com` CNAME records to point to Railway.
2.  **Railway Variables**: The code changes update *defaults* and *examples*. You **MUST** update the actual Railway environment variables for the changes to take effect in production.

### Manual Steps Required

Run the following commands locally (or update via Dashboard) to apply these changes to the live environment:

```bash
# 1. Update Backend Variables
railway variables --service backend --set "CORS_ORIGIN=https://marketing.glowifybabystores.com" --set "FRONTEND_URL=https://marketing.glowifybabystores.com"

# 2. Update Frontend Variables
railway variables --service frontend --set "NEXT_PUBLIC_API_URL=https://api.marketing.glowifybabystores.com" --set "NEXT_PUBLIC_APP_URL=https://marketing.glowifybabystores.com"

# 3. Add Custom Domains (if not already done)
railway domain --service frontend --add "marketing.glowifybabystores.com"
railway domain --service backend --add "api.marketing.glowifybabystores.com"
```

## ✅ Validation

After applying the manual steps:
1.  **Frontend**: Visit `https://marketing.glowifybabystores.com`. It should load without CORS errors.
2.  **Backend**: `curl https://api.marketing.glowifybabystores.com/health` should return `{"status":"ok"}`.

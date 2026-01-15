# Manual Deployment Verification Checklist

## 1. Pre-Fight Checks
- [ ] **Backup**: Confirm database snapshots are enabled/active in Railway.
- [ ] **Environment**: Verify `DATABASE_URL` and `REDIS_URL` are set in Railway Variables for both services.
- [ ] **Secrets**: Confirm `JWT_SECRET`, `API_KEY` are populated.

## 2. Smoke Tests (Priority: Critical)
Run these immediately after deployment indicates "Success".

### Frontend
- **Command**: `curl -I https://marketing.glowifybabystores.com/`
- **Expect**: `HTTP/2 200`
- **Manual**: Open URL in browser. Should see "Glowify Marketing AI" landing page.

### Backend Health
- **Command**: `curl -v https://api.marketing.glowifybabystores.com/health`
- **Expect**: `{"status":"ok"}` (or similar 200 OK JSON)
- **Check**: If 404/502, check Railway Deployment Logs > Backend > Deploy Logs.

## 3. Core Flows
- [ ] **Authentication**:
  - Visit `/login`.
  - Attempt login (migrated User if exists, or Register new).
  - Expect: Redirect to Dashboard.
- [ ] **Database Connection**:
  - Backend logs should show "Connected to Database" or Prisma initialization success.
  - No "P1001" (Authentication failed) errors.

## 4. Infrastructure & Observability
- [ ] **Logs**:
  - `railway logs --service backend --limit 100`
  - Look for `Server running on port 5000` (or 8080 if remapped).
- [ ] **Metrics**:
  - Check Railway Dashboard > Metrics. CPU/RAM should be stable (not flatlining at 0 or 100%).

## 5. Rollback Plan
If Smoke Tests fail:
1. Go to Railway Dashboard > Service > Deployments.
2. Click the **three dots** on the *previous* successful deployment.
3. Select **Redeploy**.
4. Verify previous version works.

# Update & Release Playbook

## 🔄 Branching Strategy
- **`main`**: Production-ready code. Auto-deploys to Railway (Production).
- **`feature/*`**: Development branches. Open Pull Request (PR) to `main`.

## 📦 Release Workflow

1. **Create Release Branch** (Optional but recommended for versioning)
   ```bash
   git checkout -b release/v1.0.1
   # Bump version in package.json
   git commit -am "chore: bump version to v1.0.1"
   git tag v1.0.1
   git push origin v1.0.1
   ```

2. **Trigger Deployment**
   - **Method A: Git Push (Automatic)**
     Merges to `main` trigger Railway's GitHub integration automatically.
   - **Method B: CLI (Manual)**
     ```bash
     railway up --service backend --detach
     railway up --service frontend --detach
     ```

## 🛠️ Database Migrations
**Strategy**: Migrations run automatically on deploy via `startCommand` in `backend/Dockerfile`.

**Manual Migration (Safety Check):**
If a migration is risky (e.g., column drop), run it against a shadow DB or check status first:
```bash
# Check status
railway run npx prisma migrate status

# Run manually if needed
railway run npx prisma migrate deploy
```

## 🚨 Rollback Procedure
If a deployment fails or introduces a critical bug:

1. **Identify Stable Build**:
   Check Railway Dashboard > Service > History for the last "Green" build.

2. **Revert**:
   - **Via Dashboard**: Click "Redeploy" on the stable build.
   - **Via CLI**:
     ```bash
     # Find previous deployment ID
     railway history --service backend
     # Rollback (conceptually - Railway uses redeploy)
     # git revert <bad-commit> && git push
     ```

## 🧪 Post-Deploy Verification
After "Success" status:
1. Check **Health Endpoint**: `curl https://api.marketing.glowifybabystores.com/health`
2. Check **Frontend Load**: `curl -I https://marketing.glowifybabystores.com/`
3. Check **Logs for Errors**: `railway logs --service backend --limit 50 --filter "Error"`

## 📝 Configuration Variables
To update secrets/env vars:
```bash
railway variables --service backend --set "NEW_VAR=value"
# This triggers a redeploy automatically
```

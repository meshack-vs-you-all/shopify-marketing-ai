# Railway Pre-Deployment Check

**Status**: 🟢 **SAFE TO DEPLOY** (With Configuration Actions)

## 1. Access & Connectivity
- **CLI Access**: ✅ Verified (`railway status` confirmed connection to `shopify-marketing-ai-prod`).
- **Service Visibility**: ✅ Backend and Frontend services are visible.

## 2. Deployment Strategy Verification
- **Method**: Dockerfile (Root Context) via `railway.toml`.
- **Migrations**: ✅ **Automatic**.
  - `backend/Dockerfile` CMD contains: `npx prisma migrate deploy ... && npm start`.
  - This ensures any database changes are applied safely before the app traffic starts.
- **Current Update Risk**: 🟢 **Low**.
  - No database schema changes in `feat/google-auth`.
  - `prisma migrate deploy` will run but do nothing (no-op), which is safe.
  - New feature (Google Auth) is additive and does not break existing flows.

## 3. Critical Actions Required (Before or Immediately After Push)
The new feature (Google Sign-In) **WILL NOT WORK** until you set these variables in Railway. The app will deploy and run, but login will fail.

### Frontend Service Variables
| Variable | Value Needed | Source |
|----------|--------------|--------|
| `GOOGLE_CLIENT_ID` | `...` | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | `...` | Google Cloud Console |
| `NEXTAUTH_URL` | `https://marketing.glowifybabystores.com` | Production Domain |
| `NEXTAUTH_SECRET` | `(Any random string)` | Generate: `openssl rand -base64 32` |

### Backend Service Variables
| Variable | Value Needed | Source |
|----------|--------------|--------|
| `CORS_ORIGIN` | `https://marketing.glowifybabystores.com` | Production Domain |
| `FRONTEND_URL` | `https://marketing.glowifybabystores.com` | Production Domain |

## 4. How to Update
Since you are using the CLI/Git integration:
1.  **Set Variables**: `railway variables --service frontend --set ...` (or use Dashboard).
2.  **Push Code**: Run `./push_all_branches.sh`.
    - This pushes `development`, `feat/google-auth`, etc.
    - If Railway is linked to `development` or `main`, it will trigger a deploy.
    - If not auto-linked, run: `railway up --service backend` and `railway up --service frontend`.

## 5. Post-Deploy Validation
1.  Visit `https://marketing.glowifybabystores.com`.
2.  Click "Sign In".
3.  If verified, run seed script:
    ```bash
    railway shell --service backend
    npx tsx scripts/ensure-admin.ts
    ```

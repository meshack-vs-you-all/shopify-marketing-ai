# Google Auth Manual Test Checklist

## Local Testing
1. **Setup Env**:
   - Frontend `.env.local`: Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_URL=http://localhost:3000`, `NEXTAUTH_SECRET`.
   - Backend `.env`: Ensure `JWT_SECRET` is set.
2. **Start Services**:
   - `npm run dev` in Backend (Port 5000).
   - `npm run dev` in Frontend (Port 3000).
3. **Visit Test Page**:
   - Navigate to `http://localhost:3000/test-auth`.
4. **Sign In**:
   - Click "Continue with Google".
   - Complete flow.
   - Expect redirect to Dashboard.
5. **Verify User**:
   - Check Backend logs: `User upserted...`
   - Check DB: `npx prisma studio` -> `User` table should show new entry.

## Production Testing (Railway)
1. **Configure Variables**:
   - Apply all variables from `url_alignment_report.md`.
2. **Deploy**:
   - Push changes and wait for build.
3. **Admin Seed**:
   - `railway shell --service backend`
   - `npx tsx scripts/ensure-admin.ts`
   - Verify output: `✅ User role updated to ADMIN`.
4. **Sign In**:
   - Visit `https://marketing.glowifybabystores.com`.
   - Sign In.
5. **Verify Access**:
   - Check if you can access Admin routes (if any).
   - `curl https://api.marketing.glowifybabystores.com/api/auth/me -H "Authorization: Bearer <token>"` (if token accessible)
   - Or simply check UI shows Admin features.

## Troubleshooting
- **Error: redirect_uri_mismatch**:
  - Check Google Console. Must EXACTLY match `https://marketing.glowifybabystores.com/api/auth/callback/google`.
- **Error: 500 on SignIn**:
  - Check Frontend Logs (`railway logs --service frontend`).
  - Check Backend Logs (`railway logs --service backend`).
  - Ensure Backend API URL is reachable from Frontend container (`NEXT_PUBLIC_API_URL` correct?).

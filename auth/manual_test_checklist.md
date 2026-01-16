# Manual Test Checklist: Google Auth

## 1. Local Development
- [ ] **Setup**: `cp .env.example .env` and fill valid Google Credentials.
- [ ] **Build**: `npm install && npm run dev`.
- [ ] **Access**: Go to `http://localhost:3000/test-auth`.
- [ ] **Sign In**: Click "Sign in with Google".
- [ ] **Verify Redirect**: Should go to Google -> Consent -> App.
- [ ] **Verify User**: Check DB `SELECT * FROM users WHERE email='...'`.
  - `googleId` should be populated.
  - `avatar` should be populated.

## 2. Admin Bootstrap
- [ ] **Run Script**: `npx tsx backend/scripts/bootstrap-admin.ts`.
- [ ] **Verify Admin**: `SELECT role FROM users WHERE email='meshackmogire406@gmail.com'` should be `ADMIN`.

## 3. Production Deployment (Railway)
- [ ] **Env Vars**: Verify all vars from `url_alignment_report.md` are set in Railway.
- [ ] **Migration**: Check Railway logs to ensure migration ran (or run `railway shell` -> `npx prisma migrate deploy`).
- [ ] **Sign In**: Login at `https://marketing.glowifybabystores.com`.
- [ ] **Validation**:
  - Login successful (no redirect loop).
  - Session persists on refresh.
  - Admin features visible for `meshackmogire406@gmail.com`.

## 4. Troubleshooting
- **Error: redirect_uri_mismatch**: Check Google Console "Authorized Redirect URIs".
- **Error: 400 Bad Request**: Check `NEXTAUTH_URL` and `NEXT_PUBLIC_API_URL`.
- **Database Error**: Check `DATABASE_URL` and if migration was applied.

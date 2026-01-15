# Google Authentication Implementation

This module configures Google OAuth 2.0 using **NextAuth.js** on the frontend and a secure callback to the **Express Backend** for user persistence (database-first auth).

## Architecture

1. **Frontend (Next.js)**:
   - Uses `next-auth` with `GoogleProvider`.
   - Initiates Sign-In flow (`/api/auth/signin`).
   - Receives callback from Google.
   - In `signIn` callback, posts user profile `(email, name, googleId)` to Backend.
   - Receiving Backend Token, stores it in NextAuth Session.

2. **Backend (Express)**:
   - Exposes `POST /api/auth/google`.
   - Upserts User in PostgreSQL (Prisma).
   - If user doesn't exist, creates one with random password hash and default role (EDITOR, or ADMIN for specific emails).
   - Returns JWT.

## Configuration

### Google Console
- **Authorized Origins**: `https://marketing.glowifybabystores.com`
- **Redirect URI**: `https://marketing.glowifybabystores.com/api/auth/callback/google`

### Railway Environment Variables
Set these in Railway Dashboard:

**Frontend**:
- `GOOGLE_CLIENT_ID`: (from Google Console)
- `GOOGLE_CLIENT_SECRET`: (from Google Console)
- `NEXTAUTH_URL`: `https://marketing.glowifybabystores.com`
- `NEXTAUTH_SECRET`: (random string)

**Backend**:
- `JWT_SECRET`: (secure random string)
- `FRONTEND_URL`: `https://marketing.glowifybabystores.com`
- `CORS_ORIGIN`: `https://marketing.glowifybabystores.com`

## Admin Access
To ensure Admin access for `meshackmogire406@gmail.com`:
1. Deploy Backend.
2. Run `railway shell --service backend`
3. Run `npx tsx scripts/ensure-admin.ts`

# Local Development & Feature Verification Guide

## 1. Hot Reload Confirmation
✅ **Yes, Hot Reload is Enabled.**
- **Frontend**: Uses `next dev`, which supports Fast Refresh (Hot Reload) by default.
- **Backend**: Uses `tsx watch`, which automatically restarts the server on file changes.

## 2. Running Locally (with Google Auth)
To test the new features on your local machine, follows these steps:

### Step A: Configure Local Environment
1. **Frontend**: Open `frontend/.env.local` and add:
   ```env
   GOOGLE_CLIENT_ID=<your-google-client-id>
   GOOGLE_CLIENT_SECRET=<your-google-client-secret>
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=local-dev-secret
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```
2. **Backend**: Open `.env` (root) and ensure:
   ```env
   PORT=5000
   CORS_ORIGIN=http://localhost:3000
   FRONTEND_URL=http://localhost:3000
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/shopify_marketing_ai
   JWT_SECRET=local-dev-secret
   ```

### Step B: Start Services
 Open two terminal tabs:

**Terminal 1 (Backend)**
```bash
cd backend
npm run dev
# Expected: Server running on port 5000
```

**Terminal 2 (Frontend)**
```bash
cd frontend
npm run dev
# Expected: Ready in ... on http://localhost:3000
```

### Step C: Verify Google Auth
1. Visit `http://localhost:3000/test-auth`.
2. Click "Continue with Google".
3. **Note**: If Google shows a "Redirect Mismatch" error, ensure `http://localhost:3000/api/auth/callback/google` is added to "Authorized Redirect URIs" in your Google Cloud Console.

## 3. Codebase Alignment
- **Architecture**: We implemented NextAuth.js (Standard for Next.js) + Backend Database Persistence.
- **Security**: Emails are verified by Google. Backend only upserts users with valid Google tokens.
- **Role Management**: `meshackmogire406@gmail.com` is automatically granted `ADMIN` role.

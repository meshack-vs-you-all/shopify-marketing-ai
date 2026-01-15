# Auth URL Alignment Report

## Environment Variables Required

| Service | Variable | Value (Production) |
|---------|----------|-------------------|
| **Frontend** | `GOOGLE_CLIENT_ID` | `[FROM_GOOGLE_CONSOLE]` |
| **Frontend** | `GOOGLE_CLIENT_SECRET` | `[FROM_GOOGLE_CONSOLE]` |
| **Frontend** | `NEXTAUTH_URL` | `https://marketing.glowifybabystores.com` |
| **Frontend** | `NEXTAUTH_SECRET` | `[GENERATE_RANDOM_STRING]` |
| **Backend** | `CORS_ORIGIN` | `https://marketing.glowifybabystores.com` |
| **Backend** | `FRONTEND_URL` | `https://marketing.glowifybabystores.com` |

## Google Console Configuration

1. **JavaScript Origins**:
   - `https://marketing.glowifybabystores.com`
   - `http://localhost:3000` (for local dev)

2. **Redirect URIs**:
   - `https://marketing.glowifybabystores.com/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (for local dev)

## Railway Actions
- [ ] Go to Dashboard > Frontend > Variables. Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`.
- [ ] Go to Dashboard > Backend > Variables. Ensure `CORS_ORIGIN` matches Frontend URL.

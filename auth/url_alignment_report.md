# URL & Environment Alignment Report

**Target Environment**: Production (Railway)
**Domain**: `marketing.glowifybabystores.com`

## 1. Environment Variables (Railway)

| Variable | Value | Notes |
|----------|-------|-------|
| `GOOGLE_CLIENT_ID` | *[From Google Console]* | |
| `GOOGLE_CLIENT_SECRET` | *[From Google Console]* | |
| `NEXTAUTH_URL` | `https://marketing.glowifybabystores.com` | **CRITICAL**: Must match domain |
| `NEXTAUTH_SECRET` | *[Generate Random]* | `openssl rand -base64 32` |
| `NEXT_PUBLIC_API_URL` | `https://api.marketing.glowifybabystores.com` | Backend URL |
| `API_URL` | `https://api.marketing.glowifybabystores.com` | Backend Self-Reference |
| `FRONTEND_URL` | `https://marketing.glowifybabystores.com` | CORS Allowed Origin |

## 2. Google Cloud Console Settings

**Project**: Shopify Marketing AI

### OAuth 2.0 Client ID

- **Application Type**: Web Application
- **Name**: Railway Production
- **Authorized JavaScript Origins**:
  - `https://marketing.glowifybabystores.com`
- **Authorized Redirect URIs**:
  - `https://marketing.glowifybabystores.com/api/auth/callback/google`

> [!WARNING]
> Mismatched URIs are the #1 cause of `redirect_uri_mismatch` errors. Ensure NO trailing slashes unless specified.

## 3. CORS Configuration (Backend)

The backend `cors` middleware must allow:
- `https://marketing.glowifybabystores.com`

## 4. Database Schema

Migration `add_google_auth_fields` adds:
- `User.googleId` (Unique)
- `User.avatar`

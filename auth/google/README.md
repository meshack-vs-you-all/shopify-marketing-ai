# Google Authentication Setup

This module implements Google Sign-In using **NextAuth.js** (Frontend) and **Passport/Express** (Backend) patterns, unified via an Auth Service.

## Overview

- **Frontend**: Initiates sign-in via `next-auth` Google Provider.
- **Backend**: Receives user data, authenticates/creates user in Postgres via Prisma.
- **Role Management**:
  - Default Role: `USER`
  - Admin: `meshackmogire406@gmail.com` is automatically promoted to `ADMIN`.

## Configuration requirements

See `auth/url_alignment_report.md` for exact values.

### Railway Environment Variables
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `DATABASE_URL`

### Google Cloud Console
- **Authorized JavaScript Origins**: `https://marketing.glowifybabystores.com`
- **Authorized Redirect URIs**: `https://marketing.glowifybabystores.com/api/auth/callback/google`

## Bootstrap Admin

To ensure the admin user exists with the correct role, run:
```bash
railway shell
cd backend
npx tsx scripts/bootstrap-admin.ts
```

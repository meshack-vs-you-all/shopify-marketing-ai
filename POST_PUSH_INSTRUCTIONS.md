# Post-Push Checklist

## 1. Monitor Build
- Watch Railway Dashboard.
- Ensure both `backend` and `frontend` build successfully with the new Docker configurations.

## 2. Verify Google Auth
- Visit `https://marketing.glowifybabystores.com`.
- Click "Sign In with Google".
- Verify you are redirected to the Dashboard.

## 3. Configure Admin
- Once backend is running:
  ```bash
  railway shell --service backend
  npx tsx scripts/ensure-admin.ts
  ```
- This will ensure `meshackmogire406@gmail.com` has `ADMIN` role.

## 4. Troubleshooting
- If login fails with "Redirect Mismatch":
  - Check Google Console Authorized Redirect URIs.
  - Must represent: `https://marketing.glowifybabystores.com/api/auth/callback/google`

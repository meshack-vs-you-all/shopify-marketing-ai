# Environment & Secrets Strategy

> **Status:** Draft Strategy
> **Objective:** Secure, validated, and consistent environment variable management across Local, Test, and Production.

## 1. Constraint Analysis
*   **Frameworks**: Next.js (Frontend), Node.js (Backend).
*   **Hosting**: Railway (Injects vars at runtime).
*   **Docker**: Needs vars for build (Next.js public vars) and runtime (secrets).

## 2. Proposed Strategy

### A. The "Single Source of Truth" Schema
We will enforce `zod` validation for ALL environment variables in `backend/src/config/validateEnv.ts` and create a similar one for `frontend`.

### B. Variable Grouping

#### Group 1: Public / Build-Time (Next.js)
*   `NEXT_PUBLIC_API_URL`: Backend URL.
*   `NEXT_PUBLIC_SHOPIFY_APP_ID`: If needed for frontend SDKs.

#### Group 2: Runtime Secrets (Backend Only)
*   `DATABASE_URL`: Postgres connection string.
*   `REDIS_URL`: BullMQ connection.
*   `GEMINI_API_KEY`: AI Service.
*   `SHOPIFY_ACCESS_TOKEN`: Admin API.
*   `SHOPIFY_API_SECRET`: Webhook verification.
*   `JWT_SECRET`: Auth signing.

#### Group 3: Infrastructure (Docker/Host)
*   `PORT`: assigned by Railway/Host.
*   `NODE_ENV`: `production` vs `development`.

### C. Implementation Plan (Phase 0)

1.  **Strict Validation**: Update `backend/src/index.ts` to FAIL FAST if `validateEnv()` throws.
2.  **Docker Injection**:
    *   **Local**: Use `.env` file mounted or copied.
    *   **Production**: Do NOT copy `.env`. Rely on platform injection.
3.  **Validation Script**: Add `scripts/check-env.sh` that runs `validateEnv.ts` dry-run to ensure all keys are present before app boot.

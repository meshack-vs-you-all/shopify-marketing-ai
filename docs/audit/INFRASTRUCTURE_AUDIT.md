# Infrastructure & Deployment Readiness Review
**(Shopify Marketing AI Platform)**

> **Metadata**
> *   **Date:** 2026-01-06
> *   **Scope:** Full Infrastructure & Codebase Audit
> *   **Auditor Role:** Senior Platform Architect + DevOps Lead
> *   **Status:** Frozen / Immutable Reference

### 1. Executive Summary
The platform is a well-structured **MVP** built on modern technologies (Next.js 14, Node.js, Prisma, BullMQ). It functionally handles data ingestion from Shopify and text generation via Gemini. However, it is **NOT production-ready**.

Critical gaps exist in **orchestration** (the worker process for emails is never started), **secrets management** (no validation in production), and **Docker completeness** (compose file is missing the actual applications). The system is currently a "collection of services" rather than a deployable platform.

**Deployment Distance:** 2-4 weeks of focused engineering to reach a stable internal beta.

### 2. Architecture & Infrastructure Findings

*   **Core Services**:
    *   **Backend**: Node.js/Express with Prisma. Handles Auth, Shopify sync, AI proxying.
    *   **Frontend**: Next.js 14 (App Router). Good structure but heavy build times.
    *   **Worker**: BullMQ + Redis. **CRITICAL**: Defined in code (`src/workers`) and `package.json`, but **missing from Dockerfile** and **docker-compose.yml**. Emails will queue but never send.
*   **AI Integration**:
    *   **Text**: Uses Google Gemini (`gemini-flash-lite-latest`). Functional.
    *   **Images**: `generateImage` returns a placeholder string. Feature is unimplemented.
*   **Shopify Integration**:
    *   **Read-Only**: Scopes are limited to `read_products`, `read_orders`.
    *   **No Write**: Cannot push discounts or campaigns to Shopify directly yet.
*   **Secrets**:
    *   Relies entirely on `.env` files. `validateEnv.ts` exists but isn't enforced in the Docker build pipeline.

### 3. Log-Based Observations

*   **Backend (`backend.log`)**:
    *   **Logic Bug**: `Invalid prisma.user.findUnique()` in `auth.service.ts`. The `where` clause receives undefined values. This breaks login/auth.
    *   **Missing Credentials**: Multiple warnings for "Shopify credentials not configured".
*   **Frontend (`frontend.log`)**:
    *   **Port Conflicts**: Tried 3000, 3001, 3002, 3003 before settling on 3004. Indicates "zombie" processes from previous runs.
    *   **Slow Builds**: `359s` to compile root page. Suggests lack of caching or heavy dependencies.
    *   **Metadata Warnings**: `Unsupported metadata viewport` spam. Minor but noisy.

### 4. Production Readiness Scorecard

| Category | Score | Verdict | Notes |
| :--- | :---: | :--- | :--- |
| **Config & Secrets** | ❌ | **Not Ready** | Relies on local `.env`. No secret manager. No validation in Docker. |
| **AI Reliability** | ⚠️ | **Partially Ready** | Basic try/catch. No fallbacks if Gemini is down. Image gen is fake. |
| **Shopify Safety** | ✅ | **Ready** | Uses official library. Respects `shopify-api` rate limits. |
| **Data Persistence** | ⚠️ | **Partially Ready** | Postgres volume exists, but no backup/restore strategy. |
| **Observability** | ❌ | **Not Ready** | Console logs only. No structured logging (JSON) or central collector. |
| **Local Dev** | ⚠️ | **Partially Ready** | Fragile. Requires manual startup of 3-4 services. Port conflicts common. |
| **CI/CD** | ❌ | **Not Ready** | No pipeline. No automated tests running. |

### 5. Immediate Pain Points

1.  **Broken Auth**: The Prisma error in `auth.service.ts` blocks user login.
2.  **Missing Worker**: The email sending worker is never started. Campaigns will stick in "Pending" forever.
3.  **Incomplete Docker**: `docker-compose.yml` only runs DB/Redis. You cannot "up and run" the app.
4.  **Zombie Processes**: Local dev is plagued by stuck ports (3000-3004).

### 6. How Far From Deployment (Reality Check)

*   **MVP (Now)**: Unusable. Auth is broken, emails don't send.
*   **Internal Beta**: **2 weeks away**. Needs orchestration fixes, worker integration, and auth debugging.
*   **Production**: **4+ weeks away**. Needs monitoring, backups, secrets management, and rigorous testing.

**Biggest Risk**: The "Marketing AI" promise is weak. Image generation is missing, and Shopify integration is read-only. It generates text but can't "do" much yet.

### 7. Phased Action Plan

#### Phase 0 – Stabilization (Days 1-3)
*   **Goal**: Make it work locally reliably.
*   **Tasks**:
    1.  Fix `auth.service.ts` Prisma error.
    2.  Update `docker-compose.yml` to include `backend`, `frontend`, and `worker` services.
    3.  Create a `start-dev.sh` script to kill zombie ports and boot cleanly.
    4.  Verify `worker` process consumes the queue.

#### Phase 1 – MVP Enablement (Days 4-7)
*   **Goal**: End-to-end "Happy Path" (Login -> Sync -> Generate -> Send).
*   **Tasks**:
    1.  Implement "real" placeholder for image gen (or hide UI).
    2.  Add Shopify "Write" scopes (if managing discounts is needed).
    3.  Configure `nodemailer` or AWS SES for actual email delivery (currently just queued).
    4.  Add basic Health Check endpoint monitoring.

#### Phase 2 – Hardening (Weeks 2-4)
*   **Goal**: Safety and Scale.
*   **Tasks**:
    1.  Implement detailed structured logging (Winston/Pino) with correlation IDs.
    2.  Set up Redis persistence (AOF).
    3.  Add retry mechanism for OpenAI/Gemini calls.
    4.  Create CI/CD workflow (GitHub Actions).

### 8. Manual Docker Pull Commands // Infrastructure Only

```bash
# Database
docker pull postgres:15-alpine

# Cache & Queue
docker pull redis:7-alpine
```

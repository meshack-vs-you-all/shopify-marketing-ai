# Phased Execution Plan
**(Shopify Marketing AI Platform)**

> **Status:** Living Document
> **Current Phase:** Phase 0 (Stabilization)

---

## Phase 0: Stabilization & Reliability

**Objective**: Ensure the system runs reliably on a local machine, authentication works, and background workers are active. No "zombie" processes.

### Entry Criteria
- [x] Infrastructure Audit Completed
- [x] Documentation & Planning Initialized
- [x] Git Repo Clean

### Task Checklist
- [ ] **Auth Repair**: Fix `Invalid prisma.user.findUnique()` in `auth.service.ts`.
- [ ] **Orchestration**: Add `backend`, `frontend`, `worker` to `docker-compose.yml`.
- [ ] **Worker Activation**: Ensure `worker` container starts and connects to Redis.
- [ ] **Startup Script**: Create `scripts/start-dev.sh` to handle cleanup and startup.
- [ ] **Env Validation**: Enforce environment variable checks on startup.

### Verification Steps
1.  **Auth**: Login with valid credentials → Success (Token returned).
2.  **Worker**: Send a test email campaign → Log shows "Processing campaign...".
3.  **Docker**: `docker-compose up` brings up all 5 containers (db, redis, backend, frontend, worker).
4.  **Restart**: Run `start-dev.sh` twice. No port conflicts.

### Exit Criteria
- System starts with one command.
- User can log in.
- Emails are picked up by the queue (even if delivery fails due to missing SES).

---

## Phase 1: MVP Enablement (Deployment Readiness)

**Objective**: Achieve end-to-end functionality for a single user/store.

### Entry Criteria
- Phase 0 Complete.
- User Login functional.

### Task Checklist
- [ ] **Shopify Write Scopes**: Update scopes to allow creating discounts/metafields if needed.
- [ ] **Image Gen Placeholder**: Replace "NOT_SUPPORTED" string with a graceful UI fallback or stock image integration.
- [ ] **Email Delivery**: Configure `AWS SES` transport in `email.service.ts`.
- [ ] **Health Checks**: Add `/health` endpoints to all services.

### Verification Steps
1.  **Shopify**: data sync pulls products correctly.
2.  **Email**: Real email arrives in inbox (via SES Sandbox or similar).
3.  **UI**: No broken images in "Generated Content" view.

### Exit Criteria
- "Happy Path" (Login -> Sync -> AI Generate -> Send Email) works without errors.

---

## Phase 2: Hardening & Scale

**Objective**: Prepare for multi-user load and production deployment.

### Entry Criteria
- Phase 1 Complete.
- MVP functional.

### Task Checklist
- [ ] **Structured Logging**: Implement JSON logging with correlation IDs.
- [ ] **Redis Persistence**: Enable AOF/RDB in `docker-compose`.
- [ ] **Rate Limiting**: Add global rate limits for API routes.
- [ ] **CI/CD**: Create GitHub Actions for build/test.

### Verification Steps
1.  **Logs**: Logs are machine-parsable.
2.  **Recovery**: Kill Redis; data persists on restart.
3.  **Load**: System handles 10 concurrent requests without crashing.

### Exit Criteria
- Production Ready Scorecard: ✅ on all critical items.

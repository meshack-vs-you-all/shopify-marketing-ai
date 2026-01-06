# Phased Execution Plan
**(Shopify Marketing AI Platform)**

> **Status:** Living Document
> **Current Phase:** Phase 2 (Hardening & Scale)

---

## Phase 0: Stabilization & Reliability

**Objective**: Ensure the system runs reliably on a local machine, authentication works, and background workers are active. No "zombie" processes.

### Entry Criteria
- [x] Infrastructure Audit Completed
- [x] Documentation & Planning Initialized
- [x] Git Repo Clean

### Task Checklist
- [x] **Auth Repair**: Fix `Invalid prisma.user.findUnique()` in `auth.service.ts`.
- [x] **Orchestration**: Add `backend`, `frontend`, `worker` to `docker-compose.yml`.
- [x] **Worker Activation**: Ensure `worker` container starts and connects to Redis.
- [x] **Startup Script**: Create `scripts/start-dev.sh` to handle cleanup and startup.
- [ ] **Env Validation**: Enforce environment variable checks on startup. (Deferred to Phase 2)

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

### Task Checklist (Atomic Commits)
- [x] **Commit E:** Verify existing SES integration in `email.service.ts` (audit, no rewrite).
- [x] **Commit F:** Add graceful fallback for AI image generation.
- [x] **Commit G:** Add `/health` endpoints to backend services.
- [x] **Commit H:** Update Shopify scopes documentation (no code change yet).

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

### Task Checklist (Atomic Commits)
- [x] **Commit I:** Enhance logging with JSON format and correlation IDs.
- [x] **Commit J:** Enable Redis persistence (AOF) in docker-compose.
- [x] **Commit K:** Add rate limiting improvements.
- [x] **Commit L:** Create CI/CD workflow (GitHub Actions).

### Verification Steps
1.  **Logs**: Logs are machine-parsable.
2.  **Recovery**: Kill Redis; data persists on restart.
3.  **Load**: System handles 10 concurrent requests without crashing.

### Exit Criteria
- Production Ready Scorecard: ✅ on all critical items.

---

## Phase 3: Polish & Documentation (Local Testing Ready)

**Objective**: Clean up repository, validate environment setup, and ensure frictionless local development.

### Entry Criteria
- Phase 2 Complete.
- CI/CD workflow created.

### Task Checklist (Atomic Commits)
- [ ] **Commit M:** Delete redundant root .md files.
- [ ] **Commit N:** Archive historical docs.
- [ ] **Commit O:** Create consolidated SETUP.md.
- [ ] **Commit P:** Add environment validation script.
- [ ] **Commit Q:** Update README.md with current state.

### Verification Steps
1.  **Root Clean**: Only README.md and essential configs in root.
2.  **Setup Works**: New developer can follow SETUP.md.
3.  **Env Check**: `scripts/check-env.sh` validates required vars.

### Exit Criteria
- Local development is frictionless.
- Documentation is accurate and minimal.

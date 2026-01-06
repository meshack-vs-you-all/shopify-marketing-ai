# Change Groups & Commit Strategy

> **Status:** Plan
> **Phase:** 0 (Stabilization)

## Group 0: Context Restoration (WIP Recovery)
*   **Scope**: Commit existing uncommitted work found in working directory.
*   **Files**:
    *   `backend/src/workers/queues.ts` (New)
    *   `backend/src/services/email-campaign.service.ts` (Analytics logic)
    *   `frontend/src/app/settings/*` (Settings refactor)
    *   `docker-compose.yml` (Port mapping)
*   **Risk**: Low. Preserves work.
*   **Verification**: `git status` is clean.

## Group 1: Auth Logic Repair
*   **Scope**: Fix the critical Prisma error blocking login.
*   **Files**: `backend/src/services/auth.service.ts`
*   **Risk**: Low. Targeted fix.
*   **Verification**: Can log in and receive JWT.

## Group 2: Docker Orchestration
*   **Scope**: Add missing services to `docker-compose.yml` so the app actually runs.
*   **Files**: `docker-compose.yml`
*   **Risk**: Medium. Changes how the local environment boots.
*   **Verification**: `docker-compose up` starts 5 containers.

## Group 3: Worker Stabilization
*   **Scope**: Ensure worker process runs and consumes queue.
*   **Files**: `backend/src/workers/index.ts` (if needed), `backend/package.json` (check scripts).
*   **Risk**: Low. Enables background jobs.
*   **Verification**: Campaign status moves from PENDING to COMPLETED/FAILED.

## Group 4: Local Startup Hygiene
*   **Scope**: Create script to manage ports and clean start.
*   **Files**: `scripts/start-dev.sh`
*   **Risk**: None. Developer utility.
*   **Verification**: Script kills zombie processes and starts app cleanly.

## Pre-Flight Checklist
- [ ] Working tree is clean (`git status`).
- [ ] No untracked critical files.
- [ ] Current branch is correct.

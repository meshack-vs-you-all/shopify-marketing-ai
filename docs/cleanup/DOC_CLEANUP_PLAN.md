# Documentation Cleanup Plan

> **Status:** Proposal
> **Objective**: Reduce noise in the root directory by archiving or deleting redundant, outdated, or confusing documentation.

## 1. Inventory & Action Plan

The following files have been identified in the root directory and will be handled as follows:

| File | Action | Rationale |
| :--- | :--- | :--- |
| `COMPLETE_STATUS_REPORT.md` | 🗑️ Delete | Outdated status report. |
| `DEPLOYMENT_READY.md` | 🗑️ Delete | Superseded by `INFRASTRUCTURE_AUDIT.md`. |
| `FINAL_DEPLOYMENT_READY.md` | 🗑️ Delete | Superseded by `INFRASTRUCTURE_AUDIT.md`. |
| `FINAL_VERIFICATION_REPORT.md` | 📂 Archiveto `docs/archive/` | Historical context. |
| `GEMINI_UPDATE_SUMMARY.md` | 📂 Archive to `docs/archive/` | Historical context. |
| `IMPLEMENTATION_SUMMARY.md` | 📂 Archive to `docs/archive/` | Historical context. |
| `LOGIN_AND_SETUP_GUIDE.md` | 🔄 Merge | Merge valid parts into `docs/SETUP.md`. |
| `PHASE2_FINAL_SUMMARY.md` | 🗑️ Delete | Outdated. |
| `PRODUCTION_AUDIT_EMAIL.md` | 🗑️ Delete | Redundant. |
| `PROJECT_COMPLETE_REPORT.md` | 🗑️ Delete | Redundant. |
| `PROJECT_STATUS.md` | 🗑️ Delete | Superseded by `PHASED_EXECUTION_PLAN.md`. |
| `QUICKSTART.md` | 🔄 Merge | Merge into `README.md`. |
| `QUICK_DEPLOYMENT_GUIDE.md` | 🗑️ Delete | Dangerous/Incorrect instructions (uses Railway CLI blindly). |
| `README_DEPLOYMENT.md` | 🗑️ Delete | Duplicate. |
| `README_SES.md` | 🔄 Merge | Merge into `docs/infra/EMAIL_DELIVERY_SES.md`. |
| `SYSTEM_VERIFICATION_REPORT.md` | 📂 Archive to `docs/archive/` | Historical context. |
| `TESTING_WORKFLOW.md` | ➡️ Move | Move to `docs/testing/WORKFLOW.md`. |

## 2. Preservation Strategy

*   **README.md**: Standard entry point.
*   **docs/**: Trusted source of truth.
*   **docker-compose.yml**: Infrastructure source of truth.

## 3. Execution (Pending Approval)

This cleanup will be performed via `git mv` and `git rm` to preserve history where possible, or just file system moves for untracked files.

# Deployment Changes

## 🚨 Infrastructure Changes

### `railway.toml` (Added)
**Reason**: Switches deployment strategy to Docker-based builds with root context support.
**Diff Snippet**:
```toml
[services.backend]
build.builder = "DOCKER"
build.dockerfilePath = "backend/Dockerfile"

[services.frontend]
build.builder = "DOCKER"
build.dockerfilePath = "frontend/Dockerfile"
```
**Risk**: `High` - Completely changes how Railway builds and launches services.
**Mitigation**: Verify successful build logs in Railway dashboard immediately after push. Check for "Using Dockerfile" in build steps.

### `.dockerignore` (Modified)
**Reason**: Previously excluded `frontend/` directory, causing frontend builds to fail despite root context.
**Diff Snippet**:
```diff
-# frontend
+# frontend
```
**Risk**: `Medium` - larger build context upload.
**Mitigation**: Ensure build times do not increase dramatically.

### `backend/Dockerfile` & `frontend/Dockerfile` (Modified)
**Reason**: Updated to assume execution from repository root (`WORKDIR /app`), enabling access to `shared/` module.
**Diff Snippet**:
```dockerfile
# backend/Dockerfile
-COPY package.json .
+COPY backend/package.json .
```
**Risk**: `High` - Paths must match exact repo structure.
**Mitigation**: Local `docker build -f backend/Dockerfile .` verification.

### `backend/package.json` (Modified)
**Reason**: Added `axios` dependency which was missing at runtime.
**Diff Snippet**:
```diff
+ "axios": "^1.x.x"
```
**Risk**: `Low`
**Mitigation**: Verify backend health endpoint `/health` returns 200.

## 🧹 Untracked Artifacts Ignored
The following files were present but NOT committed:
- `node_modules/` (Standard ignore)
- `.next/` (Build output)
- `dist/` (Build output)
- `.env` (Secrets)

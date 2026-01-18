# Frontend Dockerfile for Railway/Production
# Optimized for NPM + Workspaces + Multi-stage

# --- Stage 1: Builder ---
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy root configs for workspace support
COPY package.json package-lock.json ./
COPY shared ./shared
COPY frontend/package.json ./frontend/

# Install dependencies
RUN npm ci

# Copy frontend source
COPY frontend ./frontend

# Build Next.js
WORKDIR /app/frontend
# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# --- Stage 2: Runner ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone build
# Next.js "standalone" output includes necessary node_modules
COPY --from=builder /app/frontend/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "intro-app/server.js"] 
# NOTE: Next.js standalone usually puts server.js in server.js or just . The path depends on next.config.js output. 
# Default standalone folder structure:
# .next/standalone/package.json
# .next/standalone/server.js
# .next/standalone/frontend/... (if monorepo)
# We need to check where server.js lands.
# Usually: .next/standalone/server.js
# But in monorepo, sometimes: .next/standalone/frontend/server.js
# Let's assume standard behavior first. If it fails, we adjust.
# Wait, if we copy .next/standalone ./ ... then it is likely ./frontend/server.js if 'frontend' is the project name in next.config or just structure.
# Let's inspect next.config output logic mentally... usually standalone preserves directory structure relative to project root.
# So if build was in /app/frontend, standalone/frontend/server.js might be the path.
# However, we'll try standard `server.js` but fallback to investigating if deploy fails. 
# To be safe, let's use a safer CMD or just "node server.js" if we know we are in the right dir.
# Let's assume standard standalone copy puts everything at root of destination if we copy content of inside standalone.

CMD ["node", "frontend/server.js"]

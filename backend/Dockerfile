# Backend Dockerfile for Railway/Production
# Optimized for NPM + Workspaces + Multi-stage

# --- Stage 1: Builder ---
FROM node:20-alpine AS builder

# Install OpenSSL (needed for Prisma on Alpine)
RUN apk add --no-cache openssl1.1-compat

WORKDIR /app

# Copy root workspace configs
COPY package.json package-lock.json ./

# Copy shared workspace
COPY shared ./shared

# Copy backend package config
COPY backend/package.json ./backend/

# Install dependencies (including devDeps for build)
# using npm ci to respect lockfile
RUN npm ci

# Copy backend source
COPY backend ./backend

# Generate Prisma Client
WORKDIR /app/backend
RUN npx prisma generate --schema=./prisma/schema.prisma

# Build TypeScript
RUN npm run build

# --- Stage 2: Runner ---
FROM node:20-alpine AS runner

# Install OpenSSL
RUN apk add --no-cache openssl1.1-compat

WORKDIR /app

ENV NODE_ENV=production

# Copy root files needed for runtime (minimal)
COPY package.json package-lock.json ./

# Copy built artifacts from builder
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/package.json ./backend/
COPY --from=builder /app/backend/prisma ./backend/prisma

# Install ONLY production dependencies
# We need to copy shared folder again because backend likely imports from it? 
# If 'shared' is a workspace, we need it.
COPY --from=builder /app/shared ./shared

# Re-install prod deps
# Note: npm ci --only=production at root might not install workspace deps correctly if strict.
# Simpler approach for reliability: Copy node_modules from builder and prune?
# Or just run npm ci --omit=dev
RUN npm ci --omit=dev

WORKDIR /app/backend

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs
USER expressjs

EXPOSE 5000

# Start command
# Note: We use shell form to run migrations then start
CMD ["sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && node dist/index.js"]

# Backend Dockerfile for Railway/Production
FROM node:20-alpine

# Install OpenSSL 1.1 compatibility (required by Prisma on Alpine)
RUN apk add --no-cache --repository=https://dl-cdn.alpinelinux.org/alpine/v3.17/community openssl1.1-compat

WORKDIR /app

# Copy shared first
COPY shared ./shared

# Setup backend
WORKDIR /app/backend
COPY backend/package.json backend/pnpm-lock.yaml ./
COPY backend/tsconfig.json ./
COPY backend/prisma ./prisma/

# Install pnpm and dependencies
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN pnpm prisma generate

# Copy source code
COPY backend/ .

# Symlink node_modules for shared folder resolution
RUN ln -s /app/backend/node_modules /app/node_modules

# Build TypeScript
RUN pnpm run build

# Expose port
EXPOSE 5000

# Start server
CMD ["npm", "start"]


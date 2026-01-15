# Backend Dockerfile for Railway/Production (Root Context)
FROM node:20-alpine

# Install OpenSSL 1.1 compatibility
RUN apk add --no-cache --repository=https://dl-cdn.alpinelinux.org/alpine/v3.17/community openssl1.1-compat

# Set working directory at repo root
WORKDIR /app

# Copy shared folder first (Valid because context is root)
COPY shared ./shared

# Setup backend
WORKDIR /app/backend
# Copy files relative to Root Context
COPY backend/package.json backend/pnpm-lock.yaml ./
COPY backend/tsconfig.json ./
COPY backend/prisma ./prisma/

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies
RUN pnpm install

# Generate Prisma client
RUN pnpm prisma generate --schema=./prisma/schema.prisma

# Copy backend source code (relative to Root)
COPY backend/ .

# Symlink node_modules for shared folder resolution
RUN ln -s /app/backend/node_modules /app/node_modules

# Build TypeScript
RUN pnpm run build

# Expose backend port
EXPOSE 5000

# Start server
CMD ["sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && npm start"]

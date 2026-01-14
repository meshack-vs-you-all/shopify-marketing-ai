# Backend Dockerfile for Railway/Production
FROM node:20-alpine

# Install OpenSSL 1.1 compatibility (required by Prisma on Alpine)
RUN apk add --no-cache --repository=https://dl-cdn.alpinelinux.org/alpine/v3.17/community openssl1.1-compat

# Set working directory
WORKDIR /app

# Copy shared folder first
COPY shared ./shared

# Copy backend package files
COPY backend/package.json backend/pnpm-lock.yaml ./backend/
COPY backend/tsconfig.json ./backend/
COPY backend/prisma ./backend/prisma/

# Install pnpm and dependencies
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app/backend
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN pnpm prisma generate

# Copy backend source code
COPY backend/ ./ 

# Symlink node_modules for shared folder resolution
RUN ln -s /app/backend/node_modules /app/node_modules

# Build TypeScript
RUN pnpm run build

# Expose server port
EXPOSE 5000

# Start server
CMD ["npm", "start"]

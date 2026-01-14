# Backend Dockerfile for Railway/Production
FROM node:20-alpine

# Install OpenSSL 1.1 compatibility (required by Prisma on Alpine)
RUN apk add --no-cache --repository=https://dl-cdn.alpinelinux.org/alpine/v3.17/community openssl1.1-compat

# Set working directory at repo root
WORKDIR /app

# Copy shared folder first
COPY shared ./shared

# Setup backend
WORKDIR /app/backend
COPY package.json pnpm-lock.yaml ./ 
COPY tsconfig.json ./
COPY prisma ./prisma/

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN pnpm prisma generate --schema=./prisma/schema.prisma

# Copy backend source code
COPY . .

# Symlink node_modules for shared folder resolution
RUN ln -s /app/backend/node_modules /app/node_modules

# Build TypeScript
RUN pnpm run build

# Expose backend port
EXPOSE 5000

# Start server and deploy Prisma migrations
CMD ["sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && npm start"]

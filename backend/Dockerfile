# Backend Dockerfile for Railway/Production
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY tsconfig.json ./
COPY prisma ./prisma/

# Install pnpm and dependencies
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN pnpm prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN pnpm run build

# Expose port
EXPOSE 5000

# Start server
CMD ["npm", "start"]


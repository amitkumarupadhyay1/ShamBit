# Simple Node.js Dockerfile for NestJS API
FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache curl openssl

# Set working directory
WORKDIR /app

# Copy package files
COPY api-nestjs/package*.json ./

# Install all dependencies (needed for build)
RUN npm install

# Copy source code
COPY api-nestjs/ .

# Generate Prisma Client (will use binaryTargets from schema.prisma)
RUN npx prisma generate

# Build the application
RUN npm run build

# Remove dev dependencies (but keep prisma for migrations)
RUN npm prune --production

# Reinstall prisma CLI for runtime (needed for migrations)
RUN npm install prisma --save-dev

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Change ownership and switch to non-root user
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose port (Railway will use its own PORT env var)
EXPOSE 3001

# Health check - use PORT env var if available, fallback to 3001
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3001}/api/v1/health || exit 1

# Start the application
CMD ["npm", "run", "start:prod"]
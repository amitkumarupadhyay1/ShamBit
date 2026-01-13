# Railway Dockerfile for subdirectory deployment
FROM node:18-alpine AS base

# Install curl for health checks
RUN apk add --no-cache curl libc6-compat

WORKDIR /app

# Copy package files from subdirectory
COPY api-nestjs/package*.json ./
COPY api-nestjs/prisma ./prisma/

# Install dependencies with legacy peer deps to handle conflicts
RUN npm ci --legacy-peer-deps && npm cache clean --force

# Copy source code
COPY api-nestjs/ ./

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Change ownership
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose port
EXPOSE 3001
ENV PORT=3001
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start command
CMD ["sh", "-c", "npm run prisma:deploy && npm run start:prod"]
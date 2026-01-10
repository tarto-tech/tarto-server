# Production Dockerfile for Tarto Server
FROM node:18-alpine AS base

# Install security updates and required packages
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init curl && \
    rm -rf /var/cache/apk/*

# Create app directory with proper permissions
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && \
    adduser -S tarto -u 1001 -G nodejs

# Copy package files
COPY package*.json ./

# Install dependencies
FROM base AS dependencies
RUN npm ci --only=production && npm cache clean --force

# Production stage
FROM base AS production
COPY --from=dependencies /app/node_modules ./node_modules
COPY --chown=tarto:nodejs . .

# Remove unnecessary files
RUN rm -rf test/ *.md .git/ .env.example

# Switch to non-root user
USER tarto

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Expose port
EXPOSE 5000

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "setup:production"]
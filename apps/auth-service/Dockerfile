# This Dockerfile expects the app to be built ALREADY (e.g., by Nx in CI)
# Context must be the project root

FROM node:20-alpine
WORKDIR /app

# Copy package.json and install production dependencies
COPY apps/auth-service/dist/package*.json ./
RUN npm ci --omit=dev

# Copy built application code
COPY apps/auth-service/dist/ ./

# Add a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs && \
    chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3008

CMD ["node", "main.js"]

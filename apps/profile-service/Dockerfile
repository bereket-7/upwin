# This Dockerfile expects the app to be built ALREADY (e.g., by Nx in CI)
# Context must be the project root

FROM node:20-alpine
WORKDIR /app

# Copy generated package.json from build output and install dependencies
COPY apps/profile-service/dist/package*.json ./
RUN npm install --omit=dev

# Copy the COMPILED shared library (not source)
COPY libs/shared/dist ./node_modules/@org/shared/

# Copy Prisma schema, engine, and configuration
COPY apps/profile-service/prisma ./prisma/
COPY apps/profile-service/prisma.config.ts ./
RUN npx prisma generate --schema=./prisma/schema.prisma

# Copy built application code
COPY apps/profile-service/dist/ ./

# Add a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs && \
    chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3009

# Run migrations and then start the application
CMD npx prisma migrate deploy --schema=./prisma/schema.prisma && node main.js

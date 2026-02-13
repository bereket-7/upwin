# This Dockerfile expects the app to be built ALREADY (e.g., by Nx in CI)
# Context must be the project root

FROM node:20-alpine
WORKDIR /app

# Copy package.json from source and install ALL dependencies
COPY apps/auth-service/package*.json ./
RUN npm install --ignore-scripts

# Copy the shared library
COPY libs/shared ./node_modules/@org/shared/

# Copy Prisma schema, engine, and configuration
COPY apps/auth-service/prisma ./prisma/
COPY apps/auth-service/prisma.config.ts ./
RUN npx prisma generate --schema=./prisma/schema.prisma

# Copy built application code
COPY apps/auth-service/dist/ ./

# Add a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs && \
    chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3008

# Run migrations and then start the application
CMD npx prisma migrate deploy --schema=./prisma/schema.prisma && node main.js

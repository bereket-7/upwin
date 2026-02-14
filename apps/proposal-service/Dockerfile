# Proposal Service Dockerfile
# Context must be the project root

FROM node:20-alpine
WORKDIR /app

# Copy package.json and install dependencies
COPY apps/proposal-service/package*.json ./
RUN npm install --ignore-scripts

# Copy Prisma schema and generate client
COPY apps/proposal-service/prisma ./prisma/
COPY apps/proposal-service/prisma.config.ts ./
RUN npx prisma generate --schema=./prisma/schema.prisma

# Copy built application code
COPY apps/proposal-service/dist/ ./

# Add non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs && \
    chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3010

# Run migrations and start the application
CMD npx prisma migrate deploy --schema=./prisma/schema.prisma && node main.js

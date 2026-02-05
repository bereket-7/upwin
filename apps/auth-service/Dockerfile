# This Dockerfile expects the app to be built ALREADY (e.g., by Nx in CI)
# Context must be the project root

# Stage 1: Install production dependencies
FROM node:20-alpine AS deps
WORKDIR /app
# We only need the package.json from the BUILT output to install runtime deps
COPY dist/apps/auth-service/package*.json ./
RUN npm ci --omit=dev

# Stage 2: Create the production image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
# Copy built application code
COPY dist/apps/auth-service .

# Add a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
USER nestjs

EXPOSE 3008

CMD ["node", "main.js"]

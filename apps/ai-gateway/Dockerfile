# Use Node.js 20 Alpine as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy generated package.json from build output and install dependencies
COPY apps/ai-gateway/dist/package*.json ./
RUN npm install --omit=dev

# Copy the built application
COPY apps/ai-gateway/dist/ ./dist/
COPY apps/ai-gateway/dist/package.json ./

# Expose port 3007
EXPOSE 3007

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3007/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start the application
CMD ["node", "dist/main.js"]

#!/bin/bash

# Qdrant Setup Script for AI Gateway Phase 2

echo "Setting up Qdrant for AI Gateway Phase 2..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Docker is not running. Please start Docker first."
    exit 1
fi

# Stop existing Qdrant container if running
echo "Stopping existing Qdrant container..."
docker stop qdrant 2>/dev/null || true
docker rm qdrant 2>/dev/null || true

# Start Qdrant
echo "Starting Qdrant..."
docker run -d \
  --name qdrant \
  -p 6333:6333 \
  -v qdrant_data:/qdrant/storage \
  qdrant/qdrant:latest

# Wait for Qdrant to be ready
echo " Waiting for Qdrant to be ready..."
sleep 5

# Check if Qdrant is running
if curl -f http://localhost:6333/collections > /dev/null 2>&1; then
    echo "Qdrant is running successfully!"
    echo "Qdrant UI: http://localhost:6333/dashboard"
    echo "API: http://localhost:6333"
else
    echo "Qdrant failed to start"
    exit 1
fi

echo ""
echo "Next steps:"
echo "1. Install Qdrant SDK: npm install @qdrant/js-sdk-rest --legacy-peer-deps"
echo "2. Start AI Gateway: npx nx serve-dev ai-gateway"
echo "3. Test endpoint: POST http://localhost:3007/api/generate-proposal"

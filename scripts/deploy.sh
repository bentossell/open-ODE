#!/bin/bash

# Deployment script for DigitalOcean
# This script handles zero-downtime deployment with health checks

set -e

echo "🚀 Starting deployment..."

# Configuration
PROJECT_DIR="/opt/open-ODE"
HEALTH_CHECK_URL="http://localhost:3000/health"
MAX_RETRIES=30
RETRY_DELAY=2

# Navigate to project directory
cd $PROJECT_DIR

# Pull latest changes
echo "📦 Pulling latest changes..."
git pull origin main

# Build Claude environment image if needed
echo "🔨 Building Claude environment image..."
docker build -f Dockerfile.claude-env -t claude-env .

# Build application with cache
echo "🏗️ Building application..."
docker compose build

# Health check function
health_check() {
    curl -f $HEALTH_CHECK_URL > /dev/null 2>&1
}

# Start new containers in background
echo "🔄 Starting new containers..."
docker compose up -d --no-deps --build app

# Wait for health check
echo "🏥 Waiting for application to be healthy..."
retry_count=0
while ! health_check; do
    retry_count=$((retry_count + 1))
    if [ $retry_count -gt $MAX_RETRIES ]; then
        echo "❌ Health check failed after $MAX_RETRIES attempts"
        echo "🔙 Rolling back..."
        docker compose down
        docker compose up -d
        exit 1
    fi
    echo "⏳ Waiting for health check... ($retry_count/$MAX_RETRIES)"
    sleep $RETRY_DELAY
done

echo "✅ Application is healthy!"

# Clean up old images
echo "🧹 Cleaning up old images..."
docker image prune -f

# Show deployment status
echo "📊 Deployment status:"
docker compose ps

echo "🎉 Deployment completed successfully!"
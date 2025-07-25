#!/bin/bash

echo "🚀 Starting Claude Web Terminal..."

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

# Check if claude-env image exists
if ! docker image inspect claude-env &> /dev/null; then
    echo "❌ claude-env Docker image not found."
    echo "Please build it first using the claude-docker-setup project."
    exit 1
fi

# Check if API key is set
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "⚠️  Warning: ANTHROPIC_API_KEY not set"
    echo "Set it with: export ANTHROPIC_API_KEY='your-key-here'"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

if [ ! -d "client/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd client && npm install && cd ..
fi

# Build frontend for production
echo "🔨 Building frontend..."
cd client && npm run build && cd ..

# Start the server
echo "✅ Starting server..."
echo "📡 Default ports: HTTP 3000, WebSocket 8081"
echo "   (Will find available ports if these are taken)"
echo ""

npm start
#!/bin/bash
# Quick non-interactive deployment for fresh droplet

DROPLET_IP="167.71.89.150"

ssh -o StrictHostKeyChecking=no root@$DROPLET_IP << 'EOF'
# Skip the slow apt upgrade and just install what we need
export DEBIAN_FRONTEND=noninteractive

echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com | sh

echo "🔧 Installing Docker Compose..."
apt-get update
apt-get install -y docker-compose-plugin git

echo "📦 Cloning repository..."
cd /opt
git clone https://github.com/bentossell/claude-web-terminal.git
cd claude-web-terminal

echo "🔐 Creating .env file..."
cat > .env << 'ENVFILE'
# Supabase Configuration
SUPABASE_JWT_SECRET=your_jwt_secret_here

# Server Configuration  
ANTHROPIC_API_KEY=your_anthropic_api_key_here
PORT=3000
WS_PORT=8081

# Session Configuration
SESSION_SECRET=your_session_secret_here

# Docker Configuration
DOCKER_HOST=unix:///var/run/docker.sock
ENVFILE

echo "🐳 Building Claude environment Docker image..."
docker build -f Dockerfile.claude-env -t openode-claude-env .

echo "🏗️ Starting application..."
docker compose up -d --build

echo "✅ Basic deployment complete!"
echo ""
echo "📋 Status:"
docker ps
echo ""
echo "⚠️  IMPORTANT: Update /opt/claude-web-terminal/.env with your actual API keys"
EOF

echo ""
echo "🎉 Deployment completed!"
echo "📍 Access your app at: http://$DROPLET_IP:3000"
echo ""
echo "Next steps:"
echo "1. SSH in: ssh root@$DROPLET_IP"
echo "2. Edit .env: nano /opt/claude-web-terminal/.env"
echo "3. Restart: cd /opt/claude-web-terminal && docker compose restart"
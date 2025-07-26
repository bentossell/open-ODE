#!/bin/bash
# Complete deployment script for fresh DigitalOcean droplet

set -e  # Exit on error

echo "🚀 Claude Web Terminal - Fresh Deployment Script"
echo "============================================="

# Check if running as root
if [[ $EUID -ne 0 ]]; then 
   echo "This script must be run as root" 
   exit 1
fi

# Get droplet IP
DROPLET_IP=$(curl -s http://169.254.169.254/metadata/v1/public-ipv4)
echo "📍 Droplet IP: $DROPLET_IP"

# Clone repository
echo "📦 Cloning repository..."
cd /opt
rm -rf claude-web-terminal
git clone https://github.com/bentossell/claude-web-terminal.git
cd claude-web-terminal

# Create .env file
echo "🔐 Setting up environment variables..."
cat > .env << 'EOF'
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
EOF

echo "⚠️  Please edit .env file with your actual values:"
echo "   nano /opt/claude-web-terminal/.env"
echo ""
read -p "Press enter after you've updated the .env file..."

# Build Claude environment image
echo "🐳 Building Claude environment Docker image..."
docker build -f Dockerfile.claude-env -t openode-claude-env .

# Build and start application
echo "🏗️ Building and starting application..."
docker compose -f docker-compose.fresh.yml down 2>/dev/null || true
docker compose -f docker-compose.fresh.yml up -d --build

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check service status
echo "✅ Checking service status..."
docker ps
echo ""

# Test endpoints
echo "🧪 Testing endpoints..."
curl -f http://localhost:3000/api/health || echo "❌ Health check failed"
echo ""

# Create systemd service
echo "🔧 Creating systemd service..."
cat > /etc/systemd/system/claude-web-terminal.service << EOF
[Unit]
Description=Claude Web Terminal
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/claude-web-terminal
ExecStart=/usr/bin/docker compose -f docker-compose.fresh.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.fresh.yml down
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable claude-web-terminal.service

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Configure your domain DNS to point to: $DROPLET_IP"
echo "2. Set up SSL certificates (optional)"
echo "3. Access your application at: http://$DROPLET_IP"
echo ""
echo "🔍 Useful commands:"
echo "   docker compose -f docker-compose.fresh.yml logs -f"
echo "   docker compose -f docker-compose.fresh.yml restart"
echo "   systemctl status claude-web-terminal"
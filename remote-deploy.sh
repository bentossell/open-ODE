#!/bin/bash
# Remote deployment script - runs on your local machine to deploy to droplet

DROPLET_IP="167.71.89.150"
echo "🚀 Deploying to droplet at $DROPLET_IP"

# Create deployment script that will run on the droplet
cat > /tmp/deploy-on-droplet.sh << 'DEPLOY_SCRIPT'
#!/bin/bash
set -e

echo "🚀 Starting deployment on droplet..."

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# Install Docker Compose
echo "🔧 Installing Docker Compose..."
apt install docker-compose-plugin -y

# Install essential tools
echo "🛠️ Installing Git, Node.js, and other tools..."
apt install git nodejs npm curl nano ufw -y

# Set up firewall
echo "🔥 Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw allow 8081/tcp
ufw --force enable

# Clone repository
echo "📦 Cloning repository..."
cd /opt
rm -rf claude-web-terminal
git clone https://github.com/bentossell/claude-web-terminal.git
cd claude-web-terminal

# Create .env file
echo "🔐 Creating .env file..."
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

# Build Claude environment image
echo "🐳 Building Claude environment Docker image..."
docker build -f Dockerfile.claude-env -t openode-claude-env .

# Use the fresh docker compose file if it exists
if [ -f docker-compose.fresh.yml ]; then
    echo "🏗️ Using fresh Docker Compose configuration..."
    docker compose -f docker-compose.fresh.yml down 2>/dev/null || true
    docker compose -f docker-compose.fresh.yml up -d --build
else
    echo "🏗️ Using standard Docker Compose configuration..."
    docker compose down 2>/dev/null || true
    docker compose up -d --build
fi

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check service status
echo "✅ Checking service status..."
docker ps

# Create systemd service
echo "🔧 Creating systemd service..."
cat > /etc/systemd/system/claude-web-terminal.service << 'SERVICE'
[Unit]
Description=Claude Web Terminal
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/claude-web-terminal
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
Restart=always

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable claude-web-terminal.service

echo "✅ Deployment complete!"
echo ""
echo "📋 IMPORTANT - Next steps:"
echo "1. Edit the .env file with your actual values:"
echo "   nano /opt/claude-web-terminal/.env"
echo ""
echo "2. After updating .env, restart the services:"
echo "   cd /opt/claude-web-terminal"
echo "   docker compose restart"
echo ""
echo "3. Access your application at:"
echo "   http://$HOSTNAME:3000"
echo ""
echo "🔍 Useful commands:"
echo "   docker logs openode-node"
echo "   docker compose logs -f"
echo "   systemctl status claude-web-terminal"
DEPLOY_SCRIPT

echo "📤 Uploading and running deployment script..."
echo "Note: You'll need to manually enter your SSH key passphrase if prompted"

# Try to connect and run the deployment
ssh -o StrictHostKeyChecking=no root@$DROPLET_IP 'bash -s' < /tmp/deploy-on-droplet.sh

echo ""
echo "🎉 Deployment script completed!"
echo "📍 Your droplet IP: $DROPLET_IP"
echo ""
echo "⚠️  IMPORTANT: You still need to:"
echo "1. SSH into the droplet: ssh root@$DROPLET_IP"
echo "2. Edit the .env file: nano /opt/claude-web-terminal/.env"
echo "3. Add your actual API keys and secrets"
echo "4. Restart services: cd /opt/claude-web-terminal && docker compose restart"
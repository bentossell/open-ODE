#!/bin/bash
# Fresh DigitalOcean Droplet Setup Script for Claude Web Terminal

echo "🚀 Starting fresh droplet setup..."

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
ufw allow 8081/tcp
ufw --force enable

# Create app directory
echo "📁 Creating application directory..."
mkdir -p /opt/claude-web-terminal
cd /opt/claude-web-terminal

echo "✅ Base setup complete!"
echo "Next steps:"
echo "1. Clone your repository"
echo "2. Set up environment variables"
echo "3. Build Docker images"
echo "4. Start the application"
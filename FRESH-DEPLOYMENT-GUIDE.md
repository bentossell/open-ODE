# 🚀 Fresh Deployment Guide - Claude Web Terminal

## Quick Start (Using DigitalOcean CLI)

### 1. Create Droplet via CLI
```bash
# Create new droplet
doctl compute droplet create claude-web-terminal \
  --region nyc3 \
  --size s-2vcpu-4gb \
  --image ubuntu-22-04-x64 \
  --ssh-keys $(doctl compute ssh-key list --format ID --no-header | head -1) \
  --wait
```

### 2. Get Droplet IP
```bash
# Get the IP address
DROPLET_IP=$(doctl compute droplet list --format Name,PublicIPv4 --no-header | grep claude-web-terminal | awk '{print $2}')
echo "Droplet IP: $DROPLET_IP"
```

### 3. SSH and Deploy
```bash
# SSH into droplet and run deployment
ssh root@$DROPLET_IP 'bash -s' < deploy-fresh.sh
```

## Complete Step-by-Step Guide

### Prerequisites
- DigitalOcean account with API token
- `doctl` CLI installed
- SSH key added to DigitalOcean

### Step 1: Install DigitalOcean CLI (if needed)
```bash
# macOS
brew install doctl

# Or download from: https://docs.digitalocean.com/reference/doctl/how-to/install/
```

### Step 2: Configure doctl
```bash
doctl auth init
# Enter your DigitalOcean API token when prompted
```

### Step 3: Create Droplet
```bash
# List available regions
doctl compute region list

# List available sizes
doctl compute size list

# Create droplet (adjust region/size as needed)
doctl compute droplet create claude-web-terminal \
  --region nyc3 \
  --size s-2vcpu-4gb \
  --image ubuntu-22-04-x64 \
  --ssh-keys $(doctl compute ssh-key list --format ID --no-header | head -1) \
  --wait
```

### Step 4: Deploy Application
```bash
# Get droplet IP
DROPLET_IP=$(doctl compute droplet list --format Name,PublicIPv4 --no-header | grep claude-web-terminal | awk '{print $2}')

# Copy deployment script to droplet
scp deploy-fresh.sh root@$DROPLET_IP:/root/

# SSH and run deployment
ssh root@$DROPLET_IP
chmod +x deploy-fresh.sh
./deploy-fresh.sh
```

### Step 5: Configure Environment
When prompted, edit the `.env` file:
```bash
nano /opt/claude-web-terminal/.env
```

Add your actual values:
```env
SUPABASE_JWT_SECRET=your_actual_jwt_secret
ANTHROPIC_API_KEY=your_actual_api_key
SESSION_SECRET=generate_random_string_here
```

## 🔧 Post-Deployment Commands

### Check Status
```bash
# View running containers
docker ps

# Check logs
docker logs claude-web-terminal

# Check service status
systemctl status claude-web-terminal
```

### Restart Services
```bash
# Restart everything
cd /opt/claude-web-terminal
docker compose -f docker-compose.fresh.yml restart

# Or use systemd
systemctl restart claude-web-terminal
```

### Update Application
```bash
cd /opt/claude-web-terminal
git pull
docker compose -f docker-compose.fresh.yml up -d --build
```

## 🚨 Troubleshooting

### If deployment fails:
```bash
# Check Docker logs
docker logs claude-web-terminal

# Check system logs
journalctl -u claude-web-terminal -f

# Restart from scratch
docker compose -f docker-compose.fresh.yml down
docker compose -f docker-compose.fresh.yml up -d --build
```

### Common Issues:
1. **Port already in use**: Kill existing processes
   ```bash
   lsof -ti:3000 | xargs kill -9
   lsof -ti:8081 | xargs kill -9
   ```

2. **Docker socket permission**: Ensure proper permissions
   ```bash
   chmod 666 /var/run/docker.sock
   ```

3. **WebSocket not connecting**: Check nginx config
   ```bash
   docker logs claude-nginx
   ```

## 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| SUPABASE_JWT_SECRET | JWT secret from Supabase dashboard | `your-jwt-secret` |
| ANTHROPIC_API_KEY | Your Anthropic API key | `sk-ant-...` |
| PORT | Main app port | `3000` |
| WS_PORT | WebSocket port | `8081` |
| SESSION_SECRET | Random secret for sessions | `random-string-here` |

## 🌐 DNS Configuration

After deployment, update your DNS:
1. Add A record pointing to droplet IP
2. For SSL, consider using Cloudflare or Let's Encrypt

## 🎉 Success!

Once deployed, access your application at:
- HTTP: `http://YOUR_DROPLET_IP`
- With domain: `http://your-domain.com`
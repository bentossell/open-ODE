# Deploy to DigitalOcean - Step by Step Guide

## What You'll Need
- DigitalOcean account
- Your domain (openode.ai) pointed to Cloudflare
- Credit card for DigitalOcean billing

## Step 1: Create a DigitalOcean Droplet

1. **Log into DigitalOcean**
   - Go to https://cloud.digitalocean.com/

2. **Click "Create" → "Droplets"**

3. **Choose these settings:**
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic
   - **CPU options**: Regular (Intel/AMD)
   - **Size**: At least 2GB RAM ($12/month) - 4GB RAM ($24/month) recommended
   - **Region**: Choose closest to your users (e.g., NYC, San Francisco)
   - **Authentication**: SSH keys (recommended) or Password
   - **Hostname**: `openode-ai`

4. **Click "Create Droplet"**
   - Wait 1-2 minutes for creation

## Step 2: Connect to Your Droplet

1. **Copy your droplet's IP address** from DigitalOcean dashboard

2. **Open your terminal and connect:**
   ```bash
   ssh root@YOUR_DROPLET_IP
   ```
   
   If you used password auth, enter your password when prompted.

## Step 3: Install Required Software

Copy and paste these commands one by one:

1. **Update system:**
   ```bash
   apt update && apt upgrade -y
   ```

2. **Install Docker:**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```

3. **Install Docker Compose:**
   ```bash
   apt install docker-compose-plugin -y
   ```

4. **Install Git and Node.js:**
   ```bash
   apt install git nodejs npm -y
   ```

## Step 4: Clone Your Repository

1. **Clone the repo:**
   ```bash
   cd /opt
   git clone https://github.com/bentossell/open-ODE.git
   cd open-ODE
   ```

## Step 5: Set Up Environment Variables

1. **Copy the example env file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit the .env file:**
   ```bash
   nano .env
   ```

3. **Add your actual values:**
   ```
   # Supabase Configuration
   SUPABASE_JWT_SECRET=your_actual_jwt_secret_from_supabase
   
   # Server Configuration
   ANTHROPIC_API_KEY=your_actual_anthropic_api_key
   PORT=3000
   WS_PORT=8081
   
   # Session Configuration
   SESSION_SECRET=generate_a_random_string_here
   ```
   
   Press `Ctrl+X`, then `Y`, then `Enter` to save.

## Step 6: Build Docker Images

1. **Build the Claude environment image:**
   ```bash
   cd /opt
   git clone https://github.com/bentossell/claude-docker-setup.git
   cd claude-docker-setup
   docker build -t claude-env .
   ```

2. **Go back to the main project:**
   ```bash
   cd /opt/open-ODE
   ```

## Step 7: Update WebSocket Configuration

1. **Edit the WebSocket context:**
   ```bash
   nano client/src/contexts/WebSocketContext.tsx
   ```

2. **Find this line (around line 77):**
   ```javascript
   const ws = new WebSocket(`ws://localhost:${configRes.wsPort}`);
   ```

3. **Replace with:**
   ```javascript
   const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
   const wsHost = process.env.NODE_ENV === 'production' ? window.location.host : 'localhost';
   const ws = new WebSocket(`${wsProtocol}//${wsHost}:${configRes.wsPort}`);
   ```

4. **Save the file** (Ctrl+X, Y, Enter)

## Step 8: Start the Application

1. **Start with Docker Compose:**
   ```bash
   docker compose up -d
   ```

2. **Check if it's running:**
   ```bash
   docker compose ps
   ```

## Step 9: Set Up Caddy (Web Server with Auto-SSL)

1. **Install Caddy:**
   ```bash
   apt install -y debian-keyring debian-archive-keyring apt-transport-https
   curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
   curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
   apt update
   apt install caddy
   ```

2. **Configure Caddy:**
   ```bash
   nano /etc/caddy/Caddyfile
   ```

3. **Add this configuration:**
   ```
   openode.ai, www.openode.ai {
       reverse_proxy localhost:3000
       
       @websockets {
           header Connection *Upgrade*
           header Upgrade websocket
       }
       reverse_proxy @websockets localhost:8081
   }
   ```

4. **Restart Caddy:**
   ```bash
   systemctl restart caddy
   ```

## Step 10: Configure Your Domain

1. **In Cloudflare dashboard:**
   - Go to DNS settings for openode.ai
   - Add an A record:
     - Name: `@`
     - Value: `YOUR_DROPLET_IP`
   - Add another A record:
     - Name: `www`
     - Value: `YOUR_DROPLET_IP`
   - Set Proxy status: DNS only (gray cloud)

## Step 11: Test Your Deployment

1. **Visit your domain:**
   - https://openode.ai
   - You should see the login page

2. **Check logs if needed:**
   ```bash
   docker compose logs -f
   ```

## Step 12: Set Up Auto-restart

1. **Create systemd service:**
   ```bash
   nano /etc/systemd/system/openode.service
   ```

2. **Add this content:**
   ```
   [Unit]
   Description=OpenODE Web Terminal
   After=docker.service
   Requires=docker.service
   
   [Service]
   Type=oneshot
   RemainAfterExit=yes
   WorkingDirectory=/opt/open-ODE
   ExecStart=/usr/bin/docker compose up -d
   ExecStop=/usr/bin/docker compose down
   
   [Install]
   WantedBy=multi-user.target
   ```

3. **Enable auto-start:**
   ```bash
   systemctl enable openode.service
   ```

## Troubleshooting

If something doesn't work:

1. **Check Docker logs:**
   ```bash
   docker compose logs
   ```

2. **Check Caddy logs:**
   ```bash
   journalctl -u caddy -f
   ```

3. **Restart everything:**
   ```bash
   docker compose down
   docker compose up -d
   systemctl restart caddy
   ```

## You're Done! 🎉

Your Claude Web Terminal should now be running at https://openode.ai
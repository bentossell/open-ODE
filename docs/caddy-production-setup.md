# Caddy Production Setup Guide

This guide covers the new Caddy-based production architecture for OpenODE, designed for better Cloudflare compatibility and simplified WebSocket handling.

## Architecture Overview

```
Internet → Cloudflare (port 443) → Droplet
                                       ↓
                              Caddy (SSL/Reverse Proxy)
                                       ↓
                              Node.js (port 3000)
                              HTTP & WebSocket on same port
                                       ↓
                              Docker Containers (Claude sessions)
```

## Key Benefits

1. **Cloudflare Compatible**: WebSocket works through Cloudflare's proxy
2. **Single Port**: HTTP and WebSocket share port 3000 (no more 8081)
3. **Automatic SSL**: Caddy handles certificate management
4. **Production Ready**: Health checks, keepalive, proper headers

## Setup Instructions

### 1. Prerequisites

- DigitalOcean droplet with Docker installed
- Domain pointed to droplet via Cloudflare
- Environment variables configured

### 2. Deploy with Docker Compose

```bash
# SSH into your droplet
ssh root@your-droplet-ip

# Clone or update the repository
cd /root/openode
git pull origin main

# Set production environment
export NODE_ENV=production

# Stop existing containers
docker-compose down

# Build and start with Caddy
docker-compose up -d --build

# Check logs
docker-compose logs -f
```

### 3. Verify Deployment

```bash
# Check containers are running
docker ps

# Test health endpoint
curl http://localhost:3000/api/health

# Check Caddy is serving SSL
curl https://openode.ai/api/health
```

## Configuration Details

### Caddyfile

The Caddyfile handles:
- SSL certificate management
- WebSocket upgrade headers
- Security headers
- Gzip compression

Key configuration:
```caddyfile
# WebSocket reverse proxy
reverse_proxy /ws* node:3000 {
    header_up Connection {>Connection}
    header_up Upgrade {>Upgrade}
}
```

### Docker Compose

Services:
- **caddy**: Reverse proxy on ports 80/443
- **node**: Application server (internal port 3000)

Networks:
- **openode-network**: Internal bridge network

### Node.js Server

Changes for production:
- Removed WS_PORT environment variable
- WebSocket uses HTTP upgrade on same port
- Added keepalive ping/pong (30-second interval)
- Cloudflare-compatible timeouts (65 seconds)

## Environment Variables

```bash
# .env file
NODE_ENV=production
PORT=3000
ANTHROPIC_API_KEY=your-key
SUPABASE_JWT_SECRET=your-secret
SESSION_SECRET=your-session-secret
```

## Monitoring

### Health Checks

```bash
# API health
curl http://localhost:3000/api/health

# WebSocket test
wscat -c wss://openode.ai/ws
```

### Logs

```bash
# All services
docker-compose logs -f

# Just Node.js
docker-compose logs -f node

# Just Caddy
docker-compose logs -f caddy
```

## Troubleshooting

### WebSocket Connection Issues

1. **Check Cloudflare settings**:
   - Ensure WebSocket support is enabled
   - Orange cloud (proxy) should be on

2. **Verify headers**:
   ```bash
   curl -I https://openode.ai/ws \
     -H "Connection: Upgrade" \
     -H "Upgrade: websocket"
   ```

3. **Check container networking**:
   ```bash
   docker network inspect openode_openode-network
   ```

### SSL Certificate Issues

Caddy automatically obtains certificates. If issues:

```bash
# Check Caddy logs
docker-compose logs caddy | grep -i cert

# Restart Caddy to retry
docker-compose restart caddy
```

### Performance Tuning

1. **Container limits** (in docker-compose.yml):
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '2'
         memory: 4G
   ```

2. **Node.js memory**:
   ```yaml
   environment:
     - NODE_OPTIONS=--max-old-space-size=3072
   ```

## Maintenance

### Updates

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

### Backups

```bash
# Backup Caddy data
docker run --rm -v openode_caddy_data:/data \
  -v $(pwd):/backup alpine \
  tar czf /backup/caddy-data-$(date +%Y%m%d).tar.gz -C / data
```

### Scaling

For multiple instances, use Docker Swarm or Kubernetes with sticky sessions for WebSocket connections.

## Security Considerations

1. **Firewall**: Only expose ports 80/443
2. **Updates**: Keep Docker and dependencies updated
3. **Monitoring**: Set up alerts for health check failures
4. **Backups**: Regular backups of Caddy certificates

## Migration from Old Architecture

If migrating from nginx/separate WebSocket port:

1. Update DNS to point to new server (if different)
2. Deploy new docker-compose.yml
3. Test thoroughly before switching DNS
4. Monitor logs during transition

The new architecture simplifies deployment and improves reliability with Cloudflare.
# Production Deployment Updates

This document covers the production fixes and updates made during the initial deployment to DigitalOcean.

## Changes Made

### 1. Claude Environment Docker Image

Created `Dockerfile.claude-env` to build the Claude Code environment:
- Uses Ubuntu base image
- Installs Node.js and npm
- Installs the official Claude Code CLI: `@anthropic-ai/claude-code`
- Sets up workspace directory

Build command:
```bash
docker build -f Dockerfile.claude-env -t claude-env .
```

### 2. WebSocket Configuration for Production

Updated `client/src/contexts/WebSocketContext.tsx` to automatically use:
- `wss://` protocol with the current domain in production
- `ws://localhost:8081` in development

This allows the WebSocket to work through Caddy's SSL proxy without hardcoding URLs.

### 3. Claude Command Path

Fixed the Claude command path in `server.js`:
- Changed from `/root/.npm-global/bin/claude` to just `claude`
- The Claude Code CLI is now in PATH after global npm install

### 4. Environment Variables

Production requires these client-side environment variables in `client/.env`:
```
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

Server-side `.env`:
```
SUPABASE_JWT_SECRET=your-jwt-secret
ANTHROPIC_API_KEY=your-api-key
SESSION_SECRET=random-string
```

## Deployment Architecture

```
Internet → Cloudflare DNS → DigitalOcean Droplet
                                    ↓
                              Caddy (SSL/Proxy)
                              ↙            ↘
                        Port 3000      Port 8081
                        (HTTP API)    (WebSocket)
                            ↓              ↓
                      Docker Container (App)
                            ↓
                    Docker-in-Docker (Claude Sessions)
```

## Key Learnings

1. **NPM Package Names**: The Claude Code CLI is `@anthropic-ai/claude-code`, not `claude-code`
2. **WebSocket Proxying**: Use Caddy to handle SSL, don't connect directly to WebSocket port
3. **Environment Variables**: React apps need `REACT_APP_` prefix for env vars
4. **Docker PATH**: Global npm installs are available in PATH, no need for full paths
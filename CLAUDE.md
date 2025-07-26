# Claude Web Terminal - Technical Documentation

## 🎯 Project Overview
A web-based terminal interface for Claude Code that enables browser-based AI coding assistance with real-time streaming, Docker containerization, and secure authentication.

## 📊 Current Status
- **Version**: 2.1.0
- **Last Updated**: 2025-07-26
- **Production URL**: http://167.71.89.150:3000
- **Status**: Deployed on DigitalOcean with automated CI/CD

## 🏗️ Architecture Overview

### System Architecture
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React Client  │────▶│  Express Server │────▶│ Docker Container│
│   (TypeScript)  │     │   (WebSocket)   │     │  (Claude Env)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                        │                        │
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Supabase     │     │      Caddy      │     │    node-pty     │
│  (Auth + JWT)   │     │ (Reverse Proxy) │     │   (Terminal)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Project Structure
```
claude-web-terminal/
├── .github/workflows/      # GitHub Actions CI/CD
│   ├── ci.yml             # Build and test pipeline
│   ├── deploy.yml         # Simple deployment
│   └── deploy-advanced.yml # Advanced deployment with backups
├── client/                 # React frontend application
│   ├── src/
│   │   ├── App.tsx        # Main app component with routing
│   │   ├── OpenTerminal.tsx # Terminal UI component
│   │   ├── components/
│   │   │   └── Auth.tsx   # Supabase authentication UI
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx      # Authentication state
│   │   │   └── WebSocketContext.tsx # WebSocket management
│   │   └── lib/
│   │       └── supabase.ts # Supabase client configuration
│   ├── public/            # Static assets
│   └── package.json       # Frontend dependencies
├── database/              # Database schemas and migrations
├── docs/                  # Documentation
├── supabase/              # Supabase configuration files
├── server.js              # Express server with WebSocket
├── Dockerfile             # Main application container
├── Dockerfile.claude-env  # Claude environment container
├── Dockerfile.simple      # Simplified production build
├── docker-compose.yml     # Production compose config
├── docker-compose.fresh.yml # Fresh deployment config
├── package.json           # Backend dependencies
├── .env                   # Server environment variables
└── CLAUDE.md             # This file
```

## 🔧 Technical Stack

### Backend
- **Runtime**: Node.js 18 with Express.js
- **WebSocket**: ws library for real-time communication
- **Authentication**: JWT verification with jsonwebtoken
- **Container Management**: dockerode for Docker API
- **Terminal Emulation**: node-pty for pseudo-terminals
- **Process Management**: PM2 (optional for production)

### Frontend
- **Framework**: React 19 with TypeScript
- **Terminal**: xterm.js with custom light theme
- **Styling**: Tailwind CSS with custom components
- **Icons**: Lucide React for UI icons
- **State Management**: React Context API
- **Authentication**: Supabase Auth UI React
- **WebSocket Client**: Native WebSocket with reconnection logic

### Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose
- **Reverse Proxy**: Caddy for SSL and routing
- **Deployment**: DigitalOcean Droplet (Ubuntu 22.04)
- **CI/CD**: GitHub Actions for automated deployment
- **Monitoring**: Health checks and container logs

## 📝 How It Works

### 1. Authentication Flow
```javascript
User Login → Supabase Auth → JWT Token → Store in Context
                ↓
        WebSocket Connection
                ↓
    Server JWT Verification → Authorized Session
```

**Implementation Details:**
- User authenticates via Supabase (email/password or magic link)
- Frontend receives JWT token and user metadata
- Token stored in AuthContext for app-wide access
- WebSocket connection includes token in connection params
- Server verifies token using SUPABASE_JWT_SECRET
- Invalid tokens result in connection rejection

### 2. WebSocket Communication Protocol

**Client → Server Messages:**
```javascript
// Start new Claude session
{
  type: 'start',
  sessionId: 'unique-session-id'
}

// Send input to terminal
{
  type: 'input',
  data: 'user command or text'
}

// Resize terminal
{
  type: 'resize',
  cols: 80,
  rows: 24
}

// End session
{
  type: 'stop'
}
```

**Server → Client Messages:**
```javascript
// Terminal output
{
  type: 'output',
  data: 'terminal response'
}

// Session status
{
  type: 'status',
  status: 'ready' | 'error' | 'ended'
}

// Error messages
{
  type: 'error',
  message: 'Error description'
}
```

### 3. Docker Container Lifecycle

**Session Creation:**
1. User clicks "Start Session"
2. Server creates unique session ID
3. Docker container spawned with:
   - Image: `openode-claude-env`
   - Memory limit: 2GB
   - CPU limit: 1 core
   - Isolated network
   - Volume mounts for workspace

**Container Management:**
```javascript
// Container creation in server.js
const container = await docker.createContainer({
  Image: 'openode-claude-env',
  Cmd: ['/bin/bash'],
  Tty: true,
  OpenStdin: true,
  StdinOnce: false,
  HostConfig: {
    Memory: 2147483648,  // 2GB
    CpuShares: 1024,     // 1 CPU
    AutoRemove: true
  }
});
```

### 4. Terminal Emulation

**PTY (Pseudo-Terminal) Setup:**
- node-pty creates virtual terminal inside container
- Handles ANSI escape sequences
- Manages terminal size and resize events
- Bidirectional stream between WebSocket and container

**Data Flow:**
```
xterm.js → WebSocket → Express → node-pty → Docker → Claude
    ↑                                                    ↓
    └────────────────────────────────────────────────────┘
```

## 🚀 Deployment Architecture

### Production Environment
- **Host**: DigitalOcean Droplet (s-2vcpu-4gb)
- **IP**: 167.71.89.150
- **OS**: Ubuntu 22.04 LTS
- **Docker**: Latest stable version
- **Compose**: v2 with production optimizations

### Container Setup
```yaml
# Production containers
1. openode-node     - Main application (port 3000, 8081)
2. caddy            - Reverse proxy (port 80, 443)
3. claude-sessions  - Dynamic Claude containers
```

### Automated Deployment
**GitHub Actions Workflow:**
1. Push to main branch triggers deployment
2. SSH into droplet using stored private key
3. Pull latest code from GitHub
4. Backup existing environment files
5. Rebuild Docker images
6. Run health checks
7. Report deployment status

## 🔐 Security Considerations

### Authentication & Authorization
- JWT tokens expire after 1 hour
- Tokens verified on every WebSocket connection
- User sessions isolated in separate containers
- No shared state between user sessions

### Network Security
- Containers on isolated Docker network
- No direct container internet access
- All traffic proxied through Caddy
- SSH access limited to deployment key

### Data Protection
- Environment variables never committed
- Secrets stored in GitHub Secrets
- Container volumes ephemeral
- No persistent user data on disk

## 📊 Performance Optimization

### Frontend
- React production build with minification
- Code splitting for optimal loading
- WebSocket reconnection with exponential backoff
- Efficient terminal rendering with xterm.js

### Backend
- Connection pooling for Docker API
- Stream-based data transfer
- Graceful shutdown handling
- Health check endpoints for monitoring

### Infrastructure
- Multi-stage Docker builds
- Layer caching for faster builds
- Container resource limits
- Automatic container cleanup

## 🛠️ Development Workflow

### Local Development
```bash
# Install dependencies
npm install
cd client && npm install

# Start backend (port 3000)
npm run dev

# Start frontend (port 3000, proxies to backend)
cd client && npm start
```

### Testing
```bash
# Run linting
npm run lint
cd client && npm run lint

# Build production
cd client && npm run build

# Test Docker build
docker build -t test-app .
```

### Deployment
```bash
# Manual deployment
git push origin main  # Triggers GitHub Actions

# Or SSH directly
ssh root@167.71.89.150
cd /opt/claude-web-terminal
git pull && docker-compose up -d --build
```

## 🐛 Debugging & Monitoring

### Health Checks
```bash
# API health
curl http://167.71.89.150:3000/api/health

# Container status
docker ps
docker logs openode-node

# WebSocket test
wscat -c ws://167.71.89.150:3000/ws
```

### Common Issues
1. **WebSocket Connection Failed**
   - Check JWT token validity
   - Verify CORS settings
   - Check firewall rules

2. **Container Spawn Failed**
   - Verify Docker daemon running
   - Check available system resources
   - Review Docker image availability

3. **Authentication Issues**
   - Verify Supabase credentials
   - Check JWT secret matches
   - Review token expiration

## 📈 Future Enhancements

### Planned Features
- [ ] Session persistence and history
- [ ] File upload/download in terminal
- [ ] Multi-user collaboration
- [ ] Custom Claude configurations
- [ ] Usage analytics and limits
- [ ] Terminal themes and customization

### Technical Improvements
- [ ] Kubernetes deployment option
- [ ] Horizontal scaling support
- [ ] Redis for session management
- [ ] WebRTC for lower latency
- [ ] Progressive Web App (PWA)

## 🔄 Recent Updates
- [x] Automated GitHub Actions deployment
- [x] Production deployment to DigitalOcean
- [x] Simplified Docker configuration
- [x] Health monitoring and checks
- [x] Comprehensive documentation
- [x] WebSocket authentication with JWT
- [x] Terminal UI with OpenInterface design

## 📞 Support & Contributing
- **Issues**: GitHub Issues for bug reports
- **Deployment**: Check GitHub Actions logs
- **Monitoring**: Docker logs and health endpoints
- **Documentation**: This file and /docs directory

---
*This documentation is maintained alongside the codebase. For setup instructions, see README.md*
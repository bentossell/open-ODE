# Claude Web Terminal - Complete Technical Documentation

## 🎯 Project Overview
A production-ready web-based terminal interface for Claude Code that enables browser-based AI coding assistance with real-time streaming, Docker containerization, secure authentication, and automated CI/CD deployment.

## 📊 Current Status
- **Version**: 2.2.0
- **Last Updated**: 2025-07-26
- **Production URL**: http://167.71.89.150:3000
- **Repository**: https://github.com/bentossell/open-ODE
- **Status**: ✅ Fully deployed with automated CI/CD pipeline

## 🚀 Quick Access
- **Live Application**: http://167.71.89.150:3000
- **GitHub Actions**: https://github.com/bentossell/open-ODE/actions
- **DigitalOcean Droplet**: 167.71.89.150 (Ubuntu 22.04, 2vCPU, 4GB RAM)

## 🏗️ Complete Architecture

### System Architecture
```
┌─────────────────────────────────────────────────────────────────────┐
│                          GitHub Repository                           │
│                    https://github.com/bentossell/open-ODE           │
└───────────────────────┬─────────────────────────────────────────────┘
                        │ Push to main
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       GitHub Actions CI/CD                           │
│  • CI Build & Test  • Deploy to DigitalOcean  • Advanced Deploy    │
└───────────────────────┬─────────────────────────────────────────────┘
                        │ SSH Deploy
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    DigitalOcean Droplet (167.71.89.150)            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│  │   Caddy Proxy   │─▶│  Express Server │─▶│ Docker Sessions │   │
│  │  (Port 80/443)  │  │  (Port 3000)    │  │  (Claude Env)   │   │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         User Browser                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│  │   React App     │  │   WebSocket     │  │    Supabase     │   │
│  │  (TypeScript)   │  │  (Port 3000)    │  │  (Auth + JWT)   │   │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Complete Project Structure
```
claude-web-terminal/
├── .github/
│   └── workflows/              # GitHub Actions CI/CD
│       ├── ci.yml             # Build, test, and validate
│       ├── deploy.yml         # Simple automated deployment
│       ├── deploy-advanced.yml # Advanced deployment with backups
│       └── test-ssh.yml       # SSH connection testing
├── client/                     # React Frontend Application
│   ├── src/
│   │   ├── App.tsx            # Main app with routing
│   │   ├── index.tsx          # React entry point
│   │   ├── OpenTerminal.tsx   # Terminal UI component
│   │   ├── components/
│   │   │   ├── Auth.tsx       # Supabase authentication
│   │   │   └── Terminal/      # Terminal components
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx      # Global auth state
│   │   │   └── WebSocketContext.tsx # WebSocket management
│   │   ├── lib/
│   │   │   └── supabase.ts    # Supabase client setup
│   │   └── styles/
│   │       └── index.css      # Tailwind CSS styles
│   ├── public/                # Static assets
│   ├── .env                   # Client environment variables
│   └── package.json           # Frontend dependencies
├── database/                   # Database schemas
│   └── schema.sql             # Supabase table definitions
├── docs/                       # Documentation
│   ├── GITHUB_ACTIONS_SETUP.md # CI/CD setup guide
│   ├── DEPLOYMENT.md          # Deployment instructions
│   └── auto-deploy-guide.md   # Automation guide
├── supabase/                   # Supabase configuration
│   └── config.toml            # Supabase project config
├── server.js                   # Express + WebSocket server
├── Dockerfile                  # Main application image
├── Dockerfile.claude-env       # Claude environment image
├── Dockerfile.simple          # Simplified production build
├── docker-compose.yml         # Production orchestration
├── docker-compose.fresh.yml   # Fresh deployment config
├── nginx.conf                 # Nginx configuration
├── package.json               # Backend dependencies
├── .env                       # Server environment variables
├── .dockerignore             # Docker build exclusions
├── .gitignore                # Git exclusions
├── README.md                 # User setup guide
└── CLAUDE.md                 # This documentation
```

## 🔧 Complete Technical Stack

### Backend Technologies
- **Runtime**: Node.js 18 LTS with Express.js 4.x
- **WebSocket**: ws library for bidirectional real-time communication
- **Authentication**: jsonwebtoken for JWT verification
- **Container Management**: dockerode for Docker API integration
- **Terminal Emulation**: node-pty for pseudo-terminal creation
- **Session Management**: In-memory session store
- **Security**: CORS, helmet, rate limiting

### Frontend Technologies
- **Framework**: React 19 with TypeScript 5.x
- **Build Tool**: Create React App with Craco
- **Terminal UI**: xterm.js with custom light theme
- **Styling**: Tailwind CSS 3.x with custom components
- **Icons**: Lucide React for consistent iconography
- **State Management**: React Context API + useReducer
- **Authentication UI**: Supabase Auth UI React
- **WebSocket Client**: Native WebSocket API with reconnection
- **Code Highlighting**: Prism.js for syntax highlighting

### Infrastructure & DevOps
- **Containerization**: Docker 24.x with multi-stage builds
- **Orchestration**: Docker Compose v2
- **Reverse Proxy**: Caddy 2.x for automatic HTTPS
- **Cloud Provider**: DigitalOcean Droplet
- **OS**: Ubuntu 22.04 LTS
- **CI/CD**: GitHub Actions with matrix builds
- **Monitoring**: Health endpoints + Docker logs
- **Secrets Management**: GitHub Secrets + .env files

### Third-Party Services
- **Authentication**: Supabase (PostgreSQL + Auth)
- **DNS**: DigitalOcean DNS
- **Container Registry**: Docker Hub
- **Version Control**: GitHub
- **API**: Anthropic Claude API

## 📝 Detailed Implementation

### 1. Authentication System

**Complete Auth Flow:**
```
1. User Registration/Login
   ├── Email/Password via Supabase
   ├── Magic Link authentication
   └── OAuth providers (configurable)
           ↓
2. Supabase Response
   ├── JWT access token
   ├── Refresh token
   └── User metadata
           ↓
3. Client Storage
   ├── Token in AuthContext
   ├── User data in state
   └── Automatic refresh handling
           ↓
4. WebSocket Authentication
   ├── Token sent in connection params
   ├── Server-side JWT verification
   └── Connection approval/rejection
```

**Implementation Details:**
```javascript
// Client: lib/supabase.ts
export const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

// Server: JWT Verification
const jwt = require('jsonwebtoken');
const token = getTokenFromRequest(request);
const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);
```

### 2. WebSocket Protocol

**Message Types and Formats:**

```javascript
// Client → Server Messages
{
  type: 'start',
  sessionId: string,      // Unique session identifier
  config?: {              // Optional configuration
    theme?: 'light' | 'dark',
    fontSize?: number,
    shell?: string
  }
}

{
  type: 'input',
  data: string,           // User input/commands
  sessionId: string
}

{
  type: 'resize',
  cols: number,           // Terminal columns
  rows: number,           // Terminal rows
  sessionId: string
}

{
  type: 'stop',
  sessionId: string,
  reason?: string         // Optional termination reason
}

// Server → Client Messages
{
  type: 'output',
  data: string,           // Terminal output
  sessionId: string
}

{
  type: 'status',
  status: 'initializing' | 'ready' | 'busy' | 'error' | 'terminated',
  sessionId: string,
  message?: string
}

{
  type: 'error',
  code: string,           // Error code for handling
  message: string,        // Human-readable error
  recoverable: boolean,   // Whether reconnection should be attempted
  sessionId: string
}
```

### 3. Docker Container Management

**Container Lifecycle:**

```javascript
// Container Creation
const container = await docker.createContainer({
  Image: 'openode-claude-env',
  name: `claude-session-${sessionId}`,
  Cmd: ['/bin/bash', '-l'],
  Tty: true,
  OpenStdin: true,
  StdinOnce: false,
  WorkingDir: '/workspace',
  Env: [
    `SESSION_ID=${sessionId}`,
    `USER_ID=${userId}`,
    'TERM=xterm-256color'
  ],
  HostConfig: {
    Memory: 2 * 1024 * 1024 * 1024,     // 2GB RAM limit
    MemorySwap: 2 * 1024 * 1024 * 1024, // No swap
    CpuShares: 1024,                     // 1 CPU share
    CpuQuota: 100000,                    // 100% of 1 CPU
    AutoRemove: true,                    // Cleanup on exit
    NetworkMode: 'bridge',               // Isolated network
    SecurityOpt: ['no-new-privileges'],  // Security hardening
    ReadonlyRootfs: false,               // Allow writes
    CapDrop: ['ALL'],                    // Drop all capabilities
    CapAdd: ['CHOWN', 'SETUID', 'SETGID'] // Min required
  },
  Labels: {
    'app': 'claude-web-terminal',
    'user': userId,
    'session': sessionId,
    'created': new Date().toISOString()
  }
});

// Container Monitoring
container.stats((err, stream) => {
  // Monitor CPU, memory, network usage
});

// Automatic Cleanup
setTimeout(() => {
  container.kill();
}, SESSION_TIMEOUT);
```

### 4. Terminal Emulation Details

**PTY Configuration:**
```javascript
const pty = require('node-pty');

const ptyProcess = pty.spawn('docker', ['exec', '-it', containerId, '/bin/bash'], {
  name: 'xterm-256color',
  cols: 80,
  rows: 24,
  cwd: process.env.HOME,
  env: {
    ...process.env,
    TERM: 'xterm-256color',
    COLORTERM: 'truecolor'
  }
});

// Bidirectional streaming
ptyProcess.on('data', (data) => {
  ws.send(JSON.stringify({ type: 'output', data }));
});

ws.on('message', (msg) => {
  const { type, data } = JSON.parse(msg);
  if (type === 'input') {
    ptyProcess.write(data);
  }
});
```

## 🚀 Production Deployment

### Current Infrastructure

**DigitalOcean Droplet Specifications:**
- **Type**: s-2vcpu-4gb
- **Region**: NYC3
- **OS**: Ubuntu 22.04 (LTS) x64
- **Storage**: 80GB SSD
- **Network**: 4TB transfer
- **IP**: 167.71.89.150
- **SSH Key**: ED25519 (github-actions-deploy)

**Running Services:**
```bash
# Docker Containers
1. openode-node          # Main application
   - Port 3000 (HTTP)
   - Port 8081 (WebSocket)
   - Memory: 512MB limit
   - CPU: 0.5 cores

2. claude-web-terminal-caddy-1  # Reverse proxy
   - Port 80 (HTTP)
   - Port 443 (HTTPS)
   - Auto-SSL via Let's Encrypt

3. openode-claude-env    # Base image for sessions
   - Claude Code environment
   - Development tools
   - 1.3GB image size
```

### Automated CI/CD Pipeline

**GitHub Actions Workflows:**

1. **CI - Build and Test** (`ci.yml`)
   - Triggers: Every push and PR to main
   - Steps:
     - Checkout code
     - Setup Node.js 18
     - Install dependencies
     - Run linters
     - Build frontend
     - Build Docker images
     - Run health checks
   - Duration: ~3-5 minutes

2. **Deploy to DigitalOcean** (`deploy.yml`)
   - Triggers: Push to main branch
   - Steps:
     - SSH to droplet
     - Pull latest code
     - Rebuild containers
     - Health verification
   - Duration: ~2-3 minutes

3. **Advanced Deploy** (`deploy-advanced.yml`)
   - Triggers: Push to main or manual
   - Features:
     - Environment backups
     - Secret updates
     - Rollback capability
     - Detailed logging
   - Duration: ~3-4 minutes

### Deployment Process

```bash
# Automatic deployment on push to main
git add .
git commit -m "Feature: Add new functionality"
git push origin main

# GitHub Actions automatically:
1. Runs CI tests
2. Builds Docker images
3. Deploys to production
4. Verifies health
5. Reports status
```

### Environment Configuration

**Server Environment (.env):**
```bash
# Supabase Configuration
SUPABASE_JWT_SECRET=<64-character-secret>

# API Keys
ANTHROPIC_API_KEY=sk-ant-api03-...

# Server Configuration
PORT=3000
WS_PORT=8081

# Session Configuration
SESSION_SECRET=<random-32-char-string>

# Docker Configuration
DOCKER_HOST=unix:///var/run/docker.sock
```

**Client Environment (client/.env):**
```bash
# Supabase Client Configuration
REACT_APP_SUPABASE_URL=https://pcxwjqmchuopknsdzykj.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🔐 Security Implementation

### Application Security
1. **Authentication**
   - JWT tokens with 1-hour expiration
   - Secure token refresh mechanism
   - Session isolation per user

2. **Network Security**
   - HTTPS enforcement via Caddy
   - WebSocket over TLS (WSS)
   - CORS configuration
   - Rate limiting

3. **Container Security**
   - Isolated Docker networks
   - Resource limits (CPU/Memory)
   - No privileged containers
   - Capability dropping
   - Read-only root filesystem

4. **Data Security**
   - No persistent user data
   - Ephemeral container storage
   - Environment variable encryption
   - Secrets never in code

### Infrastructure Security
1. **Server Hardening**
   - UFW firewall configured
   - SSH key-only access
   - Fail2ban installed
   - Regular security updates

2. **Docker Security**
   - Latest Docker version
   - Non-root containers
   - Security scanning
   - Image signing

## 📊 Performance & Monitoring

### Performance Optimizations
1. **Frontend**
   - Production React build
   - Code splitting
   - Lazy loading
   - CDN-ready assets
   - Gzip compression

2. **Backend**
   - Connection pooling
   - Stream processing
   - Efficient WebSocket handling
   - Memory management

3. **Infrastructure**
   - Docker layer caching
   - Multi-stage builds
   - Health checks
   - Auto-scaling ready

### Monitoring Endpoints

**Health Check:**
```bash
curl http://167.71.89.150:3000/api/health
# Response: {"status":"ok","totalSessions":0,"activeUsers":0}
```

**Container Logs:**
```bash
# Application logs
docker logs openode-node -f

# Proxy logs
docker logs claude-web-terminal-caddy-1 -f

# All logs
docker-compose logs -f
```

## 🛠️ Development Workflow

### Local Development Setup
```bash
# Clone repository
git clone https://github.com/bentossell/open-ODE.git
cd open-ODE

# Install dependencies
npm install
cd client && npm install && cd ..

# Set up environment
cp .env.example .env
cp client/.env.example client/.env
# Edit .env files with your values

# Start development
npm run dev              # Backend on :3000
cd client && npm start   # Frontend on :3000 (proxied)
```

### Testing Workflow
```bash
# Run all tests
npm test
cd client && npm test

# Linting
npm run lint
cd client && npm run lint

# Build validation
cd client && npm run build
docker build -t test .
```

### Deployment Workflow
```bash
# Automatic (recommended)
git push origin main  # Triggers CI/CD

# Manual deployment
ssh root@167.71.89.150
cd /opt/claude-web-terminal
git pull
docker-compose down
docker-compose up -d --build
```

## 🐛 Troubleshooting Guide

### Common Issues and Solutions

1. **WebSocket Connection Failed**
   ```bash
   # Check: JWT token validity
   # Solution: Re-login to get fresh token
   
   # Check: Server logs
   docker logs openode-node | grep WebSocket
   ```

2. **Container Spawn Failed**
   ```bash
   # Check: Docker daemon
   systemctl status docker
   
   # Check: Available resources
   docker system df
   free -h
   ```

3. **Authentication Issues**
   ```bash
   # Verify Supabase credentials
   curl $REACT_APP_SUPABASE_URL/auth/v1/health
   
   # Check JWT secret matches
   ```

4. **Deployment Failed**
   ```bash
   # Check GitHub Actions logs
   # Verify SSH key in secrets
   # Test connection manually
   ```

### Debug Commands
```bash
# System status
docker ps -a
docker-compose ps
systemctl status docker

# Resource usage
docker stats
htop

# Network debugging
netstat -tulpn
ss -tulpn

# Application logs
docker-compose logs --tail=100
journalctl -u docker -f
```

## 📈 Future Roadmap

### Immediate Priorities (v2.3.0)
- [ ] WebSocket connection stability improvements
- [ ] Session persistence across reconnects
- [ ] File upload/download in terminal
- [ ] User workspace management
- [ ] Rate limiting per user

### Medium-term Goals (v3.0.0)
- [ ] Multi-user collaboration
- [ ] Custom Claude configurations
- [ ] Terminal themes and customization
- [ ] Usage analytics dashboard
- [ ] Billing integration

### Long-term Vision
- [ ] Kubernetes deployment
- [ ] Horizontal scaling
- [ ] Enterprise SSO
- [ ] On-premise deployment
- [ ] API for third-party integrations

## 🤝 Contributing

### Development Process
1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request
5. CI/CD runs automatically

### Code Standards
- ESLint configuration
- Prettier formatting
- TypeScript strict mode
- 90%+ test coverage
- Documented functions

## 📞 Support & Resources

### Documentation
- **Setup Guide**: README.md
- **Technical Docs**: CLAUDE.md (this file)
- **API Reference**: /docs/api.md
- **Deployment**: /docs/deployment.md

### Getting Help
- **Issues**: https://github.com/bentossell/open-ODE/issues
- **Discussions**: GitHub Discussions
- **Logs**: Check GitHub Actions and Docker logs

### Monitoring
- **Production**: http://167.71.89.150:3000
- **Health**: http://167.71.89.150:3000/api/health
- **GitHub Actions**: https://github.com/bentossell/open-ODE/actions

---

## 🎉 Project Milestones

### Completed ✅
- Initial project setup and architecture
- Supabase authentication integration
- WebSocket real-time communication
- Docker containerization
- Terminal emulation with xterm.js
- Production deployment to DigitalOcean
- Automated CI/CD with GitHub Actions
- Health monitoring and logging
- Security hardening
- Performance optimization

### Current Status
The Claude Web Terminal is fully operational in production with automated deployment pipeline. Users can authenticate via Supabase and access Claude Code through a web-based terminal interface with real-time streaming capabilities.

---
*Last updated: 2025-07-26 | Version 2.2.0 | Maintained by @bentossell*
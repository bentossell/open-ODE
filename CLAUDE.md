# OpenODE - Web Terminal for Claude Code

## 🎯 Project Mission
Building a web-accessible terminal interface for Claude Code that allows users to interact with AI coding assistance through a browser, featuring a modern OpenInterface-style UI with integrated authentication.

## 📊 Current Status
- **Version**: 2.0.0
- **Last Updated**: 2025-07-26
- **Status**: Deployed on DigitalOcean, implementing OpenInterface UI

## 🔥 Recent Updates
- [x] Implemented OpenInterface-style UI with light theme terminal
- [x] Added Supabase authentication integration
- [x] Fixed WebSocket connection issues and TypeScript errors
- [x] Deployed to DigitalOcean droplet
- [x] Built openode-claude-env Docker image for Claude sessions

## 📋 Master Task List

### Completed ✅
- [x] Set up Node.js backend with Express
- [x] Implement WebSocket server with JWT authentication
- [x] Create Docker container management system
- [x] Build React frontend with TypeScript
- [x] Integrate xterm.js with light theme for OpenInterface style
- [x] Implement Supabase authentication (login, signup, magic link)
- [x] Add WebSocket reconnection with exponential backoff
- [x] Deploy to DigitalOcean with Docker Compose
- [x] Build openode-claude-env Docker image

### In Progress 🚧
- [ ] Test end-to-end Claude session creation
- [ ] Handle tool approvals and permissions UI
- [ ] Add hyperlink support to xterm

### Planned Features
- [ ] Slash-command catalogue & autocomplete
- [ ] Session persistence and history
- [ ] File upload/download capabilities
- [ ] User workspace management
- [ ] UX Polish (live-typing indicators, better error messages)

## 🏗️ Project Structure
```
open-ODE/
├── server.js               <-- Backend server (Express + WebSocket)
├── package.json            <-- Backend dependencies
├── .env                    <-- Environment variables (API keys, secrets)
├── docker-compose.yml      <-- Docker Compose configuration
├── Dockerfile              <-- Main app container
├── Dockerfile.claude-env   <-- Claude environment container
├── client/                 <-- React frontend
│   ├── src/
│   │   ├── App.tsx        <-- Main app with auth routing
│   │   ├── OpenTerminal.tsx <-- OpenInterface UI with terminal
│   │   ├── components/
│   │   │   └── Auth.tsx   <-- Supabase authentication
│   │   ├── contexts/
│   │   │   └── WebSocketContext.tsx <-- WebSocket management
│   │   └── lib/
│   │       └── supabase.ts <-- Supabase client
│   └── package.json
├── database/               <-- Database schemas and migrations
├── supabase/               <-- Supabase configuration
├── CLAUDE.md              <-- You are here
└── README.md              <-- Setup instructions
```

## 💡 Key Architecture Decisions
- **Backend**: Node.js with Express serving both API and static files
- **Frontend**: React with TypeScript using OpenInterface design pattern
- **Terminal**: xterm.js with custom light theme for better UX
- **Authentication**: Supabase for user management and JWT tokens
- **Docker**: Two images - `open-ode-app` for the web app, `openode-claude-env` for Claude sessions
- **Communication**: WebSocket with JWT authentication for secure real-time streaming
- **Deployment**: DigitalOcean droplet with Docker Compose

## 🔧 Technical Stack
- **Backend**: Node.js, Express, ws, dockerode, node-pty, jsonwebtoken
- **Frontend**: React 19, TypeScript, xterm.js, Tailwind CSS, Lucide icons
- **Authentication**: Supabase (PostgreSQL + Auth)
- **Infrastructure**: Docker containers for isolated Claude sessions
- **Deployment**: DigitalOcean droplet, Docker Compose, Nginx
- **Protocol**: WebSocket with JWT authentication

## 📝 How It Works

### Authentication Flow:
1. User logs in via Supabase (email/password or magic link)
2. Frontend receives JWT token
3. Token is sent with WebSocket connection
4. Backend verifies token using SUPABASE_JWT_SECRET

### Backend Flow:
1. Express server on port 3001 serves the React build
2. WebSocket server listens on port 8081
3. On connection, verifies JWT token
4. On "start" message, creates new Claude session
5. Spawns Docker container with openode-claude-env image
6. Uses node-pty to create pseudo-terminal
7. Streams I/O between browser and container

### Frontend Flow:
1. User sees OpenInterface-style UI with sidebar
2. Authenticates via Supabase Auth component
3. Clicks "Start Session" button
4. Terminal connects via WebSocket with auth token
5. Light-themed xterm displays Claude interactions
6. Real-time streaming with proper ANSI color support

## ⚡ Quick Commands
```bash
# Local Development
npm install
cd client && npm install

# Start development servers
npm run dev           # Backend on port 3001
cd client && npm start # Frontend on port 3000 (proxies to 3001)

# Build for production
cd client && npm run build
npm start

# Docker Commands
docker build -f Dockerfile.claude-env -t openode-claude-env .
docker-compose up -d --build

# Deployment (on DigitalOcean droplet)
git pull origin main
docker-compose down
docker-compose up -d --build
```

## 🚨 Important Configuration

### Environment Variables (.env)
```bash
# Supabase Configuration
SUPABASE_JWT_SECRET=your-jwt-secret-from-supabase

# Server Configuration  
ANTHROPIC_API_KEY=your-anthropic-api-key
PORT=3001
WS_PORT=8081

# Session Configuration
SESSION_SECRET=your-session-secret
```

### Client Environment Variables (client/.env)
```bash
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

### Key Points
- Requires Docker with openode-claude-env image built
- WebSocket runs on port 8081, HTTP on 3001
- Frontend dev server on 3000 proxies API calls to 3001
- Each session gets isolated Docker container
- Supabase handles all authentication
- JWT tokens validate WebSocket connections

## 🔄 Deployment Checklist
1. Ensure Docker is installed: `docker --version`
2. Build Claude image: `docker build -f Dockerfile.claude-env -t openode-claude-env .`
3. Set environment variables in `.env`
4. Pull latest code: `git pull origin main`
5. Build and start: `docker-compose up -d --build`
6. Check logs: `docker logs open-ode-app-1`
7. Verify health: `curl http://localhost:3001/api/health`
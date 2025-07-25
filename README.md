# Claude Web Terminal

A web-accessible terminal interface for Claude Code that makes AI coding assistance available to everyone through a simple browser interface.

## Features

- 🌐 **Web-based terminal** - No local installation needed for users
- 🚀 **Real-time streaming** - See Claude's responses as they're generated
- 🎨 **Friendly UI** - Designed for non-technical users
- 🔒 **Isolated sessions** - Each user gets their own Docker container
- 💬 **Natural interaction** - Just type questions like you're chatting

## Prerequisites

1. **Docker** installed and running
2. **Claude Docker image** built (from the claude-docker-setup)
3. **Node.js** 18+ installed
4. **Anthropic API key** from [console.anthropic.com](https://console.anthropic.com/account/keys)
5. **Supabase project** (for authentication) - see [Supabase setup guide](./supabase-auth-setup-guide.md)

## Environment Setup

### Automated Setup (Recommended)

Run the interactive setup script to configure your environment:

```bash
cd ~/claude-web-terminal
./setup-environment.sh
```

This script will:
- Prompt you for all required configuration values
- Create `.env` files in the root and client directories
- Validate your inputs
- Provide next steps for getting started

### Manual Setup

If you prefer to set up manually:

1. **Copy the example environment files:**
   ```bash
   cp .env.example .env
   cp client/.env.example client/.env
   ```

2. **Edit the root `.env` file:**
   ```env
   # Required
   ANTHROPIC_API_KEY=your-anthropic-api-key
   SUPABASE_JWT_SECRET=your-supabase-jwt-secret
   
   # Optional (defaults shown)
   PORT=3000
   WS_PORT=8081
   DOCKER_IMAGE_NAME=claude-env
   DOCKER_CONTAINER_PREFIX=claude-session
   SESSION_TIMEOUT_MINUTES=30
   MAX_CONCURRENT_SESSIONS=10
   ```

3. **Edit the client `.env` file:**
   ```env
   # Required
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
   
   # Optional (defaults shown)
   REACT_APP_API_URL=http://localhost:3000
   REACT_APP_WS_URL=ws://localhost:8081
   REACT_APP_ENABLE_AUTH=true
   REACT_APP_ENABLE_FILE_UPLOAD=false
   REACT_APP_MAX_MESSAGE_LENGTH=10000
   ```

### Environment Variables Reference

#### Server Variables (`.env`)

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key | - |
| `SUPABASE_JWT_SECRET` | Yes | JWT secret from Supabase settings | - |
| `PORT` | No | HTTP server port | 3000 |
| `WS_PORT` | No | WebSocket server port | 8081 |
| `DOCKER_IMAGE_NAME` | No | Name of the Claude Docker image | claude-env |
| `DOCKER_CONTAINER_PREFIX` | No | Prefix for Docker container names | claude-session |
| `SESSION_TIMEOUT_MINUTES` | No | Session timeout duration | 30 |
| `MAX_CONCURRENT_SESSIONS` | No | Maximum concurrent sessions | 10 |

#### Client Variables (`client/.env`)

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `REACT_APP_SUPABASE_URL` | Yes | Your Supabase project URL | - |
| `REACT_APP_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key | - |
| `REACT_APP_API_URL` | No | Backend API URL | http://localhost:3000 |
| `REACT_APP_WS_URL` | No | WebSocket server URL | ws://localhost:8081 |
| `REACT_APP_ENABLE_AUTH` | No | Enable authentication | true |
| `REACT_APP_ENABLE_FILE_UPLOAD` | No | Enable file upload feature | false |
| `REACT_APP_MAX_MESSAGE_LENGTH` | No | Maximum message length | 10000 |

## Quick Start

1. **Set up your environment:**
   ```bash
   cd ~/claude-web-terminal
   ./setup-environment.sh
   ```
   
   Or manually create `.env` files as described above.

2. **Install dependencies:**
   ```bash
   npm install
   cd client && npm install && cd ..
   ```

3. **Start the servers:**
   
   In one terminal:
   ```bash
   npm start
   ```
   
   In another terminal:
   ```bash
   cd client && npm start
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## Production Setup

1. **Build the frontend:**
   ```bash
   cd client && npm run build
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Access at:** `http://localhost:3000`

## How It Works

1. Users access the web interface
2. Click "Start Session" to begin
3. Backend creates a Docker container with Claude Code
4. WebSocket streams terminal I/O in real-time
5. Users can type naturally to interact with Claude

## Architecture

```
Browser <--WebSocket--> Node.js Server <--Docker API--> Claude Container
   |                         |                              |
React UI               Express + ws                   claude-env image
```

## Configuration

- **HTTP Port**: 3000 (change in server.js)
- **WebSocket Port**: 8080 (change in server.js)
- **Docker Image**: claude-env (must exist)
- **Project Path**: Set via REACT_APP_PROJECT_PATH env var

## Security Considerations

- Each session runs in an isolated Docker container
- Containers are automatically removed after use
- No persistent storage by default
- Consider adding authentication for production use

## Troubleshooting

**"Connection error" in terminal:**
- Check Docker is running: `docker ps`
- Verify claude-env image exists: `docker images`
- Check WebSocket port 8080 is not blocked

**"Claude command not found":**
- Rebuild claude-env image from claude-docker-setup
- Ensure image has Claude Code installed

**Performance issues:**
- Limit concurrent sessions
- Add container resource limits
- Use container pooling for faster startup

## Development

**Backend (server.js):**
- Express server with WebSocket support
- Docker container management via dockerode
- Session handling and cleanup

**Frontend (client/src/App.tsx):**
- React with TypeScript
- xterm.js for terminal emulation
- WebSocket client for real-time communication

## Future Enhancements

- [ ] User authentication
- [ ] Session persistence
- [ ] File upload/download
- [ ] Multiple concurrent sessions
- [ ] Command history
- [ ] Custom workspaces
- [ ] Usage analytics

## License

MIT
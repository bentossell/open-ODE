# Claude Web Terminal

A web-accessible terminal interface for Claude Code that makes AI coding assistance available to everyone through a simple browser interface.

## Features

- 🌐 **Web-based terminal** - No local installation needed for users
- 🚀 **Real-time streaming** - See Claude's responses as they're generated
- 🎨 **Friendly UI** - Designed for non-technical users
- 🔒 **Isolated sessions** - Each user gets their own Docker container
- 💬 **Natural interaction** - Just type questions like you're chatting
- ⚡ **Slash Commands** - Create custom shortcuts for frequently used prompts

## Prerequisites

1. **Docker** installed and running
2. **Claude Docker image** built (from the claude-docker-setup)
3. **Node.js** 18+ installed
4. **ANTHROPIC_API_KEY** environment variable set

## Quick Start

1. **Clone and install dependencies:**
   ```bash
   cd ~/claude-web-terminal
   npm install
   cd client && npm install && cd ..
   ```

2. **Set your API key:**
   ```bash
   export ANTHROPIC_API_KEY="your-api-key-here"
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

## Slash Commands

Slash commands allow you to create custom shortcuts for frequently used prompts:

### Creating a Slash Command

1. Click "➕ New Command" in the control panel
2. Enter your shortcut (e.g., `/hn`)
3. Write the full prompt that should be sent to Claude
4. Optionally add:
   - Description for easy identification
   - Reference files from your workspace
   - URLs that Claude should use

### Using Slash Commands

Simply type your shortcut in the terminal and press Enter:
```
/hn
```

This will automatically expand to your full prompt and send it to Claude.

### Example Commands

- `/hn` - Fetch latest Hacker News posts
- `/debug` - Analyze error logs and suggest fixes
- `/review` - Review code for best practices
- `/test` - Generate unit tests for current file

### Managing Commands

- Click "📋 View Commands" to see all your saved commands
- Edit commands by clicking the ✏️ icon
- Delete commands with the 🗑️ icon
- Commands are saved locally in your browser

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
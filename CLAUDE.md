# Claude Web Terminal - Development Guide

## 🎯 Project Mission
Building a web-accessible terminal interface for Claude Code that allows non-technical users to interact with AI coding assistance through a browser.

## 📊 Current Status
- **Version**: 1.1.0
- **Last Session**: 2025-07-25
- **Next Priority**: Test complete system integration
- **Latest Feature**: Slash command system for custom shortcuts

## 🔥 Active Tasks (Current Session)
Working on:
- [x] Create project structure
- [x] Build backend server with Docker integration
- [x] Implement WebSocket streaming
- [x] Create frontend with xterm.js
- [x] Implement slash command system
- [ ] Test Docker connection and Claude Code integration

## 📋 Master Task List

### Completed ✅
- [x] Set up Node.js backend with Express (2025-07-25)
- [x] Implement WebSocket server for real-time communication
- [x] Create Docker container management system
- [x] Build React frontend with TypeScript
- [x] Integrate xterm.js for terminal emulation
- [x] Design clean UI for non-technical users
- [x] Implement slash command system with modal UI (2025-07-25)
- [x] Add local storage persistence for commands
- [x] Create command management interface

### High Priority
- [ ] Test end-to-end Docker integration
- [ ] Add error handling and recovery
- [ ] Implement proper session cleanup

### Medium Priority
- [ ] Add session persistence
- [ ] Create user workspace management
- [ ] Add file upload/download capabilities
- [ ] Implement command history

## 🏗️ Project Structure
```
claude-web-terminal/
├── server.js                <-- Backend server (Express + WebSocket)
├── package.json             <-- Backend dependencies
├── client/                  <-- React frontend
│   ├── src/
│   │   ├── TerminalApp.tsx  <-- Main terminal interface
│   │   ├── App.css          <-- Styling
│   │   ├── components/      <-- UI components
│   │   │   ├── SlashCommandModal.tsx
│   │   │   └── SlashCommandList.tsx
│   │   ├── services/        <-- Business logic
│   │   │   └── slashCommandService.ts
│   │   └── types/           <-- TypeScript types
│   │       └── slashCommand.ts
│   └── package.json
├── CLAUDE.md                <-- You are here
└── README.md                <-- Setup instructions
```

## 💡 Key Architecture Decisions
- **Backend**: Node.js with Express for simplicity and WebSocket support
- **Frontend**: React with TypeScript for type safety
- **Terminal**: xterm.js for authentic terminal experience
- **Docker**: Using existing claude-env image from previous setup
- **Communication**: WebSocket for real-time bidirectional streaming

## 🔧 Technical Stack
- **Backend**: Node.js, Express, ws, dockerode
- **Frontend**: React, TypeScript, xterm.js
- **Infrastructure**: Docker containers for isolated Claude sessions
- **Protocol**: WebSocket for real-time communication

## 📝 How It Works

### Backend Flow:
1. Express server serves the React app
2. WebSocket server listens on port 8080
3. On connection, creates new Claude session
4. Spawns Docker container with claude-env image
5. Attaches to container's stdin/stdout
6. Streams I/O between browser and container

### Frontend Flow:
1. User sees friendly interface with tips
2. Clicks "Start Session" button
3. Terminal connects via WebSocket
4. User types naturally to Claude or uses slash commands
5. Slash commands are intercepted and expanded before sending
6. Sees streaming responses in real-time

## ⚡ Quick Commands
```bash
# Install dependencies
npm install
cd client && npm install

# Start development
npm run dev           # Backend
cd client && npm start # Frontend

# Build for production
cd client && npm run build
npm start
```

## 🚨 Important Notes
- Requires Docker with claude-env image built
- ANTHROPIC_API_KEY must be set in environment
- WebSocket runs on port 8080, HTTP on 3000
- Each session gets isolated Docker container
- Slash commands are stored in browser local storage
- Example command `/hn` pre-loaded for testing

## 🔄 Next Session Setup
1. Verify Docker image: `docker images | grep claude-env`
2. Set API key: `export ANTHROPIC_API_KEY=...`
3. Test the complete system
4. Add error handling for edge cases
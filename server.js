const express = require('express');
const WebSocket = require('ws');
const Docker = require('dockerode');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const pty = require('node-pty');

const app = express();
const docker = new Docker();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/build')));

// Store active sessions
const sessions = new Map();

// WebSocket server will be created after HTTP server
let wss;

class ClaudeSession {
  constructor(sessionId, ws) {
    this.sessionId = sessionId;
    this.ws = ws;
    this.container = null;
    this.ptyProcess = null;
  }

  async start(projectPath = process.cwd()) {
    try {
      // Use real path on host system
      const realPath = projectPath.startsWith('/') ? projectPath : path.join(process.cwd(), projectPath);
      
      // Create container with Claude environment
      this.container = await docker.createContainer({
        Image: 'claude-env',
        Cmd: ['sleep', 'infinity'], // Keep container running
        Tty: false,
        OpenStdin: false,
        WorkingDir: '/workspace',
        Env: [`ANTHROPIC_API_KEY=${process.env.ANTHROPIC_API_KEY}`],
        HostConfig: {
          AutoRemove: true,
          Binds: [`${realPath}:/workspace`]
        }
      });

      await this.container.start();
      console.log('Container started:', this.container.id);

      // Get container info
      const containerInfo = await this.container.inspect();
      const containerId = containerInfo.Id;

      // Create PTY process that runs docker exec
      this.ptyProcess = pty.spawn('docker', [
        'exec',
        '-it',
        containerId,
        'claude'
      ], {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: process.cwd(),
        env: process.env
      });

      console.log('PTY process created');

      // Handle PTY output
      this.ptyProcess.onData((data) => {
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'output',
            data: data
          }));
        }
      });

      // Handle PTY exit
      this.ptyProcess.onExit(({ exitCode, signal }) => {
        console.log(`PTY process exited: code ${exitCode}, signal ${signal}`);
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'exit',
            code: exitCode
          }));
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Error starting session:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to start container'
      };
    }
  }

  sendInput(data) {
    if (this.ptyProcess) {
      this.ptyProcess.write(data);
    }
  }

  resize(cols, rows) {
    if (this.ptyProcess) {
      this.ptyProcess.resize(cols, rows);
    }
  }

  async stop() {
    try {
      if (this.ptyProcess) {
        this.ptyProcess.kill();
      }
      if (this.container) {
        await this.container.stop();
      }
    } catch (error) {
      // Container might already be stopped
      console.error('Error stopping session:', error);
    }
  }
}

// WebSocket connection handler function
function handleWebSocketConnection(ws) {
  const sessionId = uuidv4();
  console.log(`New session: ${sessionId}`);

  ws.on('message', async (message) => {
    const data = JSON.parse(message);

    switch (data.type) {
      case 'start':
        const session = new ClaudeSession(sessionId, ws);
        sessions.set(sessionId, session);
        
        // Use workspaces directory for projects
        const workspacePath = data.projectPath || path.join(__dirname, 'workspaces', 'default');
        const result = await session.start(workspacePath);
        
        ws.send(JSON.stringify({
          type: 'status',
          status: result.success ? 'started' : 'error',
          sessionId: sessionId,
          error: result.error
        }));
        break;

      case 'input':
        const activeSession = sessions.get(sessionId);
        if (activeSession) {
          activeSession.sendInput(data.data);
        }
        break;

      case 'resize':
        const resizeSession = sessions.get(sessionId);
        if (resizeSession && data.cols && data.rows) {
          resizeSession.resize(data.cols, data.rows);
        }
        break;
    }
  });

  ws.on('close', async () => {
    console.log(`Session closed: ${sessionId}`);
    const session = sessions.get(sessionId);
    if (session) {
      await session.stop();
      sessions.delete(sessionId);
    }
  });
}

// Store port configuration
let serverConfig = {};

// API endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', sessions: sessions.size });
});

app.get('/api/config', (req, res) => {
  res.json(serverConfig);
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

const PORT = process.env.PORT || 3000;
const WS_PORT = process.env.WS_PORT || 8081;

// Function to find available port
async function findAvailablePort(startPort) {
  const net = require('net');
  
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    
    server.on('error', () => {
      // Port is taken, try next one
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

// Start HTTP server
async function startServers() {
  try {
    // Find available port for HTTP server
    const httpPort = await findAvailablePort(PORT);
    
    const server = app.listen(httpPort, () => {
      console.log(`✅ HTTP server running on port ${httpPort}`);
    });
    
    // Find available port for WebSocket server
    const wsPort = await findAvailablePort(WS_PORT);
    
    // Create WebSocket server
    wss = new WebSocket.Server({ port: wsPort });
    wss.on('connection', handleWebSocketConnection);
    
    console.log(`📡 WebSocket server running on port ${wsPort}`);
    
    if (httpPort !== PORT) {
      console.log(`⚠️  Port ${PORT} was taken, using ${httpPort} instead`);
    }
    if (wsPort !== WS_PORT) {
      console.log(`⚠️  Port ${WS_PORT} was taken, using ${wsPort} instead`);
    }
    
    // Store config for frontend
    serverConfig = {
      httpPort,
      wsPort
    };
    
    console.log(`\n🌐 Open http://localhost:${httpPort} in your browser`);
    
  } catch (error) {
    console.error('❌ Failed to start servers:', error);
    process.exit(1);
  }
}

startServers();

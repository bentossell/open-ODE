require('dotenv').config();

const express = require('express');
const WebSocket = require('ws');
const Docker = require('dockerode');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const pty = require('node-pty');
const jwt = require('jsonwebtoken');

const app = express();
const docker = new Docker();

// Supabase JWT secret - should be in environment variables
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/build')));

// Store active sessions
const sessions = new Map();

// Store user sessions mapping
const userSessions = new Map(); // userId -> Set of sessionIds

// WebSocket server will be created after HTTP server
let wss;

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  if (!SUPABASE_JWT_SECRET) {
    console.error('SUPABASE_JWT_SECRET not configured');
    return res.status(500).json({ error: 'Server authentication not configured' });
  }

  try {
    const decoded = jwt.verify(token, SUPABASE_JWT_SECRET);
    req.user = decoded;
    req.userId = decoded.sub; // Supabase uses 'sub' for user ID
    next();
  } catch (error) {
    console.error('JWT verification failed:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Verify WebSocket authentication
async function verifyWebSocketAuth(token) {
  if (!token || !SUPABASE_JWT_SECRET) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, SUPABASE_JWT_SECRET);
    return {
      userId: decoded.sub,
      email: decoded.email,
      role: decoded.role
    };
  } catch (error) {
    console.error('WebSocket JWT verification failed:', error);
    return null;
  }
}

// Session management helpers
function getUserSessions(userId) {
  return userSessions.get(userId) || new Set();
}

function addUserSession(userId, sessionId) {
  if (!userSessions.has(userId)) {
    userSessions.set(userId, new Set());
  }
  userSessions.get(userId).add(sessionId);
}

function removeUserSession(userId, sessionId) {
  const sessions = userSessions.get(userId);
  if (sessions) {
    sessions.delete(sessionId);
    if (sessions.size === 0) {
      userSessions.delete(userId);
    }
  }
}

function getUserActiveSessionCount(userId) {
  const sessions = getUserSessions(userId);
  return sessions.size;
}

class ClaudeSession {
  constructor(sessionId, ws, userId = null) {
    this.sessionId = sessionId;
    this.ws = ws;
    this.userId = userId;
    this.container = null;
    this.ptyProcess = null;
    this.createdAt = new Date();
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
        Env: [
          `ANTHROPIC_API_KEY=${process.env.ANTHROPIC_API_KEY}`,
          'CLAUDE_USE_API_KEY=true',  // Force API key mode
          'CLAUDE_DISABLE_TELEMETRY=true',
          'CLAUDE_TRUST_WORKSPACE=true'
        ],
        HostConfig: {
          AutoRemove: true,
          Binds: [
            `${realPath}:/workspace`,
            `claude-config:/root/.config/claude-code`  // Persist Claude config
          ]
        }
      });

      await this.container.start();
      console.log('Container started:', this.container.id);

      // Get container info
      const containerInfo = await this.container.inspect();
      const containerId = containerInfo.Id;

      // First check if claude binary exists in container
      try {
        const checkResult = await docker.getContainer(containerId).exec({
          Cmd: ['which', 'claude'],
          AttachStdout: true,
          AttachStderr: true
        });
        
        const checkStream = await checkResult.start();
        const checkOutput = await new Promise((resolve) => {
          let output = '';
          checkStream.on('data', (chunk) => {
            output += chunk.toString();
          });
          checkStream.on('end', () => resolve(output));
        });
        
        console.log('Claude binary location:', checkOutput.trim());
      } catch (err) {
        console.error('Failed to find claude binary:', err);
        throw new Error('Claude binary not found in container');
      }
      
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
        env: {
          ...process.env,
          TERM: 'xterm-256color',
          ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY
        }
      });

      console.log('PTY process created');
      
      // Check if PTY process is valid
      if (!this.ptyProcess) {
        console.error('PTY process creation failed');
        throw new Error('Failed to create PTY process');
      }

      // Handle PTY output
      this.ptyProcess.onData((data) => {
        // Log output for debugging
        if (data.trim()) {
          console.log('PTY output:', data.substring(0, 100).replace(/\n/g, '\\n')); // Log first 100 chars
        }
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
      
      // Log PTY process PID
      console.log('PTY process PID:', this.ptyProcess.pid);
      
      // Handle errors
      this.ptyProcess.onExit(({ exitCode, signal }) => {
        if (exitCode !== 0) {
          console.error(`PTY process failed with exit code ${exitCode}`);
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
function handleWebSocketConnection(ws, req) {
  let sessionId = null;
  let userId = null;
  let authenticated = false;

  ws.on('message', async (message) => {
    const data = JSON.parse(message);

    // Handle authentication first
    if (data.type === 'auth') {
      const authResult = await verifyWebSocketAuth(data.token);
      if (authResult) {
        authenticated = true;
        userId = authResult.userId;
        sessionId = uuidv4();
        
        console.log(`New authenticated session: ${sessionId} for user: ${userId}`);
        
        ws.send(JSON.stringify({
          type: 'auth',
          status: 'authenticated',
          userId: userId,
          sessionId: sessionId
        }));
      } else {
        ws.send(JSON.stringify({
          type: 'auth',
          status: 'failed',
          error: 'Invalid authentication token'
        }));
        // Give client time to receive the error message
        setTimeout(() => ws.close(), 100);
      }
      return;
    }

    // Require authentication for all other operations
    if (!authenticated) {
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Authentication required'
      }));
      return;
    }

    switch (data.type) {
      case 'start':
        // Check if user already has an active session
        const existingSessions = userSessions.get(userId) || [];
        if (existingSessions.length > 0) {
          console.log(`User ${userId} already has ${existingSessions.length} active session(s)`);
          // Close existing sessions first
          for (const existingSessionId of existingSessions) {
            const existingSession = sessions.get(existingSessionId);
            if (existingSession) {
              console.log(`Stopping existing session ${existingSessionId}`);
              await existingSession.stop();
              sessions.delete(existingSessionId);
            }
          }
          userSessions.set(userId, []);
        }
        
        const session = new ClaudeSession(sessionId, ws, userId);
        sessions.set(sessionId, session);
        addUserSession(userId, sessionId);
        
        // Use workspaces directory for projects - can be user-specific
        const workspacePath = data.projectPath || path.join(__dirname, 'workspaces', userId, 'default');
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
    if (sessionId && userId) {
      console.log(`Session closed: ${sessionId} for user: ${userId}`);
      const session = sessions.get(sessionId);
      if (session) {
        await session.stop();
        sessions.delete(sessionId);
        removeUserSession(userId, sessionId);
      }
    }
  });
}

// Store port configuration
let serverConfig = {};

// API endpoints
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    totalSessions: sessions.size,
    activeUsers: userSessions.size
  });
});

app.get('/api/config', (req, res) => {
  res.json(serverConfig);
});

// Authenticated endpoints
app.get('/api/user/sessions', authenticateToken, (req, res) => {
  const userSessionIds = getUserSessions(req.userId);
  const userSessionDetails = [];
  
  userSessionIds.forEach(sessionId => {
    const session = sessions.get(sessionId);
    if (session) {
      userSessionDetails.push({
        sessionId: session.sessionId,
        createdAt: session.createdAt,
        active: session.ptyProcess !== null
      });
    }
  });
  
  res.json({
    userId: req.userId,
    sessions: userSessionDetails,
    count: userSessionDetails.length
  });
});

app.post('/api/user/sessions/:sessionId/stop', authenticateToken, async (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  if (session.userId !== req.userId) {
    return res.status(403).json({ error: 'Unauthorized to stop this session' });
  }
  
  await session.stop();
  sessions.delete(sessionId);
  removeUserSession(req.userId, sessionId);
  
  res.json({ message: 'Session stopped successfully' });
});

app.get('/api/user/info', authenticateToken, (req, res) => {
  res.json({
    userId: req.userId,
    email: req.user.email,
    role: req.user.role,
    activeSessions: getUserActiveSessionCount(req.userId)
  });
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
    wss.on('connection', (ws, req) => handleWebSocketConnection(ws, req));
    
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

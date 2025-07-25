import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import './EnhancedApp.css';

interface Todo {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
}

interface ClaudeMode {
  id: string;
  name: string;
  command: string;
  icon: string;
}

const CLAUDE_MODES: ClaudeMode[] = [
  { id: 'default', name: 'Default', command: '', icon: '🤖' },
  { id: 'plan', name: 'Plan Mode', command: '/plan', icon: '📋' },
  { id: 'accept', name: 'Accept Edits', command: '/accept', icon: '✅' }
];

const SLASH_COMMANDS = [
  { command: '/help', description: 'Show available commands' },
  { command: '/plan', description: 'Toggle plan mode' },
  { command: '/accept', description: 'Toggle accept edits mode' },
  { command: '/clear', description: 'Clear the terminal' },
  { command: '/reset', description: 'Reset Claude context' },
  { command: '/undo', description: 'Undo last action' },
  { command: '/exit', description: 'Exit Claude' }
];

function EnhancedTerminalApp() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [terminal, setTerminal] = useState<Terminal | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const sessionStartedRef = useRef(false);
  const fitAddonRef = useRef<FitAddon | null>(null);
  
  // UI State
  const [currentMode, setCurrentMode] = useState<ClaudeMode>(CLAUDE_MODES[0]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const bufferRef = useRef<string>('');
  const [permissionRequest, setPermissionRequest] = useState<string>('');
  const [currentDirectory, setCurrentDirectory] = useState('/workspace');
  const [showSlashCommands, setShowSlashCommands] = useState(false);

  useEffect(() => {
    // Fetch server configuration first
    fetch('/api/config')
      .then(res => res.json())
      .then(config => {
        initializeTerminal(config.wsPort || 8081);
      })
      .catch(() => {
        // Fallback if config endpoint fails
        initializeTerminal(8081);
      });
  }, []);

  const initializeTerminal = (wsPort: number) => {
    if (!terminalRef.current) return;

    // Initialize terminal with custom theme
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#0d1117',
        foreground: '#c9d1d9',
        cursor: '#58a6ff',
        black: '#000000',
        red: '#ff7b72',
        green: '#3fb950',
        yellow: '#d29922',
        blue: '#58a6ff',
        magenta: '#bc8cff',
        cyan: '#39c5cf',
        white: '#b1bac4',
        brightBlack: '#6e7681',
        brightRed: '#ffa198',
        brightGreen: '#56d364',
        brightYellow: '#e3b341',
        brightBlue: '#79c0ff',
        brightMagenta: '#d2a8ff',
        brightCyan: '#56d4dd',
        brightWhite: '#ffffff'
      }
    });

    const fitAddon = new FitAddon();
    fitAddonRef.current = fitAddon;
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    setTerminal(term);

    // Handle window resize
    const handleResize = () => {
      fitAddon.fit();
      if (ws && sessionStartedRef.current) {
        const dimensions = fitAddon.proposeDimensions();
        if (dimensions) {
          ws.send(JSON.stringify({
            type: 'resize',
            cols: dimensions.cols,
            rows: dimensions.rows
          }));
        }
      }
    };
    
    window.addEventListener('resize', handleResize);

    // Connect to WebSocket
    const websocket = new WebSocket(`ws://localhost:${wsPort}`);
    
    websocket.onopen = () => {
      setConnected(true);
      term.writeln('🚀 Connected to Claude terminal server');
      term.writeln('Click "Start Session" to begin...\r\n');
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'output':
          term.write(data.data);
          // Buffer output for better parsing
          bufferRef.current += data.data;
          
          // Parse when we get a newline or sufficient content
          if (data.data.includes('\n') || bufferRef.current.length > 200) {
            parseOutputForSpecialContent(bufferRef.current);
            // Keep last 100 chars in buffer for context
            bufferRef.current = bufferRef.current.slice(-100);
          }
          break;
        case 'status':
          if (data.status === 'started') {
            setSessionStarted(true);
            sessionStartedRef.current = true;
            term.clear();
            term.focus();
            // Send initial terminal size
            const dimensions = fitAddon.proposeDimensions();
            if (dimensions) {
              websocket.send(JSON.stringify({
                type: 'resize',
                cols: dimensions.cols,
                rows: dimensions.rows
              }));
            }
          } else if (data.status === 'error') {
            term.writeln(`\r\n❌ Error: ${data.error || 'Failed to start session'}`);
            term.writeln('\r\nPlease check Docker settings and try again.');
          }
          break;
        case 'exit':
          term.writeln('\r\n\r\n[Process exited]');
          setSessionStarted(false);
          sessionStartedRef.current = false;
          break;
      }
    };

    websocket.onclose = () => {
      setConnected(false);
      setSessionStarted(false);
      sessionStartedRef.current = false;
      term.writeln('\r\n\r\n❌ Disconnected from server');
    };

    websocket.onerror = (error) => {
      term.writeln('\r\n❌ Connection error');
    };

    setWs(websocket);

    // Terminal input handler
    term.onData((data) => {
      if (websocket.readyState === WebSocket.OPEN && sessionStartedRef.current) {
        websocket.send(JSON.stringify({
          type: 'input',
          data: data
        }));
      }
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
      websocket.close();
    };
  };

  const parseOutputForSpecialContent = (output: string) => {
    // Parse for todos in various formats
    const todoPatterns = [
      // TodoWrite tool format
      /todos:\s*\[([^\]]+)\]/gi,
      // Bullet list format
      /(?:^|\n)\s*[-*•]\s*\[([ xX])\]\s*(.+)/gm,
      // Numbered list with status
      /(?:^|\n)\s*\d+\.\s*\[([ xX])\]\s*(.+)/gm,
      // Task mentions
      /(?:task|todo):\s*(.+?)(?:\n|$)/gi
    ];

    // Check for TodoWrite tool output
    if (output.includes('todos') && output.includes('[{')) {
      try {
        // Extract JSON from TodoWrite output
        const jsonMatch = output.match(/\[\{[^\]]+\}\]/s);
        if (jsonMatch) {
          const todosData = JSON.parse(jsonMatch[0]);
          const formattedTodos = todosData.map((todo: any) => ({
            id: todo.id || Date.now().toString(),
            content: todo.content,
            status: todo.status || 'pending',
            priority: todo.priority || 'medium'
          }));
          setTodos(formattedTodos);
        }
      } catch (e) {
        // Continue with other parsing methods if JSON fails
      }
    }

    // Parse for permission requests
    const permissionPatterns = [
      /(?:permission|authorize|allow|confirm).*\?/i,
      /(?:would you like to|do you want to|can i|may i).*\?/i,
      /\[y\/n\]/i,
      /(?:yes|no|cancel)/i
    ];

    for (const pattern of permissionPatterns) {
      if (pattern.test(output)) {
        // Extract the question/request
        const lines = output.split('\n');
        const questionLine = lines.find(line => pattern.test(line));
        if (questionLine && !showPermissionDialog) {
          setPermissionRequest(questionLine.trim());
          setShowPermissionDialog(true);
        }
        break;
      }
    }
  };

  const startSession = () => {
    if (ws && connected) {
      ws.send(JSON.stringify({
        type: 'start'
      }));
    }
  };

  const sendCommand = (command: string) => {
    if (ws && connected && sessionStarted && terminal) {
      // Clear any existing text on the current line
      terminal.write('\x1b[2K\r');
      // Send the command
      terminal.write(command);
      ws.send(JSON.stringify({
        type: 'input',
        data: command + '\r'
      }));
    }
  };

  const switchMode = (mode: ClaudeMode) => {
    setCurrentMode(mode);
    if (mode.command) {
      sendCommand(mode.command);
    }
  };

  const changeDirectory = (path: string) => {
    setCurrentDirectory(path);
    sendCommand(`cd ${path}`);
  };

  const handlePermissionResponse = (response: 'yes' | 'yes-always' | 'no') => {
    // Handle permission response
    switch (response) {
      case 'yes':
        sendCommand('y');
        break;
      case 'yes-always':
        sendCommand('Y');
        break;
      case 'no':
        sendCommand('n');
        break;
    }
    setShowPermissionDialog(false);
  };

  const handleSlashCommand = (command: string) => {
    sendCommand(command);
    setShowSlashCommands(false);
  };

  return (
    <div className="enhanced-app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <h1>Claude Code</h1>
            <span className="subtitle">AI Coding Assistant</span>
          </div>
          <div className="header-right">
            <div className="connection-status">
              <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}></span>
              <span>{connected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="control-bar">
        <div className="control-section">
          <button 
            onClick={startSession} 
            disabled={!connected || sessionStarted}
            className={`primary-button ${sessionStarted ? 'active' : ''}`}
          >
            {sessionStarted ? '✅ Session Active' : '🚀 Start Session'}
          </button>
        </div>

        <div className="control-section mode-switcher">
          {CLAUDE_MODES.map(mode => (
            <button
              key={mode.id}
              onClick={() => switchMode(mode)}
              className={`mode-button ${currentMode.id === mode.id ? 'active' : ''}`}
              disabled={!sessionStarted}
            >
              <span className="mode-icon">{mode.icon}</span>
              <span className="mode-name">{mode.name}</span>
            </button>
          ))}
        </div>

        <div className="control-section">
          <button 
            className="control-button"
            onClick={() => setShowSlashCommands(!showSlashCommands)}
            disabled={!sessionStarted}
          >
            <span className="button-icon">⚡</span>
            Commands
          </button>
          
          <div className="directory-selector">
            <span className="directory-icon">📁</span>
            <input
              type="text"
              value={currentDirectory}
              onChange={(e) => setCurrentDirectory(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  changeDirectory(currentDirectory);
                }
              }}
              disabled={!sessionStarted}
              className="directory-input"
            />
          </div>
        </div>
      </div>

      {showSlashCommands && (
        <div className="slash-commands-dropdown">
          {SLASH_COMMANDS.map(cmd => (
            <button
              key={cmd.command}
              onClick={() => handleSlashCommand(cmd.command)}
              className="slash-command-item"
            >
              <span className="command">{cmd.command}</span>
              <span className="description">{cmd.description}</span>
            </button>
          ))}
        </div>
      )}

      <div className="main-content">
        <div className="terminal-panel">
          <div className="panel-header">
            <h3>Terminal</h3>
          </div>
          <div className="terminal-wrapper">
            <div 
              ref={terminalRef} 
              className="terminal" 
              onClick={() => terminal?.focus()}
            />
          </div>
        </div>

        <div className="sidebar">
          <div className="todos-panel">
            <div className="panel-header">
              <h3>Tasks</h3>
              <span className="task-count">{todos.length}</span>
            </div>
            <div className="todos-content">
              {todos.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📋</span>
                  <p>No tasks yet</p>
                </div>
              ) : (
                <div className="todos-list">
                  {todos.map(todo => (
                    <div key={todo.id} className={`todo-item ${todo.status}`}>
                      <div className="todo-status">
                        {todo.status === 'completed' && '✅'}
                        {todo.status === 'in_progress' && '🔄'}
                        {todo.status === 'pending' && '⏳'}
                      </div>
                      <div className="todo-content">
                        <span className={`priority-${todo.priority}`}>{todo.content}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPermissionDialog && (
        <div className="permission-dialog-overlay">
          <div className="permission-dialog">
            <h3>Permission Required</h3>
            <p>{permissionRequest}</p>
            <div className="permission-actions">
              <button 
                onClick={() => handlePermissionResponse('yes')}
                className="permission-button yes"
              >
                Yes
              </button>
              <button 
                onClick={() => handlePermissionResponse('yes-always')}
                className="permission-button yes-always"
              >
                Yes & Don't ask again
              </button>
              <button 
                onClick={() => handlePermissionResponse('no')}
                className="permission-button no"
              >
                No, tell Claude differently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EnhancedTerminalApp;
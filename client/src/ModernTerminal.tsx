import React, { useState, useEffect, useRef } from 'react';
import {
  Circle,
  Clipboard,
  Loader2,
  Plus,
  Settings,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useWebSocket } from './contexts/WebSocketContext';
import { supabase } from './lib/supabase';
import { SimpleCommandUI } from './components/SimpleCommandUI';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

const ModernTerminal: React.FC = () => {
  const { status, send, onMessage, offMessage, connect, disconnect } = useWebSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showSimpleUI, setShowSimpleUI] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Check if session is active
  const sessionStarted = status === 'session-started';
  const isConnected = status === 'authenticated' || status === 'session-started';

  // Connect WebSocket on mount
  useEffect(() => {
    console.log('ModernTerminal mounted, connecting WebSocket...');
    connect().catch(err => {
      console.error('Failed to connect WebSocket:', err);
    });
  }, [connect]);

  useEffect(() => {
    const handleMessage = (data: any) => {
      if (data.type === 'output') {
        // Claude's response
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.type === 'assistant' && 
              new Date().getTime() - lastMessage.timestamp.getTime() < 1000) {
            // Append to existing assistant message if it's recent
            return [
              ...prev.slice(0, -1),
              { ...lastMessage, content: lastMessage.content + data.data }
            ];
          } else {
            // Create new assistant message
            return [...prev, {
              id: Date.now().toString(),
              type: 'assistant',
              content: data.data,
              timestamp: new Date()
            }];
          }
        });
        setIsLoading(false);
      } else if (data.type === 'status') {
        console.log('Received status:', data);
        if (data.status === 'started') {
          // Session started successfully
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'system',
            content: '✅ Session started! You can now interact with Claude.',
            timestamp: new Date()
          }]);
        } else if (data.status === 'error') {
          const errorMessage = data.error || 'Failed to process request';
          let helpText = '';
          
          if (errorMessage.includes('docker.sock') || errorMessage.includes('Docker')) {
            helpText = '\n\n💡 Make sure Docker Desktop is running. You can start it from Applications or run: open -a Docker';
          }
          
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'system',
            content: `❌ Error: ${errorMessage}${helpText}`,
            timestamp: new Date()
          }]);
          setIsLoading(false);
        }
      }
    };

    onMessage(handleMessage);
    return () => offMessage(handleMessage);
  }, [onMessage, offMessage]);

  const startSession = async () => {
    // Prevent duplicate starts
    if (status === 'session-started') return;

    try {
      // Ensure we are connected & authenticated first
      if (status !== 'authenticated') {
        console.log('🔗 Establishing WebSocket connection…');
        await connect();
      }

      // At this point the socket should be authenticated
      console.log('🚀 Sending start command');
      send({ type: 'start' });
    } catch (err) {
      console.error('Failed to start session:', err);
    }
  };

  const sendMessage = () => {
    if (!inputValue.trim() || !sessionStarted || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Send directly to PTY - the input acts like terminal input
    send({
      type: 'input',
      data: inputValue + '\n'
    });
  };

  // Handle command from palette or buttons
  const sendCommand = (command: string) => {
    if (!sessionStarted || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: command,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Send command directly to PTY
    send({
      type: 'input',
      data: command + '\n'
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Handle slash commands and special inputs
  const handleInputChange = (value: string) => {
    setInputValue(value);
    
    // If it's a slash command or special input, we can show autocomplete later
    if (value.startsWith('/')) {
      // TODO: Show slash command suggestions
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    disconnect();
    window.location.reload();
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar */}
      <div className="w-64 border-r border-border bg-card">
        <div className="p-4">
          <div className="mb-6">
            <h1 className="text-xl font-bold mb-2">OpenODE</h1>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={startSession}
              onTouchStart={startSession}
              disabled={sessionStarted}
            >
              <Plus className="h-4 w-4" />
              {sessionStarted ? 'Session Active' : 'New Session'}
            </Button>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-2">WORKSPACE</h3>
              <div className="space-y-1">
                <WorkspaceItem 
                  name="Current Project"
                  description="Active workspace"
                  isActive={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="border-b border-border bg-card px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={status === 'session-started' ? 'default' : 'secondary'}>
                {status === 'session-started' ? '🟢 Session Active' : 
                 status === 'authenticated' ? '🟡 Connected - Start Session' :
                 status === 'connecting' ? '🟠 Connecting...' :
                 status === 'error' ? '🔴 Error' :
                 '⚪ Disconnected'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowSimpleUI(!showSimpleUI)}
                title="Toggle Simple UI"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowTerminal(!showTerminal)}>
                <Clipboard className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Area or Simple UI */}
        <div className="flex-1 overflow-y-auto p-4">
          {showSimpleUI ? (
            <SimpleCommandUI />
          ) : (
            <div className="mx-auto max-w-4xl space-y-4">
            {messages.length === 0 && sessionStarted && (
              <div className="text-center py-8">
                <h3 className="text-lg font-semibold mb-2">Welcome to Claude Code</h3>
                <p className="text-muted-foreground mb-4">
                  Type commands, ask questions, or use slash commands like /help
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge variant="outline">/help - Show commands</Badge>
                  <Badge variant="outline">/model - Change model</Badge>
                  <Badge variant="outline">/init - Initialize project</Badge>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className={`space-y-2 ${
                message.type === 'user' ? 'ml-8' : ''
              }`}>
                <div className="flex items-start gap-2">
                  {message.type === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className={`flex-1 ${
                    message.type === 'user' ? 'bg-secondary rounded-lg p-3' : ''
                  }`}>
                    <pre className="whitespace-pre-wrap font-mono text-sm">
                      {message.content}
                    </pre>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                </div>
                <div className="text-muted-foreground">Claude is thinking...</div>
              </div>
            )}

            <div ref={messagesEndRef} />
            </div>
          )}
        </div>


        {/* Input Area */}
        <div className="border-t border-border p-4">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={sessionStarted ? "Type a command or ask Claude..." : "Start a session first..."}
                  disabled={!sessionStarted || isLoading}
                  className="min-h-[60px] resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                  rows={1}
                />
                <div className="mt-2 flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                    Claude 3
                  </Button>
                </div>
              </div>
              <Button 
                onClick={sendMessage}
                disabled={!sessionStarted || !inputValue.trim() || isLoading}
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Optional Terminal View */}
      {showTerminal && (
        <div className="w-96 border-l border-border bg-card p-4">
          <h3 className="text-sm font-medium mb-2">Terminal Output</h3>
          <div className="bg-black text-green-400 rounded p-2 h-96 overflow-y-auto font-mono text-xs">
            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.type === 'user' && <span className="text-blue-400">$ </span>}
                <span>{msg.content}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Workspace Item Component
interface WorkspaceItemProps {
  name: string;
  description: string;
  isActive?: boolean;
}

const WorkspaceItem: React.FC<WorkspaceItemProps> = ({ name, description, isActive }) => (
  <div className={`rounded-md p-2 cursor-pointer ${
    isActive ? "bg-secondary" : "hover:bg-secondary/50"
  }`}>
    <div className="flex items-center gap-2">
      <Circle className="h-3 w-3 text-muted-foreground" />
      <p className="font-medium text-sm">{name}</p>
    </div>
    <p className="text-xs text-muted-foreground ml-5">{description}</p>
  </div>
);

export default ModernTerminal;
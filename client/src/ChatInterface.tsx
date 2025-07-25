import React, { useState, useEffect, useRef } from 'react';
import './ChatInterface.css';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  ws: WebSocket | null;
  connected: boolean;
  sessionStarted: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ ws, connected, sessionStarted }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'output') {
        // Claude's response
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.type === 'assistant') {
            // Append to existing assistant message
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
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws]);

  const sendMessage = () => {
    if (!inputValue.trim() || !ws || !sessionStarted || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    ws.send(JSON.stringify({
      type: 'message',
      message: inputValue
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-interface">
      <div className="messages-container">
        {messages.length === 0 && sessionStarted && (
          <div className="welcome-message">
            <h3>👋 Welcome to Claude Code!</h3>
            <p>I'm here to help you with coding. You can:</p>
            <ul>
              <li>Ask me to write code</li>
              <li>Help debug issues</li>
              <li>Explain programming concepts</li>
              <li>Review and improve your code</li>
            </ul>
            <p>Just type your question below to get started!</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="message-header">
              <span className="message-author">
                {message.type === 'user' ? '👤 You' : '🤖 Claude'}
              </span>
              <span className="message-time">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
            <div className="message-content">
              {message.type === 'assistant' ? (
                <pre>{message.content}</pre>
              ) : (
                <p>{message.content}</p>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message assistant loading">
            <div className="message-header">
              <span className="message-author">🤖 Claude</span>
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="input-container">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={sessionStarted ? "Type your message..." : "Start a session first..."}
          disabled={!sessionStarted || isLoading}
          className="message-input"
        />
        <button
          onClick={sendMessage}
          disabled={!sessionStarted || !inputValue.trim() || isLoading}
          className="send-button"
        >
          {isLoading ? '⏳' : '📤'} Send
        </button>
      </div>
    </div>
  );
};
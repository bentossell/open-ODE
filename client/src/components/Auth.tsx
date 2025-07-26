import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import './Auth.css';

interface AuthProps {
  onAuthenticated: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup' | 'magiclink'>('signin');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Check your email to confirm your account!' });
    }
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      onAuthenticated();
    }
    setLoading(false);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Check your email for the magic link!' });
    }
    setLoading(false);
  };

  const handleSubmit = mode === 'signup' ? handleSignUp : 
                      mode === 'magiclink' ? handleMagicLink : 
                      handleSignIn;

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Welcome to OpenODE</h1>
        <p className="auth-subtitle">
          {mode === 'signin' && 'Sign in to access your development environment'}
          {mode === 'signup' && 'Create an account to get started'}
          {mode === 'magiclink' && 'Get a magic link sent to your email'}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={loading}
              className="form-input"
            />
          </div>

          {mode !== 'magiclink' && (
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="form-input"
              />
            </div>
          )}

          {message && (
            <div className={`auth-message ${message.type}`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="auth-button"
          >
            {loading ? 'Loading...' : 
             mode === 'signin' ? 'Sign In' :
             mode === 'signup' ? 'Sign Up' :
             'Send Magic Link'}
          </button>
        </form>

        <div className="auth-links">
          {mode === 'signin' && (
            <>
              <button onClick={() => setMode('magiclink')} className="auth-link">
                Sign in with magic link
              </button>
              <button onClick={() => setMode('signup')} className="auth-link">
                Don't have an account? Sign up
              </button>
            </>
          )}
          {mode === 'signup' && (
            <button onClick={() => setMode('signin')} className="auth-link">
              Already have an account? Sign in
            </button>
          )}
          {mode === 'magiclink' && (
            <button onClick={() => setMode('signin')} className="auth-link">
              Sign in with password instead
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
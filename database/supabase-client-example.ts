// Example implementation for using the open-ODE database with Supabase
// This file demonstrates how to integrate the database schema with your application

import { createClient } from '@supabase/supabase-js';
import type { 
  Database, 
  Session, 
  WorkspaceFile, 
  ActiveSession,
  SessionDetails,
  UserStatistics 
} from './types';

// Initialize Supabase client with type safety
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Session Management Functions
export const sessionManager = {
  // Create a new coding session
  async createSession(userId: string, workspacePath?: string, containerId?: string) {
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        workspace_path: workspacePath,
        container_id: containerId,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get all active sessions for a user
  async getActiveSessions(userId: string): Promise<ActiveSession[]> {
    const { data, error } = await supabase
      .rpc('get_user_active_sessions', { 
        p_user_id: userId 
      });

    if (error) throw error;
    return data || [];
  },

  // Get detailed information about a specific session
  async getSessionDetails(sessionId: string, userId: string): Promise<SessionDetails | null> {
    const { data, error } = await supabase
      .rpc('get_session_details', { 
        p_session_id: sessionId,
        p_user_id: userId 
      });

    if (error) throw error;
    return data?.[0] || null;
  },

  // Update session status
  async updateSessionStatus(sessionId: string, status: 'active' | 'inactive' | 'terminated') {
    const { error } = await supabase
      .from('sessions')
      .update({ status })
      .eq('id', sessionId);

    if (error) throw error;
  },

  // Terminate a session
  async terminateSession(sessionId: string) {
    await this.updateSessionStatus(sessionId, 'terminated');
  },

  // Update session activity (called when user performs actions)
  async touchSession(sessionId: string) {
    const { error } = await supabase
      .from('sessions')
      .update({ last_active: new Date().toISOString() })
      .eq('id', sessionId);

    if (error) throw error;
  }
};

// File Management Functions
export const fileManager = {
  // Track a file operation
  async trackFileOperation(
    sessionId: string, 
    userId: string,
    filePath: string,
    operation: 'created' | 'modified' | 'deleted',
    content?: string,
    sizeBytes?: number
  ) {
    const fileName = filePath.split('/').pop() || filePath;
    const fileType = fileName.split('.').pop() || null;

    const { data, error } = await supabase
      .from('workspace_files')
      .insert({
        session_id: sessionId,
        user_id: userId,
        file_path: filePath,
        file_name: fileName,
        file_type: fileType,
        operation,
        content,
        size_bytes: sizeBytes
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get all files for a session
  async getSessionFiles(sessionId: string, userId: string) {
    const { data, error } = await supabase
      .rpc('get_session_files', {
        p_session_id: sessionId,
        p_user_id: userId
      });

    if (error) throw error;
    return data || [];
  },

  // Search files across all user sessions
  async searchFiles(userId: string, searchTerm: string, limit = 50) {
    const { data, error } = await supabase
      .rpc('search_user_files', {
        p_user_id: userId,
        p_search_term: searchTerm,
        p_limit: limit
      });

    if (error) throw error;
    return data || [];
  },

  // Get file content
  async getFileContent(fileId: string, userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('workspace_files')
      .select('content')
      .eq('id', fileId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data?.content || null;
  }
};

// User Statistics Functions
export const userStats = {
  // Get comprehensive user statistics
  async getUserStatistics(userId: string): Promise<UserStatistics | null> {
    const { data, error } = await supabase
      .rpc('get_user_statistics', {
        p_user_id: userId
      });

    if (error) throw error;
    return data?.[0] || null;
  },

  // Get user profile
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: {
    full_name?: string;
    avatar_url?: string;
  }) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Real-time subscriptions
export const subscriptions = {
  // Subscribe to session updates
  subscribeToSession(sessionId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`session:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${sessionId}`
        },
        callback
      )
      .subscribe();
  },

  // Subscribe to file changes in a session
  subscribeToSessionFiles(sessionId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`session-files:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_files',
          filter: `session_id=eq.${sessionId}`
        },
        callback
      )
      .subscribe();
  },

  // Unsubscribe from a channel
  unsubscribe(channel: any) {
    supabase.removeChannel(channel);
  }
};

// Utility functions
export const utilities = {
  // Clean up inactive sessions (can be called periodically)
  async cleanupInactiveSessions(inactiveHours = 24) {
    const { data, error } = await supabase
      .rpc('terminate_inactive_sessions', {
        p_inactive_hours: inactiveHours
      });

    if (error) throw error;
    return data;
  },

  // Initialize user profile (called after user signup)
  async initializeUserProfile(userId: string, email: string, metadata?: any) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email,
        full_name: metadata?.full_name,
        avatar_url: metadata?.avatar_url
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Example usage in a React component
/*
import { useEffect, useState } from 'react';
import { sessionManager, fileManager, subscriptions } from './supabase-client';

function CodeEditor({ userId, sessionId }) {
  const [files, setFiles] = useState([]);

  useEffect(() => {
    // Load session files
    loadFiles();

    // Subscribe to file changes
    const channel = subscriptions.subscribeToSessionFiles(sessionId, (payload) => {
      console.log('File changed:', payload);
      loadFiles(); // Reload files on change
    });

    return () => {
      subscriptions.unsubscribe(channel);
    };
  }, [sessionId]);

  const loadFiles = async () => {
    const sessionFiles = await fileManager.getSessionFiles(sessionId, userId);
    setFiles(sessionFiles);
  };

  const handleFileCreate = async (filePath: string, content: string) => {
    await fileManager.trackFileOperation(
      sessionId,
      userId,
      filePath,
      'created',
      content,
      new Blob([content]).size
    );
  };

  return (
    // Your component JSX
  );
}
*/
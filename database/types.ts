// Database types for open-ODE project
// These types match the database schema created in schema.sql

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          last_active: string;
          workspace_path: string | null;
          container_id: string | null;
          status: 'active' | 'inactive' | 'terminated';
          metadata: Record<string, any>;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          last_active?: string;
          workspace_path?: string | null;
          container_id?: string | null;
          status?: 'active' | 'inactive' | 'terminated';
          metadata?: Record<string, any>;
        };
        Update: {
          last_active?: string;
          workspace_path?: string | null;
          container_id?: string | null;
          status?: 'active' | 'inactive' | 'terminated';
          metadata?: Record<string, any>;
        };
      };
      workspace_files: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          file_path: string;
          file_name: string;
          file_type: string | null;
          operation: 'created' | 'modified' | 'deleted';
          content: string | null;
          size_bytes: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          file_path: string;
          file_name: string;
          file_type?: string | null;
          operation: 'created' | 'modified' | 'deleted';
          content?: string | null;
          size_bytes?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          file_path?: string;
          file_name?: string;
          file_type?: string | null;
          operation?: 'created' | 'modified' | 'deleted';
          content?: string | null;
          size_bytes?: number | null;
          updated_at?: string;
        };
      };
    };
    Functions: {
      get_user_active_sessions: {
        Args: {
          p_user_id: string;
        };
        Returns: {
          session_id: string;
          created_at: string;
          last_active: string;
          workspace_path: string | null;
          container_id: string | null;
          file_count: number;
        }[];
      };
      get_session_details: {
        Args: {
          p_session_id: string;
          p_user_id: string;
        };
        Returns: {
          session_id: string;
          created_at: string;
          last_active: string;
          workspace_path: string | null;
          container_id: string | null;
          status: string;
          total_files: number;
          files_created: number;
          files_modified: number;
          files_deleted: number;
          total_size_bytes: number;
        }[];
      };
      get_session_files: {
        Args: {
          p_session_id: string;
          p_user_id: string;
        };
        Returns: {
          file_id: string;
          file_path: string;
          file_name: string;
          file_type: string | null;
          operation: string;
          size_bytes: number | null;
          created_at: string;
          updated_at: string;
        }[];
      };
      terminate_inactive_sessions: {
        Args: {
          p_inactive_hours?: number;
        };
        Returns: number;
      };
      get_user_statistics: {
        Args: {
          p_user_id: string;
        };
        Returns: {
          total_sessions: number;
          active_sessions: number;
          total_files_created: number;
          total_storage_bytes: number;
          first_session_date: string | null;
          last_active_date: string | null;
        }[];
      };
      search_user_files: {
        Args: {
          p_user_id: string;
          p_search_term: string;
          p_limit?: number;
        };
        Returns: {
          file_id: string;
          session_id: string;
          file_path: string;
          file_name: string;
          file_type: string | null;
          updated_at: string;
        }[];
      };
    };
  };
}

// Convenience type exports
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Session = Database['public']['Tables']['sessions']['Row'];
export type WorkspaceFile = Database['public']['Tables']['workspace_files']['Row'];

export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type SessionInsert = Database['public']['Tables']['sessions']['Insert'];
export type WorkspaceFileInsert = Database['public']['Tables']['workspace_files']['Insert'];

export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type SessionUpdate = Database['public']['Tables']['sessions']['Update'];
export type WorkspaceFileUpdate = Database['public']['Tables']['workspace_files']['Update'];

// Helper types for function returns
export type ActiveSession = Database['public']['Functions']['get_user_active_sessions']['Returns'][0];
export type SessionDetails = Database['public']['Functions']['get_session_details']['Returns'][0];
export type SessionFile = Database['public']['Functions']['get_session_files']['Returns'][0];
export type UserStatistics = Database['public']['Functions']['get_user_statistics']['Returns'][0];
export type FileSearchResult = Database['public']['Functions']['search_user_files']['Returns'][0];
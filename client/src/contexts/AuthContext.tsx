import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthContextType {
  // Auth state
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  
  // Auth methods
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  
  // Profile methods
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  
  // Session methods
  refreshSession: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile from database
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data as UserProfile;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    }
  }, []);

  // Create or update user profile
  const createOrUpdateProfile = useCallback(async (user: User) => {
    try {
      const profile: UserProfile = {
        id: user.id,
        email: user.email!,
        displayName: user.user_metadata?.display_name || user.email?.split('@')[0],
        avatarUrl: user.user_metadata?.avatar_url,
        updatedAt: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(profile, { onConflict: 'id' });

      if (error) {
        console.error('Error updating profile:', error);
        return null;
      }

      return profile;
    } catch (err) {
      console.error('Error updating profile:', err);
      return null;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (session) {
          setSession(session);
          setUser(session.user);
          
          // Fetch or create profile
          // Temporarily skip profile fetching to avoid blocking
          // let profile = await fetchProfile(session.user.id);
          // if (!profile) {
          //   profile = await createOrUpdateProfile(session.user);
          // }
          // setProfile(profile);
          setProfile(null); // Skip profile for now
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [fetchProfile, createOrUpdateProfile]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('Auth state changed:', event, session);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch or create profile on sign in
          // Temporarily skip profile fetching to avoid blocking
          // let profile = await fetchProfile(session.user.id);
          // if (!profile) {
          //   profile = await createOrUpdateProfile(session.user);
          // }
          // setProfile(profile);
          setProfile(null); // Skip profile for now
        } else {
          // Clear profile on sign out
          setProfile(null);
        }

        // Handle specific auth events
        switch (event) {
          case 'SIGNED_IN':
            setError(null);
            break;
          case 'SIGNED_OUT':
            setError(null);
            break;
          case 'TOKEN_REFRESHED':
            console.log('Token refreshed successfully');
            break;
          case 'USER_UPDATED':
            if (session?.user) {
              await createOrUpdateProfile(session.user);
            }
            break;
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile, createOrUpdateProfile]);

  // Auth methods
  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        setError(error.message);
        return { error };
      }
      
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred during sign in');
      setError(error.message);
      return { error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.signUp({ email, password });
      
      if (error) {
        setError(error.message);
        return { error };
      }
      
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred during sign up');
      setError(error.message);
      return { error };
    }
  };

  const signInWithMagicLink = async (email: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      
      if (error) {
        setError(error.message);
        return { error };
      }
      
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred sending magic link');
      setError(error.message);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        setError(error.message);
        return { error };
      }
      
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred during sign out');
      setError(error.message);
      return { error };
    }
  };

  // Profile methods
  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (!user) {
        const error = new Error('No user logged in');
        setError(error.message);
        return { error };
      }

      setError(null);
      
      // Update profile in database
      const { error: dbError } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (dbError) {
        setError(dbError.message);
        return { error: dbError };
      }

      // Update user metadata if display name or avatar changed
      if (updates.displayName || updates.avatarUrl) {
        const { error: metaError } = await supabase.auth.updateUser({
          data: {
            display_name: updates.displayName,
            avatar_url: updates.avatarUrl,
          },
        });

        if (metaError) {
          setError(metaError.message);
          return { error: metaError };
        }
      }

      // Refresh profile
      await refreshProfile();
      
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred updating profile');
      setError(error.message);
      return { error };
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    
    const profile = await fetchProfile(user.id);
    if (profile) {
      setProfile(profile);
    }
  };

  // Session methods
  const refreshSession = async () => {
    try {
      setError(null);
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        setError(error.message);
        return { error };
      }
      
      if (session) {
        setSession(session);
        setUser(session.user);
      }
      
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred refreshing session');
      setError(error.message);
      return { error };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    error,
    signIn,
    signUp,
    signInWithMagicLink,
    signOut,
    updateProfile,
    refreshProfile,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// HOC for protecting routes
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  LoadingComponent?: React.ComponentType,
  RedirectComponent?: React.ComponentType
) => {
  return (props: P) => {
    const { user, loading } = useAuth();

    if (loading) {
      return LoadingComponent ? <LoadingComponent /> : <div>Loading...</div>;
    }

    if (!user) {
      return RedirectComponent ? <RedirectComponent /> : <div>Please sign in</div>;
    }

    return <Component {...props} />;
  };
};
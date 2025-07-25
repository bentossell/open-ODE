-- Open-ODE Database Schema
-- This file creates all necessary tables and security policies for the open-ODE project

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create sessions table for tracking Claude sessions
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    workspace_path TEXT,
    container_id TEXT,
    status TEXT CHECK (status IN ('active', 'inactive', 'terminated')) DEFAULT 'active',
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create workspace_files table for tracking files created/modified in sessions
CREATE TABLE IF NOT EXISTS public.workspace_files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT,
    operation TEXT CHECK (operation IN ('created', 'modified', 'deleted')) NOT NULL,
    content TEXT,
    size_bytes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(session_id, file_path, updated_at)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_last_active ON public.sessions(last_active);
CREATE INDEX IF NOT EXISTS idx_workspace_files_session_id ON public.workspace_files(session_id);
CREATE INDEX IF NOT EXISTS idx_workspace_files_user_id ON public.workspace_files(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_files_created_at ON public.workspace_files(created_at);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles table
-- Users can only read their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for sessions table
-- Users can only view their own sessions
CREATE POLICY "Users can view own sessions" ON public.sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only create sessions for themselves
CREATE POLICY "Users can create own sessions" ON public.sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own sessions
CREATE POLICY "Users can update own sessions" ON public.sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own sessions
CREATE POLICY "Users can delete own sessions" ON public.sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for workspace_files table
-- Users can only view their own workspace files
CREATE POLICY "Users can view own workspace files" ON public.workspace_files
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only create workspace files for themselves
CREATE POLICY "Users can create own workspace files" ON public.workspace_files
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own workspace files
CREATE POLICY "Users can update own workspace files" ON public.workspace_files
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own workspace files
CREATE POLICY "Users can delete own workspace files" ON public.workspace_files
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        new.id,
        new.email,
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'avatar_url'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_workspace_files_updated_at ON public.workspace_files;
CREATE TRIGGER update_workspace_files_updated_at
    BEFORE UPDATE ON public.workspace_files
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update session last_active
CREATE OR REPLACE FUNCTION public.update_session_last_active()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.sessions
    SET last_active = timezone('utc'::text, now())
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update session last_active when files are modified
DROP TRIGGER IF EXISTS update_session_activity ON public.workspace_files;
CREATE TRIGGER update_session_activity
    AFTER INSERT OR UPDATE ON public.workspace_files
    FOR EACH ROW
    EXECUTE FUNCTION public.update_session_last_active();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Add helpful comments
COMMENT ON TABLE public.profiles IS 'User profile information linked to auth.users';
COMMENT ON TABLE public.sessions IS 'Claude session tracking for workspace management';
COMMENT ON TABLE public.workspace_files IS 'Files created or modified during Claude sessions';
COMMENT ON COLUMN public.sessions.status IS 'Session status: active, inactive, or terminated';
COMMENT ON COLUMN public.sessions.container_id IS 'Docker container ID if using containerized workspaces';
COMMENT ON COLUMN public.workspace_files.operation IS 'File operation type: created, modified, or deleted';
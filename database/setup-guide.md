# Open-ODE Database Setup Guide

This guide explains how to set up the database schema for the open-ODE project in Supabase.

## Prerequisites

- A Supabase project (create one at https://app.supabase.com)
- Supabase project URL and anon key
- Access to the Supabase SQL Editor or Supabase CLI

## Setup Methods

### Method 1: Using Supabase Dashboard (Recommended)

1. **Access SQL Editor**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor in the left sidebar

2. **Execute Schema**
   - Click "New query"
   - Copy the entire contents of `database/schema.sql`
   - Paste into the SQL editor
   - Click "Run" or press Cmd/Ctrl + Enter

3. **Execute Helper Functions**
   - Create another new query
   - Copy the entire contents of `database/queries.sql`
   - Paste and run

4. **Verify Setup**
   - Go to Table Editor in the dashboard
   - You should see:
     - `profiles` table
     - `sessions` table
     - `workspace_files` table

### Method 2: Using Supabase CLI

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Login and Link Project**
   ```bash
   supabase login
   supabase link --project-ref your-project-ref
   ```

3. **Run Migrations**
   ```bash
   supabase db push database/schema.sql
   supabase db push database/queries.sql
   ```

### Method 3: Using Direct Connection

If you have direct database access:

```bash
psql postgresql://[user]:[password]@[host]:[port]/[database] -f database/schema.sql
psql postgresql://[user]:[password]@[host]:[port]/[database] -f database/queries.sql
```

## Post-Setup Configuration

### 1. Enable Realtime (Optional)

If you want real-time updates for sessions:

```sql
-- Enable realtime for sessions table
ALTER publication supabase_realtime ADD TABLE public.sessions;

-- Enable realtime for workspace_files table
ALTER publication supabase_realtime ADD TABLE public.workspace_files;
```

### 2. Storage Bucket (Optional)

If you want to store actual file contents in Supabase Storage:

```sql
-- This would be done in the Supabase dashboard under Storage
-- Create a bucket named 'workspace-files' with appropriate policies
```

### 3. Configure Authentication

Ensure your authentication settings are properly configured:
- Go to Authentication → Settings
- Set up email authentication
- Configure redirect URLs
- Set up custom SMTP if needed (see supabase-auth-setup-guide.md)

## Database Schema Overview

### Tables

1. **profiles**
   - Linked to auth.users
   - Stores additional user information
   - Automatically created on user signup

2. **sessions**
   - Tracks Claude coding sessions
   - Includes workspace path and container ID
   - Status tracking (active, inactive, terminated)

3. **workspace_files**
   - Tracks all files created/modified in sessions
   - Includes file metadata and operations
   - Links to both session and user

### Security

All tables have Row Level Security (RLS) enabled with policies ensuring:
- Users can only access their own data
- No cross-user data access
- Automatic user isolation

### Helper Functions

The setup includes several useful functions:
- `get_user_active_sessions()` - List user's active sessions
- `get_session_details()` - Get detailed session information
- `get_session_files()` - List files in a session
- `terminate_inactive_sessions()` - Clean up old sessions
- `get_user_statistics()` - User usage statistics
- `search_user_files()` - Search across all user files

## Integration with Application

### TypeScript Types

Create these types in your application:

```typescript
export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  created_at: string;
  last_active: string;
  workspace_path: string | null;
  container_id: string | null;
  status: 'active' | 'inactive' | 'terminated';
  metadata: Record<string, any>;
}

export interface WorkspaceFile {
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
}
```

### Example Usage

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Create a new session
const { data: session, error } = await supabase
  .from('sessions')
  .insert({
    user_id: user.id,
    workspace_path: '/workspace/project1',
    container_id: 'docker-123'
  })
  .select()
  .single();

// Track a file creation
const { data: file, error } = await supabase
  .from('workspace_files')
  .insert({
    session_id: session.id,
    user_id: user.id,
    file_path: '/workspace/project1/index.js',
    file_name: 'index.js',
    file_type: 'javascript',
    operation: 'created',
    size_bytes: 1024
  });

// Get user's active sessions
const { data: sessions, error } = await supabase
  .rpc('get_user_active_sessions', { 
    p_user_id: user.id 
  });
```

## Maintenance

### Regular Tasks

1. **Clean up inactive sessions** (recommended daily)
   ```sql
   SELECT terminate_inactive_sessions(24); -- Terminate sessions inactive for 24 hours
   ```

2. **Monitor storage usage**
   ```sql
   SELECT 
     COUNT(*) as total_files,
     pg_size_pretty(SUM(size_bytes)::bigint) as total_size
   FROM workspace_files;
   ```

3. **Archive old data** (optional, monthly)
   ```sql
   -- Move old sessions and files to archive tables
   -- Implementation depends on your retention policy
   ```

## Troubleshooting

### Common Issues

1. **RLS policies blocking access**
   - Ensure user is authenticated
   - Check auth.uid() matches the user_id in queries

2. **Profile not created automatically**
   - Verify the trigger is active
   - Check if email is properly set in auth.users

3. **Functions not accessible**
   - Ensure GRANT statements were executed
   - User must be authenticated

### Testing

Test the setup with these queries:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'sessions', 'workspace_files');

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'sessions', 'workspace_files');

-- Check policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

## Next Steps

1. Install Supabase client library in your application
2. Set up authentication flow
3. Implement session management
4. Add file tracking functionality
5. Create UI for workspace management

For authentication setup, refer to `supabase-auth-setup-guide.md`.
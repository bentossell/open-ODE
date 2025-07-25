# AuthContext Usage Guide

This authentication context provides a complete authentication solution for your React application using Supabase.

## Features

1. **Auth State Management**: Manages user, session, and profile state
2. **Auth State Changes**: Automatically handles auth state changes via Supabase listeners
3. **Sign Out Functionality**: Provides easy sign out with automatic cleanup
4. **User Profile Management**: Manages user profile data with database persistence
5. **Session Refresh**: Handles token refresh to keep sessions active
6. **useAuth Hook**: Easy consumption of auth state and methods

## Setup

### 1. Database Setup

Create a `profiles` table in your Supabase database:

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### 2. Wrap Your App

```tsx
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      {/* Your app components */}
    </AuthProvider>
  );
}
```

### 3. Use in Components

```tsx
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { user, profile, signOut } = useAuth();
  
  if (!user) {
    return <div>Please sign in</div>;
  }
  
  return (
    <div>
      <h1>Welcome, {profile?.displayName || user.email}!</h1>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

## API Reference

### useAuth Hook

Returns an object with:

- `user`: Current Supabase user object
- `session`: Current session object
- `profile`: User profile from database
- `loading`: Loading state
- `error`: Error message if any
- `signIn(email, password)`: Sign in with email/password
- `signUp(email, password)`: Create new account
- `signInWithMagicLink(email)`: Send magic link to email
- `signOut()`: Sign out user
- `updateProfile(updates)`: Update user profile
- `refreshProfile()`: Refresh profile from database
- `refreshSession()`: Refresh auth token

### withAuth HOC

Protects components requiring authentication:

```tsx
const ProtectedComponent = withAuth(
  YourComponent,
  CustomLoadingComponent, // optional
  CustomRedirectComponent  // optional
);
```

## Examples

See `/src/examples/AuthUsageExamples.tsx` for complete examples of:

- User profile management
- Protected routes
- Session management
- Complete auth flows
- Custom loading/redirect components
import React, { useState } from 'react';
import { useAuth, withAuth } from '../contexts/AuthContext';

// Example 1: Using useAuth hook in a component
export const UserProfile: React.FC = () => {
  const { user, profile, loading, updateProfile, signOut } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [updating, setUpdating] = useState(false);

  if (loading) {
    return <div>Loading profile...</div>;
  }

  if (!user || !profile) {
    return <div>No user logged in</div>;
  }

  const handleUpdateProfile = async () => {
    setUpdating(true);
    const { error } = await updateProfile({ displayName });
    if (error) {
      alert('Error updating profile: ' + error.message);
    } else {
      alert('Profile updated successfully!');
    }
    setUpdating(false);
  };

  return (
    <div>
      <h2>User Profile</h2>
      <p>Email: {profile.email}</p>
      <p>User ID: {profile.id}</p>
      <div>
        <label>
          Display Name:
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={updating}
          />
        </label>
        <button onClick={handleUpdateProfile} disabled={updating}>
          {updating ? 'Updating...' : 'Update Profile'}
        </button>
      </div>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
};

// Example 2: Protected component using withAuth HOC
const DashboardComponent: React.FC = () => {
  const { user, profile } = useAuth();
  
  return (
    <div>
      <h1>Welcome, {profile?.displayName || user?.email}!</h1>
      <p>This is a protected dashboard component.</p>
    </div>
  );
};

export const ProtectedDashboard = withAuth(DashboardComponent);

// Example 3: Custom loading and redirect components with withAuth
const CustomLoadingComponent = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh' 
  }}>
    <div className="spinner">Loading...</div>
  </div>
);

const CustomRedirectComponent = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await signIn(email, password);
    if (error) {
      alert('Sign in failed: ' + error.message);
    }
  };
  
  return (
    <div>
      <h2>Please sign in to continue</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Sign In</button>
      </form>
    </div>
  );
};

export const CustomProtectedComponent = withAuth(
  DashboardComponent,
  CustomLoadingComponent,
  CustomRedirectComponent
);

// Example 4: Session management
export const SessionManager: React.FC = () => {
  const { session, refreshSession, error } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefreshSession = async () => {
    setRefreshing(true);
    const { error } = await refreshSession();
    if (error) {
      alert('Failed to refresh session: ' + error.message);
    } else {
      alert('Session refreshed successfully!');
    }
    setRefreshing(false);
  };

  return (
    <div>
      <h3>Session Information</h3>
      {session ? (
        <>
          <p>Session expires at: {new Date(session.expires_at!).toLocaleString()}</p>
          <p>Access token: {session.access_token.substring(0, 20)}...</p>
          <button onClick={handleRefreshSession} disabled={refreshing}>
            {refreshing ? 'Refreshing...' : 'Refresh Session'}
          </button>
        </>
      ) : (
        <p>No active session</p>
      )}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
    </div>
  );
};

// Example 5: Complete auth flow component
export const CompleteAuthFlow: React.FC = () => {
  const { user, loading, signIn, signUp, signInWithMagicLink, signOut, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup' | 'magiclink'>('signin');
  const [isLoading, setIsLoading] = useState(false);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (user) {
    return (
      <div>
        <p>Logged in as: {user.email}</p>
        <button onClick={signOut}>Sign Out</button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    let result;
    switch (mode) {
      case 'signin':
        result = await signIn(email, password);
        break;
      case 'signup':
        result = await signUp(email, password);
        break;
      case 'magiclink':
        result = await signInWithMagicLink(email);
        break;
    }

    if (result.error) {
      alert(`Error: ${result.error.message}`);
    } else if (mode === 'magiclink') {
      alert('Check your email for the magic link!');
    } else if (mode === 'signup') {
      alert('Check your email to confirm your account!');
    }

    setIsLoading(false);
  };

  return (
    <div>
      <h2>
        {mode === 'signin' ? 'Sign In' : 
         mode === 'signup' ? 'Sign Up' : 
         'Magic Link'}
      </h2>
      
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
        
        {mode !== 'magiclink' && (
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        )}
        
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Loading...' : 
           mode === 'signin' ? 'Sign In' :
           mode === 'signup' ? 'Sign Up' :
           'Send Magic Link'}
        </button>
      </form>
      
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      
      <div>
        <button onClick={() => setMode('signin')}>Sign In</button>
        <button onClick={() => setMode('signup')}>Sign Up</button>
        <button onClick={() => setMode('magiclink')}>Magic Link</button>
      </div>
    </div>
  );
};
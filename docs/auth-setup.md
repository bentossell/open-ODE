# Authentication Setup for Claude Web Terminal

## Overview
The server now includes Supabase JWT authentication to secure WebSocket connections and API endpoints. All sessions are associated with authenticated users.

## Environment Variables
Set the following environment variable before starting the server:

```bash
export SUPABASE_JWT_SECRET="your-supabase-jwt-secret"
```

You can find your JWT secret in your Supabase project settings under Settings > API > JWT Secret.

## WebSocket Authentication Flow

1. **Connect to WebSocket**
   ```javascript
   const ws = new WebSocket('ws://localhost:8081');
   ```

2. **Send Authentication Token**
   ```javascript
   ws.send(JSON.stringify({
     type: 'auth',
     token: 'your-supabase-access-token'
   }));
   ```

3. **Handle Authentication Response**
   ```javascript
   ws.onmessage = (event) => {
     const data = JSON.parse(event.data);
     if (data.type === 'auth') {
       if (data.status === 'authenticated') {
         console.log('Authenticated! Session ID:', data.sessionId);
         // Now you can send 'start' command
       } else {
         console.error('Authentication failed:', data.error);
       }
     }
   };
   ```

4. **Start Session (after authentication)**
   ```javascript
   ws.send(JSON.stringify({
     type: 'start',
     projectPath: '/path/to/project' // optional
   }));
   ```

## API Endpoints

### Public Endpoints
- `GET /api/health` - Server health check
- `GET /api/config` - Get server configuration

### Authenticated Endpoints (require Bearer token)

1. **Get User Info**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/user/info
   ```

2. **Get User Sessions**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/user/sessions
   ```

3. **Stop a Session**
   ```bash
   curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/user/sessions/SESSION_ID/stop
   ```

## Client Implementation Example

```javascript
// Get Supabase session
const { data: { session } } = await supabase.auth.getSession();

if (session) {
  // Use session.access_token for authentication
  const ws = new WebSocket('ws://localhost:8081');
  
  ws.onopen = () => {
    // Authenticate immediately after connection
    ws.send(JSON.stringify({
      type: 'auth',
      token: session.access_token
    }));
  };
  
  // Make API calls with token
  const response = await fetch('/api/user/sessions', {
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  });
}
```

## Security Features

1. **JWT Verification**: All tokens are verified using the Supabase JWT secret
2. **User Isolation**: Sessions are tracked per user
3. **Session Ownership**: Users can only stop their own sessions
4. **Workspace Isolation**: User workspaces are separated by user ID
5. **Authentication Required**: All WebSocket operations require authentication

## Installation

Don't forget to install the new dependency:
```bash
npm install
```

## Troubleshooting

1. **"Server authentication not configured"**: Set the SUPABASE_JWT_SECRET environment variable
2. **"Invalid or expired token"**: Check that your Supabase session is still valid
3. **"Authentication required"**: Send the auth message before any other WebSocket commands
# Environment Setup Guide

This guide explains how to configure the Claude Web Terminal environment for both development and production use.

## Quick Setup

Run the automated setup script:

```bash
./setup-environment.sh
```

This interactive script will:
- Guide you through all required configuration
- Create `.env` files with your settings
- Validate your inputs
- Provide next steps

## Required Environment Variables

### 1. Anthropic API Key
- **Where to get it**: [console.anthropic.com/account/keys](https://console.anthropic.com/account/keys)
- **Used for**: Authenticating with Claude API
- **Variable**: `ANTHROPIC_API_KEY`

### 2. Supabase Configuration
- **Where to get it**: Your Supabase project dashboard
- **Required values**:
  - `SUPABASE_JWT_SECRET`: Found in Project Settings > API > JWT Settings
  - `REACT_APP_SUPABASE_URL`: Your project URL (e.g., https://xxxxx.supabase.co)
  - `REACT_APP_SUPABASE_ANON_KEY`: Found in Project Settings > API > Project API keys

## File Structure

```
claude-web-terminal/
├── .env                    # Server environment variables
├── .env.example           # Server example configuration
├── .env.development       # Development defaults (optional)
├── client/
│   ├── .env              # Client environment variables
│   ├── .env.example      # Client example configuration
│   └── .env.development  # Client development defaults (optional)
└── setup-environment.sh   # Interactive setup script
```

## Development vs Production

### Development Setup

1. Use `.env.development` files as templates:
   ```bash
   cp .env.development .env
   cp client/.env.development client/.env
   ```

2. Update with your actual API keys

3. Features enabled by default:
   - Extended session timeout (60 minutes)
   - File upload enabled
   - Authentication disabled for easier testing
   - Debug mode enabled

### Production Setup

1. Use the setup script or `.env.example` files
2. Configure with production values:
   - Use HTTPS/WSS URLs
   - Enable authentication
   - Set appropriate session limits
   - Use production API keys

## Security Best Practices

1. **Never commit `.env` files** - They're already in `.gitignore`
2. **Use strong JWT secrets** - Generate with: `openssl rand -base64 32`
3. **Rotate API keys regularly**
4. **Use environment-specific keys** - Don't share development and production keys
5. **Set appropriate CORS policies** in production

## Troubleshooting

### Missing Environment Variables

If you see errors about missing environment variables:

1. Check that both `.env` files exist:
   ```bash
   ls -la .env
   ls -la client/.env
   ```

2. Verify required variables are set:
   ```bash
   grep ANTHROPIC_API_KEY .env
   grep SUPABASE_JWT_SECRET .env
   grep REACT_APP_SUPABASE_URL client/.env
   ```

### Authentication Issues

If authentication isn't working:

1. Verify Supabase configuration matches your project
2. Check JWT secret is correct (no extra spaces)
3. Ensure client and server are using matching configuration

### Port Conflicts

If ports are already in use:

1. Change ports in `.env` files
2. Update client URLs to match:
   - `REACT_APP_API_URL`
   - `REACT_APP_WS_URL`

## Next Steps

After setting up your environment:

1. Install dependencies:
   ```bash
   npm install
   cd client && npm install
   ```

2. Build Docker image (if not already done):
   ```bash
   docker build -t claude-env /path/to/claude-docker-setup
   ```

3. Start the application:
   ```bash
   # Terminal 1 - Start server
   npm start
   
   # Terminal 2 - Start client (development)
   cd client && npm start
   ```

4. For production, build the client:
   ```bash
   cd client && npm run build
   ```

## Additional Resources

- [Supabase Authentication Setup Guide](./supabase-auth-setup-guide.md)
- [Main README](./README.md)
- [Database Setup Guide](./database/setup-guide.md)
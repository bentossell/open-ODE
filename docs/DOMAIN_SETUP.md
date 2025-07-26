# Domain Setup Guide for openode.ai

## DNS Configuration

Ensure your domain registrar/DNS provider has these records:

```
Type    Name    Value               TTL
A       @       167.71.89.150       300
A       www     167.71.89.150       300
CNAME   staging 167.71.89.150       300
```

## What's Configured

1. **Main Domain**: `openode.ai`
   - Automatically gets HTTPS via Let's Encrypt
   - Handles both HTTP and WebSocket traffic

2. **WWW Redirect**: `www.openode.ai`
   - Permanently redirects to `openode.ai`

3. **Staging Environment**: `staging.openode.ai`
   - For testing new features before production

4. **Direct IP Access**: `http://167.71.89.150`
   - Still works for direct access

## Automatic HTTPS

Caddy automatically obtains and renews SSL certificates from Let's Encrypt for:
- openode.ai
- www.openode.ai
- staging.openode.ai

No manual certificate management needed!

## WebSocket Support

The application uses WebSocket connections for real-time terminal communication. These are automatically handled at:
- `wss://openode.ai/ws` (production)
- `ws://167.71.89.150/ws` (direct IP, no SSL)

## Testing Your Domain

Once DNS propagates (5-30 minutes), test:

1. **Main site**: https://openode.ai
2. **WWW redirect**: https://www.openode.ai (should redirect)
3. **WebSocket**: Open the app and start a terminal session
4. **SSL Certificate**: Check the padlock icon in your browser

## Troubleshooting

If the domain doesn't work:

1. **Check DNS propagation**:
   ```bash
   dig openode.ai
   nslookup openode.ai
   ```

2. **Check Caddy logs on server**:
   ```bash
   ssh root@167.71.89.150
   docker logs claude-web-terminal-caddy-1
   ```

3. **Force certificate renewal** (if needed):
   ```bash
   docker exec claude-web-terminal-caddy-1 caddy reload
   ```

## Security Headers

The following security headers are automatically added:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: no-referrer-when-downgrade
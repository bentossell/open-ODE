# Production Build Optimizations

This guide covers important considerations and optimizations when deploying from GitHub to DigitalOcean.

## Build Optimizations

### 1. Multi-Stage Docker Builds

Update your `Dockerfile` for smaller production images:

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY client/package*.json ./client/
RUN npm ci --only=production
RUN cd client && npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
RUN apk add --no-cache docker-cli
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/client/build ./client/build
COPY --from=builder /app/server.js ./
COPY --from=builder /app/package.json ./
EXPOSE 3000 8081
CMD ["node", "server.js"]
```

### 2. Environment-Specific Builds

Create `.env.production` for production settings:

```bash
NODE_ENV=production
REACT_APP_WS_URL=wss://openode.ai:8081
REACT_APP_API_URL=https://openode.ai
```

### 3. Caching Strategy

Update your GitHub Actions workflow to use Docker layer caching:

```yaml
- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v3

- name: Build with cache
  uses: docker/build-push-action@v5
  with:
    context: .
    push: false
    cache-from: type=registry,ref=user/app:buildcache
    cache-to: type=registry,ref=user/app:buildcache,mode=max
```

## Common Deployment Issues

### 1. Environment Variables
**Issue**: React app can't access environment variables
**Solution**: 
- Use `REACT_APP_` prefix for all client-side variables
- Rebuild the React app when changing these variables
- Never expose sensitive data in React environment variables

### 2. WebSocket Connection
**Issue**: WebSocket fails in production
**Solution**:
- Ensure Caddy/Nginx properly proxies WebSocket connections
- Use relative WebSocket URLs that adapt to HTTPS
- Check firewall allows WebSocket port

### 3. File Permissions
**Issue**: Docker can't access workspace directories
**Solution**:
```bash
# Fix permissions on DigitalOcean
chown -R 1000:1000 /opt/open-ODE/workspaces
```

### 4. Memory Issues
**Issue**: Build fails with "JavaScript heap out of memory"
**Solution**:
```bash
# Increase Node memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
```

## Performance Optimizations

### 1. Enable Gzip Compression

Add to your Express server:
```javascript
const compression = require('compression');
app.use(compression());
```

### 2. Implement Caching Headers

```javascript
// Static assets with long cache
app.use(express.static(path.join(__dirname, 'client/build'), {
  maxAge: '1y',
  etag: false
}));

// API responses with short cache
app.get('/api/config', (req, res) => {
  res.set('Cache-Control', 'public, max-age=300');
  res.json(config);
});
```

### 3. Use PM2 for Process Management

Instead of running Node directly:

```bash
# Install PM2
npm install -g pm2

# Create ecosystem.config.js
module.exports = {
  apps: [{
    name: 'openode',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    }
  }]
};

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Monitoring and Debugging

### 1. Add Logging

Create a proper logging setup:
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### 2. Health Monitoring

Add comprehensive health checks:
```javascript
app.get('/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    checks: {
      docker: await checkDocker(),
      memory: process.memoryUsage(),
      sessions: sessions.size
    }
  };
  
  res.status(200).json(health);
});
```

### 3. Error Tracking

Consider adding Sentry for production error tracking:
```javascript
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});
```

## Security Hardening

### 1. Rate Limiting
```javascript
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 2. Security Headers
```javascript
const helmet = require('helmet');
app.use(helmet());
```

### 3. Input Validation
Always validate user input before processing:
```javascript
const { body, validationResult } = require('express-validator');

app.post('/api/session',
  body('workspaceId').isUUID(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Process request
  }
);
```

## Deployment Checklist

Before each deployment:

- [ ] Run tests locally
- [ ] Check for console.log statements to remove
- [ ] Verify all environment variables are set
- [ ] Test WebSocket connections
- [ ] Check Docker image builds successfully
- [ ] Verify health endpoint responds
- [ ] Monitor logs during deployment
- [ ] Test critical user flows after deployment

## Zero-Downtime Deployment

To achieve zero-downtime deployments:

1. Use health checks in your deployment script
2. Implement graceful shutdown in your app
3. Use rolling updates with Docker Swarm or Kubernetes
4. Consider blue-green deployments for critical updates

```javascript
// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
```
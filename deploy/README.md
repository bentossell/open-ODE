# Deployment Guide

This directory contains deployment configurations for the Claude Web Terminal.

## Environments

- **dev**: Local development environment
- **staging**: Pre-production testing environment  
- **prod**: Production environment

## Quick Start

1. **Configure Environment Variables**
   ```bash
   cd deploy/environments/[env]
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Deploy**
   ```bash
   ./deploy/deploy.sh [dev|staging|prod]
   ```

## Manual Deployment

### Development
```bash
cd deploy
docker-compose -f docker-compose.dev.yml up -d
```

### Staging
```bash
cd deploy
docker-compose -f docker-compose.staging.yml up -d
```

### Production
```bash
cd deploy
docker-compose -f docker-compose.prod.yml up -d --scale web=2
```

## GitHub Actions

The project includes automated deployment via GitHub Actions:

- Push to `dev` branch → Deploy to dev
- Push to `staging` branch → Deploy to staging
- Push to `main` branch → Deploy to production

## Environment Variables

Each environment needs these configured:

- `ANTHROPIC_API_KEY`: Your Claude API key
- `SUPABASE_JWT_SECRET`: JWT secret for authentication
- `DOCKER_REGISTRY`: Docker registry URL (staging/prod only)

## SSL Certificates

For staging/production:

1. Place certificates in `deploy/ssl/`
2. Update nginx config with correct paths
3. Ensure certificates are mounted in docker-compose

## Health Checks

Check service health:
```bash
curl http://localhost:3000/api/health
```

## Logs

View logs:
```bash
docker-compose -f docker-compose.[env].yml logs -f
```

## Rollback

To rollback a deployment:
```bash
docker-compose -f docker-compose.[env].yml down
docker-compose -f docker-compose.[env].yml up -d --scale web=2
```
# GitHub Actions Deployment Setup

This guide explains how to set up automated deployment to your DigitalOcean droplet using GitHub Actions.

## Required GitHub Secrets

You need to add the following secrets to your GitHub repository:

### 1. `DROPLET_IP`
Your DigitalOcean droplet's IP address.
- Current value: `167.71.89.150`

### 2. `SSH_PRIVATE_KEY`
Your SSH private key for accessing the droplet.

To get your SSH private key:
```bash
cat ~/.ssh/github-actions-deploy
```

### 3. `SUPABASE_JWT_SECRET` (Optional)
Your Supabase JWT secret for automatic environment updates.

### 4. `ANTHROPIC_API_KEY` (Optional)
Your Anthropic API key for automatic environment updates.

## How to Add Secrets

1. Go to your GitHub repository
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with the name and value

## Deployment Workflows

### 1. Simple Deploy (`deploy.yml`)
- Triggers on every push to `main`
- Pulls latest code and rebuilds containers
- Basic deployment without environment updates

### 2. Advanced Deploy (`deploy-advanced.yml`)
- Triggers on push to `main` or manual dispatch
- Backs up environment files
- Updates environment variables from secrets
- Includes health checks and notifications
- Keeps deployment history

## Manual Deployment

To trigger a manual deployment:
1. Go to **Actions** tab in your repository
2. Select "Advanced Deploy to DigitalOcean"
3. Click "Run workflow"
4. Optionally add a deployment message
5. Click "Run workflow"

## Monitoring Deployments

- Check the **Actions** tab to see deployment status
- Green checkmark = successful deployment
- Red X = failed deployment (check logs)

## Troubleshooting

### SSH Key Issues
Make sure your SSH private key:
- Has no passphrase
- Is copied exactly (including `-----BEGIN` and `-----END` lines)
- Has proper line breaks

### Connection Issues
- Verify the droplet IP is correct
- Ensure the SSH key is added to the droplet's authorized_keys
- Check droplet firewall allows SSH (port 22)

### Build Failures
- Check Docker logs in the workflow output
- SSH into droplet and run `docker logs openode-node`
- Verify all environment variables are set correctly

## Security Notes

- Never commit `.env` files to the repository
- Use GitHub Secrets for sensitive data
- Rotate API keys regularly
- Keep deployment logs private
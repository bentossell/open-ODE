# GitHub Secrets Setup for Auto-Deployment

This guide explains how to set up GitHub secrets for automatic deployment to DigitalOcean.

## Required Secrets

You need to add these secrets to your GitHub repository:

1. **DO_HOST** - Your DigitalOcean droplet IP address
2. **DO_USERNAME** - SSH username (usually `root`)
3. **DO_SSH_KEY** - Your private SSH key for accessing the droplet

## Step-by-Step Setup

### 1. Get Your Droplet Information

```bash
# Your droplet IP is shown in DigitalOcean dashboard
# Example: 167.99.123.45
```

### 2. Generate or Get Your SSH Key

If you don't have an SSH key yet:

```bash
# Generate a new SSH key pair
ssh-keygen -t ed25519 -C "github-actions@your-repo" -f ~/.ssh/github_deploy

# Copy the public key to your droplet
ssh-copy-id -i ~/.ssh/github_deploy.pub root@YOUR_DROPLET_IP
```

### 3. Add Secrets to GitHub

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

Add each secret:

#### DO_HOST
- Name: `DO_HOST`
- Value: Your droplet IP (e.g., `167.99.123.45`)

#### DO_USERNAME
- Name: `DO_USERNAME`
- Value: `root`

#### DO_SSH_KEY
- Name: `DO_SSH_KEY`
- Value: Your **private** SSH key content

To get your private key content:
```bash
cat ~/.ssh/github_deploy
```

Copy the ENTIRE output including:
```
-----BEGIN OPENSSH PRIVATE KEY-----
[your key content]
-----END OPENSSH PRIVATE KEY-----
```

## Testing the Deployment

1. Make a small change to your code
2. Commit and push to the `main` branch:
   ```bash
   git add .
   git commit -m "Test auto-deployment"
   git push origin main
   ```
3. Go to **Actions** tab in GitHub to watch the deployment
4. Check your live site after deployment completes

## Manual Deployment Trigger

You can also trigger deployment manually:
1. Go to **Actions** tab
2. Select **Deploy to DigitalOcean** workflow
3. Click **Run workflow**
4. Select `main` branch
5. Click **Run workflow**

## Troubleshooting

### SSH Connection Failed
- Verify your SSH key is added to the droplet
- Check if the IP address is correct
- Ensure no firewall is blocking SSH (port 22)

### Git Pull Failed
- Make sure the droplet has access to your GitHub repo
- If private repo, set up deploy keys or use HTTPS with token

### Docker Build Failed
- Check Docker is installed on the droplet
- Verify enough disk space: `df -h`
- Check Docker daemon is running: `systemctl status docker`

## Security Notes

- Never commit secrets to your repository
- Use strong SSH keys (ed25519 recommended)
- Regularly rotate your API keys
- Consider using GitHub environments for staging/production separation
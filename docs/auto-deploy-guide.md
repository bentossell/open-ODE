# Auto-deploy Docker Compose apps from GitHub to a DigitalOcean Droplet

This guide walks through a minimal but production-ready CI/CD pipeline that automatically builds Docker images on GitHub Actions and redeploys them on a single DigitalOcean droplet every time you push to `main`.

---
## 1. Prerequisites

| Tool | Version (or later) |
|------|--------------------|
| DigitalOcean Droplet | Ubuntu 22.04, Docker & Docker Compose v2 |
| GitHub repo | access to **Secrets** + **Actions** |
| Local machine | `ssh` + `doctl` *(optional for registry)* |

---
## 2. One-time droplet setup  (≈ 5 min)

```bash
# SSH in as root (first time)
ssh root@YOUR_DROPLET_IP

# 1) Create a non-root deploy user who can use Docker
adduser deploy          # choose a password
usermod -aG sudo,docker deploy

# 2) Harden SSH (key-only login; disable root)
mkdir -p /home/deploy/.ssh && chmod 700 /home/deploy/.ssh
# Paste your **local** ~/.ssh/id_ed25519.pub below 👇
cat <<'EOF' >> /home/deploy/.ssh/authorized_keys
PASTE_PUBLIC_KEY_HERE
EOF
chmod 600 /home/deploy/.ssh/authorized_keys

sed -Ei 's/^#?(PermitRootLogin) .*/\1 no/'  /etc/ssh/sshd_config
sed -Ei 's/^#?(PasswordAuthentication) .*/\1 no/' /etc/ssh/sshd_config
systemctl restart ssh
exit
```

> From now on connect with:
>
> ```bash
> ssh deploy@YOUR_DROPLET_IP
> ```

Create a project directory where `docker-compose.yml` will live:

```bash
ssh deploy@YOUR_DROPLET_IP "mkdir -p /srv/claude-web-terminal"
```

---
## 3. (Recommended) create a DigitalOcean Container Registry (DOCR)
A private registry keeps images close to the droplet and avoids Docker Hub rate-limits.

```bash
# Locally
# Install doctl once – https://docs.digitalocean.com/reference/doctl/
doctl registry create claude-registry   # one-time
```

Note the registry URL: `registry.digitalocean.com/claude-registry`.

---
## 4. Add GitHub Secrets
Navigate to **Settings → Secrets → Actions** in your repository and create the following:

| Name | Value |
|------|-------|
| `HOST` | `YOUR_DROPLET_IP` |
| `USERNAME` | `deploy` |
| `SSH_KEY` | *contents* of your **private** key (`~/.ssh/id_ed25519`) |
| `REGISTRY` | `registry.digitalocean.com/claude-registry` *(or Docker Hub URL)* |
| `REGISTRY_USERNAME` | `doctl` *(or Docker Hub user)* |
| `REGISTRY_PASSWORD` | **Personal access token** or `${DIGITALOCEAN_ACCESS_TOKEN}` |

---
## 5. Add the workflow file
Create `.github/workflows/deploy.yml` in your repo root:

```yaml
name: CI & CD

on:
  push:
    branches: [ main ]

env:
  IMAGE: ${{ secrets.REGISTRY }}/claude-web-terminal:${{ github.sha }}

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4

    - name: Set up QEMU & Docker Buildx
      uses: docker/setup-buildx-action@v3

    - name: Login to registry
      uses: docker/login-action@v3
      with:
        registry: ${{ secrets.REGISTRY }}
        username: ${{ secrets.REGISTRY_USERNAME }}
        password: ${{ secrets.REGISTRY_PASSWORD }}

    - name: Build & push image
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: |
          ${{ env.IMAGE }}
          ${{ secrets.REGISTRY }}/claude-web-terminal:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
    - name: Pull & restart on droplet
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          docker login ${{ secrets.REGISTRY }} -u ${{ secrets.REGISTRY_USERNAME }} -p ${{ secrets.REGISTRY_PASSWORD }}
          cd /srv/claude-web-terminal
          docker compose pull
          docker compose up -d --remove-orphans
          docker system prune -f --volumes
```

Commit & push → GitHub Actions will build the image, push it to DOCR, SSH into the droplet, pull the image and restart the stack — automatically.

---
## 6. Rolling back
Need to revert? SSH into the droplet and run:

```bash
cd /srv/claude-web-terminal
docker compose pull IMAGE_TAG_YOU_WANT
docker compose up -d --remove-orphans
```
…or in GitHub UI choose an older successful build → **Re-run job**.

---
## 7. Extras (optional)
* Add `containrrr/watchtower` to `docker-compose.yml` to auto-poll the registry and redeploy without SSH.
* Add a Slack or Discord webhook step after deploy for instant notifications.
* Use OIDC authentication instead of a saved registry password – supported by `docker/login-action@v3` and DigitalOcean.

---
Happy automated shipping! 🚀 
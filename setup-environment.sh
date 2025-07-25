#!/bin/bash

# Claude Web Terminal Environment Setup Script
# This script helps you set up the environment variables needed for the Claude Web Terminal

echo "=========================================="
echo "Claude Web Terminal Environment Setup"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to prompt for input with a default value
prompt_with_default() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"
    
    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " value
        value="${value:-$default}"
    else
        read -p "$prompt: " value
    fi
    
    eval "$var_name='$value'"
}

# Function to validate URL format
validate_url() {
    if [[ $1 =~ ^https?:// ]]; then
        return 0
    else
        return 1
    fi
}

# Check if .env files already exist
if [ -f ".env" ]; then
    echo -e "${YELLOW}Warning: .env file already exists in root directory${NC}"
    read -p "Do you want to overwrite it? (y/N): " overwrite_root
    if [[ ! "$overwrite_root" =~ ^[Yy]$ ]]; then
        echo "Keeping existing root .env file"
    else
        cp .env .env.backup.$(date +%Y%m%d%H%M%S)
        echo "Backed up existing .env to .env.backup.$(date +%Y%m%d%H%M%S)"
    fi
else
    overwrite_root="y"
fi

if [ -f "client/.env" ]; then
    echo -e "${YELLOW}Warning: .env file already exists in client directory${NC}"
    read -p "Do you want to overwrite it? (y/N): " overwrite_client
    if [[ ! "$overwrite_client" =~ ^[Yy]$ ]]; then
        echo "Keeping existing client .env file"
    else
        cp client/.env client/.env.backup.$(date +%Y%m%d%H%M%S)
        echo "Backed up existing client/.env to client/.env.backup.$(date +%Y%m%d%H%M%S)"
    fi
else
    overwrite_client="y"
fi

echo ""
echo "Let's set up your environment variables..."
echo ""

# Server Configuration
echo "=== Server Configuration ==="
prompt_with_default "Server HTTP Port" "3000" "PORT"
prompt_with_default "WebSocket Port" "8081" "WS_PORT"
echo ""

# Anthropic API Configuration
echo "=== Anthropic API Configuration ==="
echo "You can get your API key from: https://console.anthropic.com/account/keys"
read -s -p "Enter your Anthropic API Key: " ANTHROPIC_API_KEY
echo ""
echo ""

# Supabase Configuration
echo "=== Supabase Configuration ==="
echo "You can find these values in your Supabase project settings"
echo ""

# Supabase URL
while true; do
    prompt_with_default "Supabase Project URL" "https://your-project.supabase.co" "SUPABASE_URL"
    if validate_url "$SUPABASE_URL"; then
        break
    else
        echo -e "${RED}Invalid URL format. Please include http:// or https://${NC}"
    fi
done

# Supabase Anon Key
read -p "Enter your Supabase Anon Key: " SUPABASE_ANON_KEY
echo ""

# Supabase JWT Secret
echo "The JWT secret can be found in: Project Settings > API > JWT Settings"
read -s -p "Enter your Supabase JWT Secret: " SUPABASE_JWT_SECRET
echo ""
echo ""

# Docker Configuration
echo "=== Docker Configuration (Optional) ==="
prompt_with_default "Docker Image Name" "claude-env" "DOCKER_IMAGE_NAME"
prompt_with_default "Docker Container Prefix" "claude-session" "DOCKER_CONTAINER_PREFIX"
echo ""

# Session Configuration
echo "=== Session Configuration (Optional) ==="
prompt_with_default "Session Timeout (minutes)" "30" "SESSION_TIMEOUT_MINUTES"
prompt_with_default "Max Concurrent Sessions" "10" "MAX_CONCURRENT_SESSIONS"
echo ""

# Client Configuration
echo "=== Client Configuration ==="
prompt_with_default "API URL" "http://localhost:$PORT" "REACT_APP_API_URL"
prompt_with_default "WebSocket URL" "ws://localhost:$WS_PORT" "REACT_APP_WS_URL"
prompt_with_default "Enable Authentication" "true" "REACT_APP_ENABLE_AUTH"
prompt_with_default "Enable File Upload" "false" "REACT_APP_ENABLE_FILE_UPLOAD"
prompt_with_default "Max Message Length" "10000" "REACT_APP_MAX_MESSAGE_LENGTH"
echo ""

# Write server .env file
if [[ "$overwrite_root" =~ ^[Yy]$ ]]; then
    cat > .env << EOF
# Server Configuration
PORT=$PORT
WS_PORT=$WS_PORT

# Authentication
SUPABASE_JWT_SECRET=$SUPABASE_JWT_SECRET

# Anthropic API
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY

# Docker Configuration
DOCKER_IMAGE_NAME=$DOCKER_IMAGE_NAME
DOCKER_CONTAINER_PREFIX=$DOCKER_CONTAINER_PREFIX

# Session Configuration
SESSION_TIMEOUT_MINUTES=$SESSION_TIMEOUT_MINUTES
MAX_CONCURRENT_SESSIONS=$MAX_CONCURRENT_SESSIONS
EOF
    echo -e "${GREEN}✓ Created .env file${NC}"
fi

# Write client .env file
if [[ "$overwrite_client" =~ ^[Yy]$ ]]; then
    cat > client/.env << EOF
# Supabase Configuration
REACT_APP_SUPABASE_URL=$SUPABASE_URL
REACT_APP_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

# Server Configuration
REACT_APP_API_URL=$REACT_APP_API_URL
REACT_APP_WS_URL=$REACT_APP_WS_URL

# Feature Flags
REACT_APP_ENABLE_AUTH=$REACT_APP_ENABLE_AUTH
REACT_APP_ENABLE_FILE_UPLOAD=$REACT_APP_ENABLE_FILE_UPLOAD
REACT_APP_MAX_MESSAGE_LENGTH=$REACT_APP_MAX_MESSAGE_LENGTH
EOF
    echo -e "${GREEN}✓ Created client/.env file${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}Environment setup complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Review the generated .env files"
echo "2. Install dependencies: npm install && cd client && npm install"
echo "3. Build the Docker image if needed: docker build -t claude-env ."
echo "4. Start the servers: npm start (in one terminal) and cd client && npm start (in another)"
echo ""
echo "For production deployment:"
echo "1. Update the URLs in client/.env to use your production domain"
echo "2. Use HTTPS/WSS instead of HTTP/WS"
echo "3. Set up proper authentication and security measures"
echo ""

# Make the script exit successfully
exit 0
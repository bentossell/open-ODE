#!/bin/bash

# Claude Web Terminal Deployment Script
# Usage: ./deploy.sh [dev|staging|prod]

set -e

ENVIRONMENT=${1:-dev}
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Deploying Claude Web Terminal to ${ENVIRONMENT}${NC}"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    echo -e "${RED}Error: Invalid environment. Use dev, staging, or prod.${NC}"
    exit 1
fi

# Load environment variables
ENV_FILE="$SCRIPT_DIR/environments/$ENVIRONMENT/.env"
if [ -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}Loading environment variables...${NC}"
    export $(grep -v '^#' "$ENV_FILE" | xargs)
else
    echo -e "${RED}Error: Environment file not found: $ENV_FILE${NC}"
    echo "Copy .env.example to .env and configure it first."
    exit 1
fi

# Build steps
cd "$PROJECT_ROOT"

echo -e "${YELLOW}Installing dependencies...${NC}"
npm ci

echo -e "${YELLOW}Building frontend...${NC}"
cd client
npm ci
npm run build
cd ..

# Docker build for staging/prod
if [[ "$ENVIRONMENT" != "dev" ]]; then
    echo -e "${YELLOW}Building Docker image...${NC}"
    docker build -t ${DOCKER_REGISTRY}/openode-web:${ENVIRONMENT} .
    
    echo -e "${YELLOW}Pushing Docker image...${NC}"
    docker push ${DOCKER_REGISTRY}/openode-web:${ENVIRONMENT}
fi

# Deploy based on environment
cd "$SCRIPT_DIR"

case $ENVIRONMENT in
    dev)
        echo -e "${YELLOW}Starting development environment...${NC}"
        docker-compose -f docker-compose.dev.yml up -d
        ;;
    staging)
        echo -e "${YELLOW}Deploying to staging...${NC}"
        docker-compose -f docker-compose.staging.yml pull
        docker-compose -f docker-compose.staging.yml up -d
        ;;
    prod)
        echo -e "${YELLOW}Deploying to production...${NC}"
        docker-compose -f docker-compose.prod.yml pull
        docker-compose -f docker-compose.prod.yml up -d --scale web=2
        ;;
esac

# Health check
echo -e "${YELLOW}Waiting for service to be healthy...${NC}"
sleep 5

if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}Deployment successful! Service is healthy.${NC}"
else
    echo -e "${RED}Warning: Health check failed. Check logs with:${NC}"
    echo "docker-compose -f docker-compose.$ENVIRONMENT.yml logs"
fi

echo -e "${GREEN}Deployment to $ENVIRONMENT complete!${NC}"
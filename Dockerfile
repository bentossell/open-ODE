FROM node:18-alpine

# Install dependencies for node-pty and Docker CLI
RUN apk add --no-cache python3 make g++ bash docker-cli

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install all dependencies (needed for build)
RUN npm ci
RUN cd client && npm ci

# Copy all source files
COPY . .

# Build the client
RUN cd client && npm run build

# Create non-root user (but don't switch to it for Docker socket access)
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Expose ports
EXPOSE 3000 8081

# Start the server
CMD ["node", "server.js"]
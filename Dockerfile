FROM node:18-alpine

# Install dependencies for node-pty
RUN apk add --no-cache python3 make g++ bash

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm ci --only=production
RUN cd client && npm ci --only=production

# Copy application files
COPY server.js .
COPY client/build ./client/build
COPY deploy ./deploy

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Expose ports
EXPOSE 3000 8081

# Start the server
CMD ["node", "server.js"]
FROM node:18-alpine

# Install Docker CLI
RUN apk add --no-cache docker-cli

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN cd client && npm install

# Copy source code
COPY . .

# Build React app
RUN npm run build

# Expose ports
EXPOSE 3000 8081

# Start the server
CMD ["npm", "start"]
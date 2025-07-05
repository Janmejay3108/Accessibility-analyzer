FROM node:18-slim

# Install system dependencies for Playwright
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Playwright system dependencies
RUN npx playwright install-deps

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install root dependencies
RUN npm install

# Install frontend dependencies
RUN cd frontend && npm install

# Install backend dependencies  
RUN cd backend && npm install

# Install Playwright browsers
RUN npx playwright install chromium

# Copy source code
COPY . .

# Build frontend for production with CI=false to ignore warnings
RUN cd frontend && CI=false npm run build

# Create logs directory
RUN mkdir -p /app/logs

# Create health check endpoint
RUN echo '#!/bin/bash\ncurl -f http://localhost:5000/health || exit 1' > /app/healthcheck.sh && chmod +x /app/healthcheck.sh

# Expose port (Railway will use PORT environment variable)
EXPOSE 3000

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:$PORT/health || exit 1

# Start the application
CMD ["npm", "start"]

FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    curl \
    bash \
    git \
    python3 \
    make \
    g++

# Set working directory
WORKDIR /app

# Set environment variables early
ENV NODE_ENV=production
ENV CI=false
ENV GENERATE_SOURCEMAP=false
ENV DISABLE_ESLINT_PLUGIN=true
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Copy package files first for better caching
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install root dependencies with optimizations
RUN npm install --no-audit --no-fund --production=false

# Install frontend dependencies with optimizations
RUN cd frontend && npm install --no-audit --no-fund --production=false

# Install backend dependencies
RUN cd backend && npm install --no-audit --no-fund

# Copy source code
COPY . .

# Make build script executable and run it
RUN chmod +x build-frontend.sh && ./build-frontend.sh

# Clean up development dependencies to reduce image size
RUN cd frontend && npm prune --production
RUN npm prune --production

# Create logs directory
RUN mkdir -p /app/logs

# Expose port (Railway will use PORT environment variable)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]

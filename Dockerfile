FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    curl \
    bash \
    git

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

# Copy source code
COPY . .

# Build frontend using our custom build script with error handling
RUN chmod +x build-frontend.sh && ./build-frontend.sh

# Create logs directory
RUN mkdir -p /app/logs

# Expose port (Railway will use PORT environment variable)
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV CI=false

# Start the application
CMD ["npm", "start"]

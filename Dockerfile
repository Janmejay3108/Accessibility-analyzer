# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install root dependencies
RUN npm install --production

# Install frontend dependencies
RUN cd frontend && npm install

# Install backend dependencies
RUN cd backend && npm install --production

# Copy source code
COPY . .

# Build frontend
RUN cd frontend && npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]

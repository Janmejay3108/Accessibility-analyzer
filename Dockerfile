# Use Node.js 18 LTS with more packages for Playwright
FROM node:18-alpine

# Install dependencies needed for Playwright
RUN apk add --no-cache \
    curl \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Tell Playwright to use the installed Chromium
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

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

# Install Playwright browsers as fallback (in case system Chromium fails)
RUN cd backend && npx playwright install chromium --with-deps || echo "Playwright install failed, using system Chromium"

# Copy source code
COPY . .

# Set production environment
ENV NODE_ENV=production

# Build frontend with production environment
RUN cd frontend && npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]

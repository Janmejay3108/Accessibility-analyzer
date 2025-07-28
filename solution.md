Phase 1: Prepare Your Project for Deployment
Step 1: Create Production Configuration
1.1 Create Docker Configuration


# Create: Dockerfile in root directory
FROM node:18-slim

# Install system dependencies for Playwright
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libgtk-3-0 \
    libgbm-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm install
RUN cd frontend && npm install
RUN cd backend && npm install

# Install Playwright browsers
RUN npx playwright install chromium
RUN npx playwright install-deps

# Copy source code
COPY . .

# Build frontend
RUN cd frontend && npm run build

# Expose port
EXPOSE 5000

# Start backend (which will serve frontend build)
CMD ["node", "backend/server.js"]
1.2 Update Backend Server Configuration

javascript
// backend/server.js - Add these modifications
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../frontend/build')));

// CORS configuration for production
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:3001',
  credentials: true
}));

// Your existing API routes
app.use('/api', require('./routes'));

// Catch all handler for React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
1.3 Update Frontend Environment

javascript
// frontend/src/services/api.js - Update API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? window.location.origin 
    : 'http://localhost:5000');

export const analysisService = {
  async createAnalysis(url, settings) {
    const response = await fetch(`${API_BASE_URL}/api/analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getToken()}`
      },
      body: JSON.stringify({ url, settings })
    });
    return response.json();
  }
  // ... rest of your service methods
};
1.4 Update Playwright Configuration

javascript
// backend/services/playwright-service.js - Production-ready config
const { chromium } = require('playwright');

async function launchBrowser() {
  return await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  });
}
Phase 2: Oracle Cloud Setup (100% Free)
Step 2: Create Oracle Cloud Account
2.1 Sign Up Process

Go to oracle.com/cloud/free

Click "Start for free"

Fill registration form (requires phone verification)

Important: Choose "Always Free" resources only

Complete email verification

2.2 Launch Compute Instance

Navigate: Compute → Instances

Click: "Create Instance"

Choose: Always Free Eligible shape (VM.Standard.E2.1.Micro)

OS: Ubuntu 20.04 (or latest LTS)

Network: Use default VCN

SSH Keys: Generate new key pair (download private key)

Click: "Create"

Step 3: Configure Server Environment
3.1 Connect to Your Instance

bash
# From your local machine
ssh -i /path/to/private-key opc@your-instance-public-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install docker.io -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker opc

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again to apply docker group
exit
3.2 Configure Firewall

bash
# On Oracle Cloud Console
# Networking → Virtual Cloud Networks → Default VCN → Default Security List
# Add Ingress Rule:
# - Source: 0.0.0.0/0
# - Protocol: TCP
# - Port Range: 5000
# - Description: Web Application

# On the instance
sudo ufw allow 5000
sudo ufw enable
Phase 3: Deploy Your Application
Step 4: Upload and Deploy
4.1 Transfer Your Code

bash
# On your local machine - create deployment package
git clone your-repo-url
cd your-project
tar -czf accessibility-analyzer.tar.gz .

# Upload to server
scp -i /path/to/private-key accessibility-analyzer.tar.gz opc@your-instance-ip:~/

# On server
ssh -i /path/to/private-key opc@your-instance-ip
tar -xzf accessibility-analyzer.tar.gz
cd accessibility-analyzer
4.2 Set Environment Variables

bash
# Create .env file on server
cat > .env << EOF
NODE_ENV=production
PORT=5000
FRONTEND_URL=http://your-instance-ip:5000

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----"
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
EOF
4.3 Build and Run

bash
# Build Docker image
docker build -t accessibility-analyzer .

# Run container
docker run -d \
  --name accessibility-app \
  -p 5000:5000 \
  --env-file .env \
  --restart unless-stopped \
  accessibility-analyzer

# Check if running
docker ps
docker logs accessibility-app
Phase 4: Configure Domain and SSL (Optional but Recommended)
Step 5: Free Domain Setup
5.1 Free Domain Options

Freenom (.tk, .ml, .ga, .cf domains)

No-IP (free subdomain)

DuckDNS (free subdomain)

5.2 SSL Certificate (Free)

bash
# Install Certbot
sudo apt install certbot -y

# Get SSL certificate (replace with your domain)
sudo certbot certonly --standalone -d your-domain.com

# Set up auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
Phase 5: Final Configuration
Step 6: Production Optimization
6.1 Docker Compose Setup

text
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
6.2 Monitoring Setup

bash
# Simple monitoring script
cat > monitor.sh << 'EOF'
#!/bin/bash
if ! docker ps | grep -q accessibility-app; then
  echo "App is down, restarting..."
  docker start accessibility-app
fi
EOF

chmod +x monitor.sh

# Add to crontab
crontab -e
# Add: */5 * * * * /home/opc/monitor.sh
🎉 Final Steps
Step 7: Access Your Application
Open browser: http://your-oracle-instance-ip:5000

Test functionality:

User registration/login

URL analysis

Results display

Report generation

Step 8: Share Your Web Link
Your accessibility analyzer will be available at:

HTTP: http://your-instance-ip:5000

With Domain: http://your-domain.com (if configured)

With SSL: https://your-domain.com (if configured)

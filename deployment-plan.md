# 🚀 Oracle Cloud Always Free Deployment Plan
## Accessibility Analyzer - Complete Deployment Guide

### 📋 **Project Overview**
- **Frontend**: React app (port 3001 → production build)
- **Backend**: Node.js/Express (port 3000 → port 80/443)
- **Database**: Firebase Firestore
- **Core Feature**: Playwright + axe-core accessibility scanning
- **Target**: Always-on, publicly accessible, completely free

---

## 🎯 **Phase 1: Oracle Cloud Account & VM Setup**

### **Step 1.1: Create Oracle Cloud Account**
1. Visit [oracle.com/cloud/free](https://oracle.com/cloud/free)
2. Click "Start for free"
3. Complete registration (requires phone verification)
4. **IMPORTANT**: Choose "Always Free" resources only
5. Verify email and complete setup

### **Step 1.2: Launch Compute Instance**
1. Navigate: **Compute → Instances**
2. Click: **"Create Instance"**
3. **Configuration**:
   - **Name**: `accessibility-analyzer-vm`
   - **Image**: Ubuntu 22.04 LTS (Always Free Eligible)
   - **Shape**: VM.Standard.E2.1.Micro (Always Free)
   - **Network**: Use default VCN
   - **SSH Keys**: Generate new key pair (download private key)
4. Click: **"Create"**
5. **Wait for "Running" status** (2-3 minutes)
6. **Note the Public IP address**

### **Step 1.3: Configure Network Security**
1. **In Oracle Cloud Console**:
   - Navigate: **Networking → Virtual Cloud Networks**
   - Click: **Default VCN → Default Security List**
   - Click: **"Add Ingress Rules"**
   - **Add Rules**:
     ```
     Rule 1: HTTP
     - Source: 0.0.0.0/0
     - Protocol: TCP
     - Port: 80
     
     Rule 2: HTTPS  
     - Source: 0.0.0.0/0
     - Protocol: TCP
     - Port: 443
     
     Rule 3: Custom (for testing)
     - Source: 0.0.0.0/0
     - Protocol: TCP
     - Port: 5000
     ```

---

## 🔧 **Phase 2: Server Environment Setup**

### **Step 2.1: Connect to Server**
```bash
# From your local machine
chmod 400 /path/to/private-key.pem
ssh -i /path/to/private-key.pem ubuntu@YOUR_PUBLIC_IP
```

### **Step 2.2: System Update & Basic Tools**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
```

### **Step 2.3: Install Docker & Docker Compose**
```bash
# Install Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker ubuntu
newgrp docker

# Verify installation
docker --version
docker-compose --version
```

### **Step 2.4: Install Node.js & npm**
```bash
# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### **Step 2.5: Configure Firewall**
```bash
# Configure UFW firewall
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 5000
sudo ufw --force enable
sudo ufw status
```

---

## 📦 **Phase 3: Project Deployment**

### **Step 3.1: Clone & Prepare Project**
```bash
# Create project directory
mkdir -p /home/ubuntu/accessibility-analyzer
cd /home/ubuntu/accessibility-analyzer

# We'll upload the project files here
```

### **Step 3.2: Create Production Dockerfile**
```dockerfile
# Create: Dockerfile
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
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcairo-gobject2 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0 \
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
```

### **Step 3.3: Create Docker Compose Configuration**
```yaml
# Create: docker-compose.yml
version: '3.8'
services:
  accessibility-analyzer:
    build: .
    ports:
      - "80:5000"
      - "443:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
    env_file:
      - .env
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

---

## ⚙️ **Phase 4: Application Configuration**

### **Step 4.1: Update Backend for Production**
- Modify `backend/server.js` to serve React build
- Configure CORS for production domain
- Add health check endpoint
- Set up proper error handling

### **Step 4.2: Update Frontend for Production**
- Configure API base URL for production
- Update environment variables
- Optimize build settings

### **Step 4.3: Environment Variables Setup**
```bash
# Create .env file with production settings
NODE_ENV=production
PORT=5000
FRONTEND_URL=http://YOUR_PUBLIC_IP

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----"
```

---

## 🌐 **Phase 5: Domain & SSL Setup (Optional)**

### **Step 5.1: Free Domain Options**
- **Freenom**: .tk, .ml, .ga, .cf domains
- **No-IP**: Free subdomain
- **DuckDNS**: Free subdomain

### **Step 5.2: SSL Certificate (Let's Encrypt)**
```bash
# Install Certbot
sudo apt install certbot -y

# Get SSL certificate
sudo certbot certonly --standalone -d your-domain.com

# Set up auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🚀 **Phase 6: Deployment & Testing**

### **Step 6.1: Build & Deploy**
```bash
# Build and start the application
docker-compose up -d --build

# Check status
docker-compose ps
docker-compose logs -f
```

### **Step 6.2: Verification Tests**
1. **Health Check**: `curl http://YOUR_PUBLIC_IP/health`
2. **Frontend Access**: Visit `http://YOUR_PUBLIC_IP`
3. **API Test**: Test analysis endpoint
4. **Playwright Test**: Verify browser automation works
5. **Firebase Test**: Verify database connectivity

### **Step 6.3: Monitoring Setup**
```bash
# Create monitoring script
cat > monitor.sh << 'EOF'
#!/bin/bash
if ! docker-compose ps | grep -q "Up"; then
  echo "App is down, restarting..."
  docker-compose up -d
fi
EOF

chmod +x monitor.sh

# Add to crontab
crontab -e
# Add: */5 * * * * /home/ubuntu/accessibility-analyzer/monitor.sh
```

---

## 🎯 **Success Criteria**
- ✅ Application accessible 24/7 at public IP
- ✅ Playwright browser automation working
- ✅ Firebase integration functional
- ✅ Long-running scans (30+ seconds) successful
- ✅ No CORS issues
- ✅ Automatic restart on failure
- ✅ $0/month cost (Always Free tier)

---

## 🔧 **Next Steps After Plan Creation**
1. Execute Oracle Cloud account setup
2. Configure VM and networking
3. Install all dependencies
4. Deploy application with Docker
5. Test all functionality
6. Set up monitoring and maintenance

**Total Estimated Time**: 2-3 hours for complete setup
**Ongoing Maintenance**: Minimal (automated monitoring)
**Cost**: $0/month forever (Oracle Always Free)

---

## 🛠️ **IMPLEMENTATION: Let's Deploy Your App**

Now I'll guide you through each step with actual commands and configurations. Follow along as we deploy your Accessibility Analyzer to Oracle Cloud.

### **🎯 STEP 1: Oracle Cloud Account Setup**

**Action Required**: You need to create the Oracle Cloud account manually:

1. **Go to**: [oracle.com/cloud/free](https://oracle.com/cloud/free)
2. **Click**: "Start for free"
3. **Complete registration** (phone verification required)
4. **Choose**: "Always Free" resources only
5. **Verify email** and complete setup

**Once you have your Oracle Cloud account ready, let me know and I'll help you create the VM instance.**

---

### **🎯 STEP 2: Prepare Project for Deployment**

While you're setting up Oracle Cloud, let me prepare your project files for deployment:

#### **2.1: Create Production Dockerfile**

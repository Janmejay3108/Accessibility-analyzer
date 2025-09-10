# Railway Deployment Resolution Design
## Accessibility Analyzer Full-Stack Application

## Overview

This design document addresses the critical Railway deployment issues faced by the Accessibility Analyzer application, a full-stack web application that provides automated accessibility scanning using Playwright and WCAG compliance analysis.

### Current Status Analysis

**Application Type**: Full-Stack Node.js Application with React Frontend
- **Backend**: Express.js server with Playwright automation
- **Frontend**: React application with build output
- **Database**: Firebase Firestore with Admin SDK
- **Core Functionality**: Web accessibility scanning with axe-core

**Deployment Challenge**: Multiple failed attempts on Railway due to configuration conflicts, build process issues, and dependency management problems.

## Architecture

### Application Structure
```
Accessibility Analyzer/
├── backend/                 # Express.js API server
│   ├── controllers/        # Business logic handlers
│   ├── routes/            # API endpoint definitions
│   ├── models/            # Data models for Firebase
│   ├── utils/             # Scanning services (Playwright + axe-core)
│   └── config/            # Firebase admin configuration
├── frontend/               # React client application
│   ├── src/components/    # UI components
│   ├── src/services/      # API client services
│   ├── src/contexts/      # React context providers
│   └── build/             # Production build output
└── deployment configs/     # Railway, Docker configurations
```

### Deployment Architecture

```mermaid
graph TB
    subgraph "Railway Platform"
        subgraph "Container Environment"
            A[Node.js 18 Runtime]
            B[Express Server :3000]
            C[Static File Serving]
        end
        
        subgraph "Build Process"
            D[Install Root Dependencies]
            E[Install Backend Dependencies]
            F[Serve Pre-built Frontend]
        end
    end
    
    subgraph "External Services"
        G[Firebase Admin SDK]
        H[Playwright Browser Context]
    end
    
    subgraph "Client Access"
        I[Web Users]
        J[API Consumers]
    end
    
    D --> E
    E --> F
    F --> B
    B --> C
    
    B <--> G
    B --> H
    
    I --> C
    J --> B
    
    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style G fill:#fff3e0
```

## Critical Issues Identified

### 1. Build Process Complexity
**Root Cause**: Circular dependency installation and conflicting build scripts
- Multiple `postinstall` hooks creating infinite loops
- Duplicate React dependencies in root and frontend
- Competing build configurations

### 2. Port Configuration Conflicts
**Root Cause**: Inconsistent port settings across environment files
- Default port mismatch (5000 vs Railway's expected 3000)
- Environment variable conflicts between `.env` and Railway settings

### 3. Dependency Management Issues
**Root Cause**: Complex monorepo structure with separate package.json files
- Frontend and backend dependencies not properly isolated
- Missing runtime dependencies at deployment level

### 4. Railway Configuration Optimization
**Root Cause**: Inadequate platform-specific configuration
- Missing Railway-specific build configurations
- Improper handling of static file serving in production

## Deployment Resolution Strategy

### Phase 1: Build Process Simplification

#### Current Problematic Configuration
```json
// ROOT package.json - BEFORE
{
  "scripts": {
    "build": "npm run install:deps && cd frontend && npm run build",
    "install:deps": "cd frontend && npm install && cd ../backend && npm install",
    "postinstall": "npm run install:deps" // ← Infinite loop trigger
  }
}
```

#### Optimized Configuration
```json
// ROOT package.json - AFTER
{
  "scripts": {
    "start": "node backend/server.js",
    "build": "echo 'Using pre-built frontend'",
    "postinstall": "cd backend && npm install --production"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  }
}
```

### Phase 2: Railway Platform Optimization

#### Railway Configuration Matrix
| Configuration File | Purpose | Status |
|-------------------|---------|---------|
| `railway.json` | Railway-specific deployment settings | Required |
| `nixpacks.toml` | Build environment specification | Optional |
| `Dockerfile` | Container configuration | Alternative |

#### Recommended Railway Configuration
```json
// railway.json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### Phase 3: Frontend Build Strategy

#### Pre-Build Approach (Recommended)
- **Strategy**: Include built frontend in repository
- **Benefits**: Eliminates build complexity on Railway
- **Implementation**: Update `.gitignore` to include `frontend/build/`

#### Frontend Serving Configuration
```javascript
// backend/server.js - Production static serving
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  // Catch-all handler for React Router
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
  });
}
```

### Phase 4: Environment Configuration

#### Required Railway Environment Variables
```bash
NODE_ENV=production
PORT=3000
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=service-account-email@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...actual-key...\n-----END PRIVATE KEY-----"
```

#### CORS Configuration for Railway
```javascript
// Dynamic CORS for Railway deployment
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? [
        process.env.RAILWAY_STATIC_URL,
        /\.railway\.app$/
      ]
    : ['http://localhost:3001', 'http://localhost:3000'],
  credentials: true
};
```

## Implementation Steps

### Step 1: Repository Preparation
1. **Clean Build Process**
   - Remove circular `postinstall` scripts
   - Simplify root `package.json` scripts
   - Ensure backend dependencies are self-contained

2. **Frontend Build Strategy**
   ```bash
   # Local pre-build (run once)
   cd frontend
   npm install
   npm run build
   cd ..
   git add frontend/build/
   git commit -m "Include pre-built frontend for Railway"
   ```

### Step 2: Railway Configuration
1. **Create Railway Configuration**
   ```json
   // railway.json
   {
     "build": {
       "builder": "NIXPACKS"
     },
     "deploy": {
       "startCommand": "npm start",
       "healthcheckPath": "/health"
     }
   }
   ```

2. **Update Git Configuration**
   ```gitignore
   # .gitignore - Allow frontend build
   # build/
   !frontend/build/
   ```

### Step 3: Server Configuration Validation
1. **Port Configuration**
   ```javascript
   const PORT = process.env.PORT || 3000; // Railway standard
   ```

2. **Health Check Endpoint**
   ```javascript
   app.get('/health', (req, res) => {
     res.status(200).json({
       status: 'healthy',
       uptime: process.uptime(),
       timestamp: new Date().toISOString()
     });
   });
   ```

### Step 4: Deployment Execution
1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Railway deployment configuration"
   git push origin main
   ```

2. **Railway Deployment**
   - Connect GitHub repository to Railway
   - Set environment variables in Railway dashboard
   - Monitor build logs for successful deployment

### Step 5: Verification Protocol
1. **Health Check**: `https://your-app.railway.app/health`
2. **API Test**: `https://your-app.railway.app/api/health`
3. **Frontend Test**: `https://your-app.railway.app/`
4. **Full Functionality**: Test accessibility scanning feature

## Alternative Deployment Strategies

### Option 1: Docker-based Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install --production
RUN cd backend && npm install --production
EXPOSE 3000
CMD ["npm", "start"]
```

### Option 2: Render.com Migration
- **Benefits**: Generous free tier, Docker support
- **Considerations**: Sleep mode on free tier
- **Migration**: Similar configuration with Render-specific adjustments

### Option 3: Local Development Focus
- **Strategy**: Optimize for localhost development
- **Deployment**: Use Railway for demos only
- **Benefits**: 100% functionality guaranteed

## Success Metrics

### Deployment Success Indicators
- ✅ **Build Completion**: No build errors or timeouts
- ✅ **Health Check**: `/health` endpoint returns 200 status
- ✅ **Static Serving**: Frontend loads correctly
- ✅ **API Functionality**: Backend endpoints respond
- ✅ **Core Feature**: Accessibility scanning works
- ✅ **Firebase Integration**: Authentication and data persistence

### Performance Targets
- **Build Time**: < 5 minutes
- **Cold Start**: < 30 seconds
- **Response Time**: < 2 seconds for API calls
- **Uptime**: 99%+ availability

## Risk Mitigation

### Deployment Risks
| Risk | Impact | Mitigation |
|------|---------|------------|
| Build Failures | High | Pre-built frontend strategy |
| Port Conflicts | Medium | Standardize on port 3000 |
| Environment Variables | High | Validation scripts, clear documentation |
| Dependency Issues | Medium | Lock file consistency, production flags |
| Firebase Auth Failures | High | Service account key validation |

### Rollback Strategy
1. **Git Revert**: Previous working commit
2. **Railway Redeploy**: From known good commit
3. **Local Fallback**: Development environment as backup
4. **Documentation**: Step-by-step rollback procedures

## Testing Strategy

### Pre-Deployment Testing
```bash
# Local build verification
npm install --production
cd backend && npm install --production
npm start
# Verify http://localhost:3000/health
```

### Post-Deployment Validation
```bash
# Automated verification script
curl -f https://your-app.railway.app/health
curl -f https://your-app.railway.app/api/health
curl -f https://your-app.railway.app/
```

### Load Testing
- **Tool**: Basic curl scripts or Artillery.js
- **Targets**: Health endpoints, API routes, static serving
- **Metrics**: Response time, error rate, concurrent users
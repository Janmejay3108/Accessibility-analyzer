# Firebase Setup Guide

This guide will help you complete the Firebase integration for the Accessibility Analyzer project.

## Prerequisites Completed ✅
- Firebase project created in Firebase Console
- Google OAuth authentication enabled
- Firebase service account key JSON file downloaded

## Remaining Setup Steps

### Step 1: Configure Service Account Key

1. **Place the service account key file:**
   ```bash
   # Copy your downloaded service account key to:
   backend/config/firebase-service-account-key.json
   ```

2. **Verify the file structure:**
   ```
   backend/config/
   ├── firebase-admin.js
   ├── firebase-service-account-key.json  # Your key file here
   └── README.md
   ```

### Step 2: Configure Environment Variables

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Update the .env file with your Firebase configuration:**
   ```bash
   # Required: Your Firebase project ID
   FIREBASE_PROJECT_ID=your-firebase-project-id
   
   # For local development (using service account key file)
   FIREBASE_SERVICE_ACCOUNT_KEY_PATH=./backend/config/firebase-service-account-key.json
   
   # For production (using environment variables)
   # FIREBASE_PRIVATE_KEY_ID=your-private-key-id
   # FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"
   # FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
   # FIREBASE_CLIENT_ID=your-client-id
   # FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project.iam.gserviceaccount.com
   ```

### Step 3: Deploy Firestore Security Rules

1. **Install Firebase CLI (if not already installed):**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase:**
   ```bash
   firebase login
   ```

3. **Initialize Firebase in your project:**
   ```bash
   firebase init firestore
   # Select your existing project
   # Use existing firestore.rules and firestore.indexes.json files
   ```

4. **Deploy security rules:**
   ```bash
   firebase deploy --only firestore:rules
   firebase deploy --only firestore:indexes
   ```

### Step 4: Test Firebase Connection

1. **Run the Firebase setup script:**
   ```bash
   npm run setup:firebase
   ```

   This script will:
   - Test Firebase connection
   - Initialize Firestore collections
   - Verify permissions

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Test the API endpoints:**
   ```bash
   # Test basic API
   curl http://localhost:5000/api
   
   # Test health check
   curl http://localhost:5000/health
   ```

## API Endpoints Available

### Authentication Endpoints
- `POST /api/auth/verify` - Verify Firebase token
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `DELETE /api/auth/account` - Delete user account
- `POST /api/auth/custom-token` - Create custom token (testing)

### Analysis Endpoints
- `POST /api/analysis` - Create new analysis request
- `GET /api/analysis/:id` - Get analysis request by ID
- `GET /api/analysis/:id/result` - Get analysis result
- `GET /api/analysis/user/requests` - Get user's analysis requests (auth required)
- `GET /api/analysis/url/history` - Get analysis history by URL
- `GET /api/analysis/public/recent` - Get recent public analyses
- `GET /api/analysis/dashboard/analytics` - Get analytics data

## Firestore Collections Structure

### analysisRequests
```javascript
{
  url: string,
  userId: string | null,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  requestTimestamp: Date,
  completedTimestamp: Date | null,
  metadata: object,
  settings: {
    includeAxeCore: boolean,
    includeMlAnalysis: boolean,
    wcagLevel: string
  },
  createdAt: Date,
  updatedAt: Date
}
```

### analysisResults
```javascript
{
  analysisRequestId: string,
  url: string,
  userId: string | null,
  axeCoreResults: object,
  mlAnalysisResults: object | null,
  summary: {
    totalIssues: number,
    criticalIssues: number,
    seriousIssues: number,
    moderateIssues: number,
    minorIssues: number,
    wcagLevel: string,
    complianceScore: number
  },
  recommendations: array,
  createdAt: Date,
  updatedAt: Date
}
```

### users
```javascript
{
  email: string,
  name: string,
  createdAt: Date,
  lastLoginAt: Date,
  updatedAt: Date,
  preferences: {
    theme: string,
    notifications: boolean,
    defaultWcagLevel: string
  }
}
```

## Security Rules Summary

- **Users**: Can only read/write their own data
- **Analysis Requests**: 
  - Anyone can create (for anonymous users)
  - Public requests are readable by all
  - Private requests only readable by owner
- **Analysis Results**: 
  - Only backend can create/update
  - Readable based on associated request permissions
- **Other collections**: Prepared for future features

## Troubleshooting

### Common Issues

1. **"Firebase configuration not found" error:**
   - Verify your .env file has the correct Firebase configuration
   - Check that the service account key file is in the correct location

2. **"Permission denied" errors:**
   - Ensure Firestore security rules are deployed
   - Check that your Firebase project has Firestore enabled

3. **"Project not found" errors:**
   - Verify the FIREBASE_PROJECT_ID in your .env file
   - Ensure you're using the correct Firebase project

### Testing Authentication

1. **Create a test user:**
   ```javascript
   // Use the Firebase Console or the setup script
   const { createTestUser } = require('./backend/utils/firebase-setup');
   await createTestUser('test@example.com', 'password123', 'Test User');
   ```

2. **Get a custom token for testing:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/custom-token \
     -H "Content-Type: application/json" \
     -d '{"uid": "test-user-uid"}'
   ```

## Next Steps

After completing the Firebase setup:

1. **Implement axe-core integration** for accessibility scanning
2. **Add frontend React application** with Firebase Authentication
3. **Implement real-time dashboard** using Firestore listeners
4. **Add machine learning analysis** capabilities
5. **Set up CI/CD pipeline** with Firebase deployment

## Support

If you encounter issues:
1. Check the Firebase Console for error logs
2. Review the server logs for detailed error messages
3. Verify all environment variables are correctly set
4. Ensure Firebase services are enabled in your project

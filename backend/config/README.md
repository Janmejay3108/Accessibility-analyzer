# Firebase Configuration

## Service Account Key Setup

1. **Download your Firebase service account key JSON file** from the Firebase Console:
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
   - Save the downloaded JSON file as `firebase-service-account-key.json` in this directory

2. **Security Note**: 
   - The `firebase-service-account-key.json` file is already included in `.gitignore`
   - Never commit this file to version control
   - For production, use environment variables instead of the JSON file

## File Structure
```
backend/config/
├── firebase-admin.js          # Firebase Admin SDK configuration
├── firebase-service-account-key.json  # Your service account key (not in git)
└── README.md                  # This file
```

## Environment Variables Alternative

For production deployment, instead of using the JSON file, set these environment variables:

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project.iam.gserviceaccount.com
```

The Firebase configuration will automatically detect and use environment variables if available, falling back to the JSON file for local development.

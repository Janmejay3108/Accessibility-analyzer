// Load environment variables
require('dotenv').config();

const { getFirestore, getAuth } = require('../config/firebase-admin');

/**
 * Initialize Firestore collections with proper structure
 */
async function initializeCollections() {
  try {
    const db = getFirestore();
    
    console.log('🔧 Initializing Firestore collections...');
    
    // Create a sample document in each collection to establish structure
    // These will be deleted after creation
    
    // Initialize analysisRequests collection
    const sampleRequestRef = await db.collection('analysisRequests').add({
      url: 'https://example.com',
      userId: null,
      status: 'completed',
      requestTimestamp: new Date(),
      completedTimestamp: new Date(),
      metadata: {
        title: 'Sample Analysis',
        description: 'This is a sample analysis request for collection initialization'
      },
      settings: {
        includeAxeCore: true,
        includeMlAnalysis: false,
        wcagLevel: 'AA'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Initialize analysisResults collection
    const sampleResultRef = await db.collection('analysisResults').add({
      analysisRequestId: sampleRequestRef.id,
      url: 'https://example.com',
      userId: null,
      axeCoreResults: {
        violations: [],
        passes: [],
        incomplete: [],
        inapplicable: []
      },
      summary: {
        totalIssues: 0,
        criticalIssues: 0,
        seriousIssues: 0,
        moderateIssues: 0,
        minorIssues: 0,
        wcagLevel: 'AA',
        complianceScore: 100
      },
      recommendations: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Initialize users collection structure (will be created when users sign up)
    console.log('✅ Collections initialized successfully');
    
    // Clean up sample documents
    await sampleRequestRef.delete();
    await sampleResultRef.delete();
    
    console.log('🧹 Sample documents cleaned up');
    
    return true;
  } catch (error) {
    console.error('❌ Error initializing collections:', error);
    throw error;
  }
}

/**
 * Test Firebase connection and permissions
 */
async function testFirebaseConnection() {
  try {
    console.log('🔍 Testing Firebase connection...');
    
    const db = getFirestore();
    const auth = getAuth();
    
    // Test Firestore connection
    const testDoc = await db.collection('test').add({
      timestamp: new Date(),
      message: 'Connection test'
    });
    
    await testDoc.delete();
    console.log('✅ Firestore connection successful');
    
    // Test Auth connection
    try {
      await auth.listUsers(1);
      console.log('✅ Firebase Auth connection successful');
    } catch (authError) {
      console.log('⚠️  Firebase Auth connection test failed (this is normal if no users exist)');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    throw error;
  }
}

/**
 * Create initial admin user (for testing)
 */
async function createTestUser(email, password, displayName) {
  try {
    const auth = getAuth();
    const db = getFirestore();
    
    console.log(`👤 Creating test user: ${email}`);
    
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: displayName,
      emailVerified: true
    });
    
    // Create user document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email: email,
      name: displayName,
      createdAt: new Date(),
      updatedAt: new Date(),
      preferences: {
        theme: 'light',
        notifications: true,
        defaultWcagLevel: 'AA'
      },
      role: 'user'
    });
    
    console.log(`✅ Test user created successfully with UID: ${userRecord.uid}`);
    return userRecord;
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    throw error;
  }
}

/**
 * Setup script runner
 */
async function runSetup() {
  try {
    console.log('🚀 Starting Firebase setup...\n');
    
    await testFirebaseConnection();
    console.log('');
    
    await initializeCollections();
    console.log('');
    
    console.log('✅ Firebase setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Place your Firebase service account key in backend/config/firebase-service-account-key.json');
    console.log('2. Update your .env file with Firebase configuration');
    console.log('3. Deploy Firestore security rules: firebase deploy --only firestore:rules');
    console.log('4. Start your server: npm run dev');
    
  } catch (error) {
    console.error('\n❌ Firebase setup failed:', error.message);
    process.exit(1);
  }
}

// Export functions for use in other scripts
module.exports = {
  initializeCollections,
  testFirebaseConnection,
  createTestUser,
  runSetup
};

// Run setup if this file is executed directly
if (require.main === module) {
  runSetup();
}

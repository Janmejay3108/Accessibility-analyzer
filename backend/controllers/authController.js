const { getAuth, getFirestore } = require('../config/firebase-admin');

// Verify user token and get user info
const verifyToken = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No valid token provided'
      });
    }

    res.json({
      message: 'Token verified successfully',
      user: req.user
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to verify token'
    });
  }
};

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const db = getFirestore();
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    let userData = {
      uid: req.user.uid,
      email: req.user.email,
      emailVerified: req.user.emailVerified,
      name: req.user.name,
      picture: req.user.picture
    };

    if (userDoc.exists) {
      // Merge with stored user data
      userData = {
        ...userData,
        ...userDoc.data(),
        lastLoginAt: new Date()
      };

      // Update last login timestamp
      await db.collection('users').doc(req.user.uid).update({
        lastLoginAt: new Date(),
        updatedAt: new Date()
      });
    } else {
      // Create user document if it doesn't exist
      userData = {
        ...userData,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        updatedAt: new Date(),
        preferences: {
          theme: 'light',
          notifications: true,
          defaultWcagLevel: 'AA'
        }
      };

      await db.collection('users').doc(req.user.uid).set(userData);
    }

    res.json({
      message: 'User profile retrieved successfully',
      user: userData
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve user profile'
    });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const { name, preferences } = req.body;
    const db = getFirestore();

    const updateData = {
      updatedAt: new Date()
    };

    if (name) {
      updateData.name = name;
    }

    if (preferences) {
      updateData.preferences = preferences;
    }

    await db.collection('users').doc(req.user.uid).update(updateData);

    // Get updated user data
    const updatedDoc = await db.collection('users').doc(req.user.uid).get();
    const updatedUser = {
      uid: req.user.uid,
      email: req.user.email,
      emailVerified: req.user.emailVerified,
      ...updatedDoc.data()
    };

    res.json({
      message: 'User profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update user profile'
    });
  }
};

// Delete user account
const deleteUserAccount = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const auth = getAuth();
    const db = getFirestore();

    // Delete user data from Firestore
    const batch = db.batch();

    // Delete user document
    batch.delete(db.collection('users').doc(req.user.uid));

    // Delete user's analysis requests
    const analysisRequestsSnapshot = await db.collection('analysisRequests')
      .where('userId', '==', req.user.uid)
      .get();

    analysisRequestsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete user's analysis results
    const analysisResultsSnapshot = await db.collection('analysisResults')
      .where('userId', '==', req.user.uid)
      .get();

    analysisResultsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Commit the batch
    await batch.commit();

    // Delete user from Firebase Auth
    await auth.deleteUser(req.user.uid);

    res.json({
      message: 'User account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user account:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete user account'
    });
  }
};

// Create custom token (for testing purposes)
const createCustomToken = async (req, res) => {
  try {
    const { uid } = req.body;

    if (!uid) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'UID is required'
      });
    }

    const auth = getAuth();
    const customToken = await auth.createCustomToken(uid);

    res.json({
      message: 'Custom token created successfully',
      token: customToken
    });
  } catch (error) {
    console.error('Error creating custom token:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create custom token'
    });
  }
};

module.exports = {
  verifyToken,
  getUserProfile,
  updateUserProfile,
  deleteUserAccount,
  createCustomToken
};

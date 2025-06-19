const express = require('express');
const router = express.Router();
const { verifyFirebaseToken, optionalAuth } = require('../config/firebase-admin');
const {
  verifyToken,
  getUserProfile,
  updateUserProfile,
  deleteUserAccount,
  createCustomToken
} = require('../controllers/authController');

// Verify token endpoint
router.post('/verify', verifyFirebaseToken, verifyToken);

// Get user profile
router.get('/profile', verifyFirebaseToken, getUserProfile);

// Update user profile
router.put('/profile', verifyFirebaseToken, updateUserProfile);

// Delete user account
router.delete('/account', verifyFirebaseToken, deleteUserAccount);

// Create custom token (for testing - should be protected in production)
router.post('/custom-token', createCustomToken);

module.exports = router;

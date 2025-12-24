const express = require('express');
const router = express.Router();
const { verifyFirebaseToken, optionalAuth } = require('../config/firebase-admin');
const {
  createAnalysisRequest,
  getAnalysisRequest,
  getAnalysisResult,
  getUserAnalysisRequests,
  getRecentAnalyses,
  getAnalytics,
  getScanStatus,
  triggerScan,
  cancelScan,
  generateAIFix
} = require('../controllers/analysisController');

// Create new analysis request
router.post('/', optionalAuth, createAnalysisRequest);

// Get user's analysis requests (requires authentication)
router.get('/user/requests', verifyFirebaseToken, getUserAnalysisRequests);

// Get recent public analyses
router.get('/public/recent', getRecentAnalyses);

// Get analytics data (requires authentication for user-specific data)
router.get('/dashboard/analytics', verifyFirebaseToken, getAnalytics);

// Get analysis request by ID
router.get('/:id', optionalAuth, getAnalysisRequest);

// Get analysis result by analysis request ID
router.get('/:id/result', optionalAuth, getAnalysisResult);

// Get scan status for analysis request
router.get('/:id/status', optionalAuth, getScanStatus);

// Trigger manual scan for analysis request
router.post('/:id/scan', optionalAuth, triggerScan);

// Cancel active scan for analysis request
router.delete('/:id/scan', optionalAuth, cancelScan);

// Generate AI fix for specific violation
router.post('/:id/violations/:violationIndex/ai-fix', optionalAuth, generateAIFix);

module.exports = router;

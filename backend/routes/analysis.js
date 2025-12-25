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
  getUsage,
  getScanStatus,
  triggerScan,
  cancelScan,
  generateAIFix
} = require('../controllers/analysisController');

// Create new analysis request
router.post('/', verifyFirebaseToken, createAnalysisRequest);

// Get user's analysis requests (requires authentication)
router.get('/user/requests', verifyFirebaseToken, getUserAnalysisRequests);

// Get recent public analyses
router.get('/public/recent', getRecentAnalyses);

// Get analytics data (requires authentication for user-specific data)
router.get('/dashboard/analytics', verifyFirebaseToken, getAnalytics);

// Get demo usage quota (requires authentication)
router.get('/usage', verifyFirebaseToken, getUsage);

// Get analysis request by ID
router.get('/:id', verifyFirebaseToken, getAnalysisRequest);

// Get analysis result by analysis request ID
router.get('/:id/result', verifyFirebaseToken, getAnalysisResult);

// Get scan status for analysis request
router.get('/:id/status', verifyFirebaseToken, getScanStatus);

// Trigger manual scan for analysis request
router.post('/:id/scan', verifyFirebaseToken, triggerScan);

// Cancel active scan for analysis request
router.delete('/:id/scan', verifyFirebaseToken, cancelScan);

// Generate AI fix for specific violation
router.post('/:id/violations/:violationIndex/ai-fix', verifyFirebaseToken, generateAIFix);

module.exports = router;

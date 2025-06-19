const express = require('express');
const router = express.Router();
const { verifyFirebaseToken, optionalAuth } = require('../config/firebase-admin');
const {
  createAnalysisRequest,
  getAnalysisRequest,
  getAnalysisResult,
  getUserAnalysisRequests,
  getAnalysisByUrl,
  getRecentAnalyses,
  getAnalytics,
  getScanStatus,
  triggerScan,
  getHistoricalComparison,
  getViolationAnalysis
} = require('../controllers/analysisController');

// Create new analysis request
router.post('/', optionalAuth, createAnalysisRequest);

// Get analysis request by ID
router.get('/:id', optionalAuth, getAnalysisRequest);

// Get analysis result by analysis request ID
router.get('/:id/result', optionalAuth, getAnalysisResult);

// Get scan status for analysis request
router.get('/:id/status', optionalAuth, getScanStatus);

// Trigger manual scan for analysis request
router.post('/:id/scan', optionalAuth, triggerScan);

// Get user's analysis requests (requires authentication)
router.get('/user/requests', verifyFirebaseToken, getUserAnalysisRequests);

// Get analysis requests by URL (for longitudinal tracking)
router.get('/url/history', getAnalysisByUrl);

// Get recent public analyses
router.get('/public/recent', getRecentAnalyses);

// Get analytics data
router.get('/dashboard/analytics', optionalAuth, getAnalytics);

// Get historical comparison for a URL
router.get('/history/comparison', getHistoricalComparison);

// Get detailed violation analysis for a result
router.get('/:id/violations', optionalAuth, getViolationAnalysis);

module.exports = router;

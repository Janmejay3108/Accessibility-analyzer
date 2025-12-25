const AnalysisRequest = require('../models/AnalysisRequest');
const AnalysisResult = require('../models/AnalysisResult');
const scanningService = require('../utils/scanningService');
const geminiService = require('../services/geminiService');
const { validateUrl, validateAnalysisSettings, validatePagination } = require('../utils/validation');
const { getFirestore, admin } = require('../config/firebase-admin');

const DEMO_QUOTA_MESSAGE = 'Demo: Each account is limited to 5 analyses. For unlimited use, run the open-source project locally from GitHub: https://github.com/Janmejay3108/Accessibility-analyzer';
const DEMO_QUOTA_LIMIT = 5;
const inMemoryUsage = new Map();

const consumeDemoQuota = async (uid) => {
  try {
    const db = getFirestore();
    const usageRef = db.collection('usage').doc(uid);

    await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(usageRef);
      const data = snap.exists ? snap.data() : {};
      const currentCount = Number((data.analysisRuns ?? data.totalAiRequests) || 0);

      if (currentCount >= DEMO_QUOTA_LIMIT) {
        const err = new Error('QUOTA_EXCEEDED');
        err.code = 'QUOTA_EXCEEDED';
        throw err;
      }

      const createdAt = data.createdAt || admin.firestore.FieldValue.serverTimestamp();
      transaction.set(
        usageRef,
        {
          analysisRuns: currentCount + 1,
          createdAt,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        { merge: true }
      );
    });
  } catch (error) {
    if (error && error.code === 'QUOTA_EXCEEDED') {
      throw error;
    }

    const currentCount = Number(inMemoryUsage.get(uid) || 0);
    if (currentCount >= DEMO_QUOTA_LIMIT) {
      const err = new Error('QUOTA_EXCEEDED');
      err.code = 'QUOTA_EXCEEDED';
      throw err;
    }
    inMemoryUsage.set(uid, currentCount + 1);
  }
};

const getDemoUsage = async (uid) => {
  try {
    const db = getFirestore();
    const usageRef = db.collection('usage').doc(uid);
    const snap = await usageRef.get();
    const data = snap.exists ? snap.data() : {};
    const used = Number((data.analysisRuns ?? data.totalAiRequests) || 0);
    return {
      used,
      limit: DEMO_QUOTA_LIMIT
    };
  } catch (error) {
    const used = Number(inMemoryUsage.get(uid) || 0);
    return {
      used,
      limit: DEMO_QUOTA_LIMIT
    };
  }
};

const getUsage = async (req, res) => {
  try {
    if (!req.user?.uid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const usage = await getDemoUsage(req.user.uid);
    const remaining = Math.max(usage.limit - usage.used, 0);

    return res.json({
      message: 'Usage retrieved successfully',
      data: {
        used: usage.used,
        limit: usage.limit,
        remaining,
        finished: usage.used >= usage.limit
      }
    });
  } catch (error) {
    console.error('Error getting usage:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve usage'
    });
  }
};

// Create a new analysis request
const createAnalysisRequest = async (req, res) => {
  try {
    const { url, settings } = req.body;

    if (!req.user?.uid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    // Validate URL
    const urlValidation = validateUrl(url);
    if (!urlValidation.isValid) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'URL validation failed',
        details: urlValidation.errors
      });
    }

    // Validate settings
    const settingsValidation = validateAnalysisSettings(settings);
    if (!settingsValidation.isValid) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Settings validation failed',
        details: settingsValidation.errors
      });
    }

    try {
      await consumeDemoQuota(req.user.uid);
    } catch (quotaError) {
      if (quotaError && quotaError.code === 'QUOTA_EXCEEDED') {
        return res.status(429).json({
          error: 'Quota Exceeded',
          code: 'QUOTA_EXCEEDED',
          limit: DEMO_QUOTA_LIMIT,
          message: DEMO_QUOTA_MESSAGE
        });
      }

      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to process request'
      });
    }

    // Create analysis request
    const analysisRequest = await AnalysisRequest.create({
      url: urlValidation.normalizedUrl,
      userId: req.user.uid,
      settings: settingsValidation.settings,
      status: 'pending'
    });

    // Trigger accessibility scanning process asynchronously
    (async () => {
      try {
        await scanningService.processAnalysisRequest(analysisRequest.id);
      } catch (error) {
        console.error(`Background scan failed for request ${analysisRequest.id}:`, error);
      }
    })();

    res.status(201).json({
      message: 'Analysis request created successfully. Scanning will begin shortly.',
      data: analysisRequest
    });
  } catch (error) {
    console.error('Error creating analysis request:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create analysis request'
    });
  }
};

// Get user's analysis requests
const getUserAnalysisRequests = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    // Validate pagination
    const paginationValidation = validatePagination(req.query);
    if (!paginationValidation.isValid) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Pagination validation failed',
        details: paginationValidation.errors
      });
    }

    const { limit, offset } = paginationValidation.pagination;

    const analysisRequests = await AnalysisRequest.getByUserId(
      req.user.uid,
      limit,
      offset
    );

    let total = null;
    try {
      const db = getFirestore();
      const totalSnap = await db
        .collection('analysisRequests')
        .where('userId', '==', req.user.uid)
        .count()
        .get();
      total = totalSnap.data().count;
    } catch (countErr) {
      total = null;
    }

    let enriched = analysisRequests;
    try {
      const db = getFirestore();
      const ids = analysisRequests.map(r => r.id).filter(Boolean);

      if (ids.length > 0) {
        const resultByRequestId = new Map();

        for (let i = 0; i < ids.length; i += 10) {
          const chunk = ids.slice(i, i + 10);
          const resultsSnap = await db
            .collection('analysisResults')
            .where('analysisRequestId', 'in', chunk)
            .get();

          resultsSnap.docs.forEach(doc => {
            const data = doc.data();
            if (data && data.analysisRequestId) {
              resultByRequestId.set(data.analysisRequestId, { id: doc.id, ...data });
            }
          });
        }

        enriched = analysisRequests.map(reqItem => {
          const linkedResult = resultByRequestId.get(reqItem.id);
          const summary = linkedResult?.summary;
          const complianceScore = summary?.complianceScore;
          return {
            ...reqItem,
            resultSummary: summary,
            complianceScore: complianceScore
          };
        });
      }
    } catch (enrichErr) {
      enriched = analysisRequests;
    }

    res.json({
      message: 'User analysis requests retrieved successfully',
      data: {
        analyses: enriched,
        total: total ?? enriched.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      },
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: enriched.length
      }
    });
  } catch (error) {
    console.error('Error getting user analysis requests:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve user analysis requests'
    });
  }
};

// Get recent public analysis requests
const getRecentAnalyses = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const recentAnalyses = await AnalysisRequest.getRecent(parseInt(limit));

    res.json({
      message: 'Recent analyses retrieved successfully',
      data: recentAnalyses
    });
  } catch (error) {
    console.error('Error getting recent analyses:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve recent analyses'
    });
  }
};

const getAnalysisRequest = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user?.uid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const analysisRequest = await AnalysisRequest.getById(id);
    if (!analysisRequest) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Analysis request not found'
      });
    }

    if (analysisRequest.userId && analysisRequest.userId !== req.user.uid) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this analysis request'
      });
    }

    return res.json({
      message: 'Analysis request retrieved successfully',
      data: analysisRequest
    });
  } catch (error) {
    console.error('Error getting analysis request:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve analysis request'
    });
  }
};

const getAnalysisResult = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user?.uid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const analysisRequest = await AnalysisRequest.getById(id);
    if (!analysisRequest) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Analysis request not found'
      });
    }

    if (analysisRequest.userId && analysisRequest.userId !== req.user.uid) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this analysis result'
      });
    }

    const analysisResult = await AnalysisResult.getByAnalysisRequestId(id);
    if (!analysisResult) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Analysis result not found'
      });
    }

    return res.json({
      message: 'Analysis result retrieved successfully',
      data: analysisResult
    });
  } catch (error) {
    console.error('Error getting analysis result:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve analysis result'
    });
  }
};

const getAnalytics = async (req, res) => {
  try {
    if (!req.user?.uid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const analytics = await AnalysisResult.getAnalytics(req.user.uid);

    return res.json({
      message: 'Analytics retrieved successfully',
      data: analytics
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve analytics'
    });
  }
};

const getScanStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user?.uid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const analysisRequest = await AnalysisRequest.getById(id);
    if (!analysisRequest) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Analysis request not found'
      });
    }

    if (analysisRequest.userId && analysisRequest.userId !== req.user.uid) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this analysis request'
      });
    }

    const scanStatus = scanningService.getScanStatus(id);

    return res.json({
      message: 'Scan status retrieved successfully',
      data: {
        analysisRequest,
        scanStatus
      }
    });
  } catch (error) {
    console.error('Error getting scan status:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve scan status'
    });
  }
};

const triggerScan = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user?.uid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const analysisRequest = await AnalysisRequest.getById(id);
    if (!analysisRequest) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Analysis request not found'
      });
    }

    if (analysisRequest.userId && analysisRequest.userId !== req.user.uid) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to trigger this analysis'
      });
    }

    const currentScan = scanningService.getScanStatus(id);
    if (currentScan.status === 'processing') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Analysis request is already being processed'
      });
    }

    (async () => {
      try {
        await scanningService.processAnalysisRequest(id);
      } catch (error) {
        console.error(`Background scan failed for request ${id}:`, error);
      }
    })();

    return res.status(202).json({
      message: 'Scan triggered successfully',
      data: {
        id,
        status: 'processing'
      }
    });
  } catch (error) {
    console.error('Error triggering scan:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to trigger scan'
    });
  }
};

const cancelScan = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user?.uid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const analysisRequest = await AnalysisRequest.getById(id);
    if (!analysisRequest) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Analysis request not found'
      });
    }

    if (analysisRequest.userId && analysisRequest.userId !== req.user.uid) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to cancel this analysis'
      });
    }

    const cancelled = await scanningService.cancelScan(id);

    if (cancelled) {
      return res.json({
        message: 'Scan cancelled successfully',
        data: {
          id,
          status: 'cancelled'
        }
      });
    }

    return res.status(404).json({
      error: 'Not Found',
      message: 'No active scan found to cancel'
    });
  } catch (error) {
    console.error('Error cancelling scan:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to cancel scan'
    });
  }
};

// Generate AI fix for specific violation
const generateAIFix = async (req, res) => {
  try {
    const { id, violationIndex } = req.params;

    // Validate violation index
    const violationIdx = parseInt(violationIndex);
    if (isNaN(violationIdx) || violationIdx < 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid violation index'
      });
    }

    // Check if AI service is available
    if (!geminiService.isAvailable()) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'AI service is not configured. Please contact administrator.'
      });
    }

    // Get analysis result
    const analysisResult = await AnalysisResult.getByAnalysisRequestId(id);
    if (!analysisResult) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Analysis result not found'
      });
    }

    // Get specific violation
    const violations = analysisResult.axeCoreResults?.violations || [];
    if (violationIdx >= violations.length) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Violation not found at specified index'
      });
    }

    const violation = violations[violationIdx];

    // Build context for AI
    const context = {
      url: analysisResult.url,
      wcagLevel: analysisResult.summary?.wcagLevel || 'AA',
      analysisDate: analysisResult.createdAt
    };

    // Generate AI fix
    const aiFix = await geminiService.generateAccessibilityFix(violation, context);

    res.json({
      message: 'AI fix generated successfully',
      data: {
        analysisId: id,
        violationIndex: violationIdx,
        violation: {
          id: violation.id,
          impact: violation.impact,
          description: violation.description
        },
        aiFix: aiFix
      }
    });
  } catch (error) {
    console.error('Error generating AI fix:', error);

    // Handle specific error types
    if (error.message.includes('AI service unavailable')) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'AI service is temporarily unavailable. Please try again later.'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate AI fix'
    });
  }
};

module.exports = {
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
};

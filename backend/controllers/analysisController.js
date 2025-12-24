const AnalysisRequest = require('../models/AnalysisRequest');
const AnalysisResult = require('../models/AnalysisResult');
const scanningService = require('../utils/scanningService');
const geminiService = require('../services/geminiService');
const { validateUrl, validateAnalysisSettings, validatePagination } = require('../utils/validation');

// Create a new analysis request
const createAnalysisRequest = async (req, res) => {
  try {
    const { url, settings } = req.body;

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

    // Create analysis request
    const analysisRequest = await AnalysisRequest.create({
      url: urlValidation.normalizedUrl,
      userId: req.user?.uid || null,
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

// Get analysis request by ID
const getAnalysisRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const analysisRequest = await AnalysisRequest.getById(id);
    
    if (!analysisRequest) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Analysis request not found'
      });
    }

    // Check if user has permission to view this request
    if (analysisRequest.userId && req.user?.uid !== analysisRequest.userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to view this analysis request'
      });
    }

    res.json({
      message: 'Analysis request retrieved successfully',
      data: analysisRequest
    });
  } catch (error) {
    console.error('Error getting analysis request:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve analysis request'
    });
  }
};

// Get analysis result by analysis request ID
const getAnalysisResult = async (req, res) => {
  try {
    const { id } = req.params;
    
    // First check if the analysis request exists and user has permission
    const analysisRequest = await AnalysisRequest.getById(id);
    
    if (!analysisRequest) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Analysis request not found'
      });
    }

    if (analysisRequest.userId && req.user?.uid !== analysisRequest.userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to view this analysis result'
      });
    }

    // Get the analysis result
    const analysisResult = await AnalysisResult.getByAnalysisRequestId(id);
    
    if (!analysisResult) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Analysis result not found'
      });
    }

    res.json({
      message: 'Analysis result retrieved successfully',
      data: analysisResult
    });
  } catch (error) {
    console.error('Error getting analysis result:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve analysis result'
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

    res.json({
      message: 'User analysis requests retrieved successfully',
      data: analysisRequests,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: analysisRequests.length
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

// Get analytics data (user-specific only)
const getAnalytics = async (req, res) => {
  try {
    // Require authentication for dashboard analytics
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required to view analytics'
      });
    }

    const { dateRange } = req.query;
    let parsedDateRange = null;

    if (dateRange) {
      try {
        parsedDateRange = JSON.parse(dateRange);
        if (parsedDateRange.start) {
          parsedDateRange.start = new Date(parsedDateRange.start);
        }
        if (parsedDateRange.end) {
          parsedDateRange.end = new Date(parsedDateRange.end);
        }
      } catch (error) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid date range format'
        });
      }
    }

    // Always pass the authenticated user's ID - never null
    const analytics = await AnalysisResult.getAnalytics(
      req.user.uid,
      parsedDateRange
    );

    res.json({
      message: 'Analytics data retrieved successfully',
      data: analytics
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve analytics data'
    });
  }
};

// Get scan status for an analysis request
const getScanStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Get analysis request to check permissions
    const analysisRequest = await AnalysisRequest.getById(id);

    if (!analysisRequest) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Analysis request not found'
      });
    }

    // Check permissions
    if (analysisRequest.userId && req.user?.uid !== analysisRequest.userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to view this scan status'
      });
    }

    // Get scan status from scanning service
    const scanStatus = scanningService.getScanStatus(id);

    res.json({
      message: 'Scan status retrieved successfully',
      data: {
        analysisRequest: {
          id: analysisRequest.id,
          url: analysisRequest.url,
          status: analysisRequest.status,
          requestTimestamp: analysisRequest.requestTimestamp,
          completedTimestamp: analysisRequest.completedTimestamp
        },
        scanStatus: scanStatus
      }
    });
  } catch (error) {
    console.error('Error getting scan status:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve scan status'
    });
  }
};

// Trigger manual scan for an existing analysis request
const triggerScan = async (req, res) => {
  try {
    const { id } = req.params;

    // Get analysis request
    const analysisRequest = await AnalysisRequest.getById(id);

    if (!analysisRequest) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Analysis request not found'
      });
    }

    // Check permissions
    if (analysisRequest.userId && req.user?.uid !== analysisRequest.userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to trigger this scan'
      });
    }

    // Check if already processing
    const scanStatus = scanningService.getScanStatus(id);
    if (scanStatus.status === 'processing') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Scan is already in progress'
      });
    }

    // Reset status to pending
    await AnalysisRequest.update(id, {
      status: 'pending',
      metadata: {
        ...analysisRequest.metadata,
        manualTrigger: new Date()
      }
    });

    // Trigger scan
    setImmediate(async () => {
      try {
        await scanningService.processAnalysisRequest(id);
      } catch (error) {
        console.error(`Manual scan failed for request ${id}:`, error);
      }
    });

    res.json({
      message: 'Scan triggered successfully',
      data: {
        id: id,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Error triggering scan:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to trigger scan'
    });
  }
};

// Cancel an active scan
const cancelScan = async (req, res) => {
  try {
    const { id } = req.params;

    // Get analysis request
    const analysisRequest = await AnalysisRequest.getById(id);

    if (!analysisRequest) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Analysis request not found'
      });
    }

    // Check permissions
    if (analysisRequest.userId && req.user?.uid !== analysisRequest.userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to cancel this scan'
      });
    }

    // Cancel the scan
    const cancelled = await scanningService.cancelScan(id);

    if (cancelled) {
      res.json({
        message: 'Scan cancelled successfully',
        data: {
          id: id,
          status: 'cancelled'
        }
      });
    } else {
      res.status(404).json({
        error: 'Not Found',
        message: 'No active scan found to cancel'
      });
    }
  } catch (error) {
    console.error('Error cancelling scan:', error);
    res.status(500).json({
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
  getScanStatus,
  triggerScan,
  cancelScan,
  generateAIFix
};

const AnalysisRequest = require('../models/AnalysisRequest');
const AnalysisResult = require('../models/AnalysisResult');
const scanningService = require('../utils/scanningService');
const { validateUrl, validateAnalysisSettings, validatePagination, validateDateRange } = require('../utils/validation');

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
    setImmediate(async () => {
      try {
        await scanningService.processAnalysisRequest(analysisRequest.id);
      } catch (error) {
        console.error(`Background scan failed for request ${analysisRequest.id}:`, error);
      }
    });

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

// Get analysis requests by URL (for longitudinal tracking)
const getAnalysisByUrl = async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'URL parameter is required'
      });
    }

    const { limit = 10 } = req.query;
    
    const analysisRequests = await AnalysisRequest.getByUrl(url, parseInt(limit));

    res.json({
      message: 'Analysis requests by URL retrieved successfully',
      data: analysisRequests,
      url: url
    });
  } catch (error) {
    console.error('Error getting analysis by URL:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve analysis by URL'
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

// Get analytics data
const getAnalytics = async (req, res) => {
  try {
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

    const analytics = await AnalysisResult.getAnalytics(
      req.user?.uid || null,
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

// Get historical analysis comparison for a URL
const getHistoricalComparison = async (req, res) => {
  try {
    const { url } = req.query;
    const { limit = 5 } = req.query;

    if (!url) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'URL parameter is required'
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

    // Get historical analysis results for this URL
    const analysisResults = await AnalysisResult.getByUrl(url, parseInt(limit));

    if (analysisResults.length === 0) {
      return res.json({
        message: 'No historical data found for this URL',
        data: {
          url: url,
          analyses: [],
          trends: null
        }
      });
    }

    // Calculate trends
    const trends = calculateTrends(analysisResults);

    res.json({
      message: 'Historical comparison retrieved successfully',
      data: {
        url: url,
        analyses: analysisResults.map(result => ({
          id: result.id,
          createdAt: result.createdAt,
          summary: result.summary,
          complianceScore: result.summary?.complianceScore || 0,
          totalIssues: result.summary?.totalIssues || 0,
          criticalIssues: result.summary?.criticalIssues || 0
        })),
        trends: trends
      }
    });
  } catch (error) {
    console.error('Error getting historical comparison:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve historical comparison'
    });
  }
};

// Get detailed violation analysis
const getViolationAnalysis = async (req, res) => {
  try {
    const { id } = req.params;

    const analysisResult = await AnalysisResult.getById(id);

    if (!analysisResult) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Analysis result not found'
      });
    }

    // Check permissions
    if (analysisResult.userId && req.user?.uid !== analysisResult.userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to view this analysis'
      });
    }

    // Process violations for detailed analysis
    const violationAnalysis = processViolationAnalysis(analysisResult.axeCoreResults);

    res.json({
      message: 'Violation analysis retrieved successfully',
      data: {
        analysisId: id,
        url: analysisResult.url,
        violationAnalysis: violationAnalysis,
        summary: analysisResult.summary,
        scanDate: analysisResult.createdAt
      }
    });
  } catch (error) {
    console.error('Error getting violation analysis:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve violation analysis'
    });
  }
};

// Helper function to calculate trends
function calculateTrends(analysisResults) {
  if (analysisResults.length < 2) {
    return null;
  }

  const sorted = analysisResults.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const latest = sorted[sorted.length - 1];
  const previous = sorted[sorted.length - 2];

  const complianceChange = (latest.summary?.complianceScore || 0) - (previous.summary?.complianceScore || 0);
  const issuesChange = (latest.summary?.totalIssues || 0) - (previous.summary?.totalIssues || 0);

  return {
    complianceScoreChange: complianceChange,
    totalIssuesChange: issuesChange,
    trend: complianceChange > 0 ? 'improving' : complianceChange < 0 ? 'declining' : 'stable',
    timespan: {
      from: previous.createdAt,
      to: latest.createdAt
    },
    dataPoints: sorted.length
  };
}

// Helper function to process violation analysis
function processViolationAnalysis(axeCoreResults) {
  if (!axeCoreResults || !axeCoreResults.violations) {
    return {
      byImpact: {},
      byWCAGLevel: {},
      byCategory: {},
      mostCommon: [],
      affectedElements: 0
    };
  }

  const analysis = {
    byImpact: { critical: 0, serious: 0, moderate: 0, minor: 0 },
    byWCAGLevel: { 'wcag2a': 0, 'wcag2aa': 0, 'wcag21aa': 0, 'wcag21aaa': 0 },
    byCategory: {},
    mostCommon: [],
    affectedElements: 0
  };

  const violationCounts = {};

  axeCoreResults.violations.forEach(violation => {
    // Count by impact
    if (violation.impact) {
      analysis.byImpact[violation.impact] = (analysis.byImpact[violation.impact] || 0) + 1;
    }

    // Count by WCAG level
    violation.tags?.forEach(tag => {
      if (tag.startsWith('wcag')) {
        analysis.byWCAGLevel[tag] = (analysis.byWCAGLevel[tag] || 0) + 1;
      }
    });

    // Count affected elements
    analysis.affectedElements += violation.nodes?.length || 0;

    // Track violation frequency
    violationCounts[violation.id] = (violationCounts[violation.id] || 0) + (violation.nodes?.length || 1);

    // Categorize violations
    const category = categorizeViolation(violation);
    analysis.byCategory[category] = (analysis.byCategory[category] || 0) + 1;
  });

  // Get most common violations
  analysis.mostCommon = Object.entries(violationCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([id, count]) => ({ id, count }));

  return analysis;
}

// Helper function to categorize violations
function categorizeViolation(violation) {
  const tags = violation.tags || [];

  if (tags.some(tag => tag.includes('color'))) return 'Color & Contrast';
  if (tags.some(tag => tag.includes('keyboard'))) return 'Keyboard Navigation';
  if (tags.some(tag => tag.includes('forms'))) return 'Forms';
  if (tags.some(tag => tag.includes('images'))) return 'Images & Media';
  if (tags.some(tag => tag.includes('headings'))) return 'Headings & Structure';
  if (tags.some(tag => tag.includes('links'))) return 'Links';
  if (tags.some(tag => tag.includes('aria'))) return 'ARIA & Semantics';

  return 'Other';
}

module.exports = {
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
};

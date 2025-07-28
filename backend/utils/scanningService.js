const AccessibilityScanner = require('./accessibilityScanner');
const AnalysisRequest = require('../models/AnalysisRequest');
const AnalysisResult = require('../models/AnalysisResult');

class ScanningService {
  constructor() {
    this.activeScans = new Map(); // Track active scans
  }

  /**
   * Process an analysis request and perform the scan
   */
  async processAnalysisRequest(analysisRequestId) {
    let scanner = null;

    try {
      console.log(`🔄 Processing analysis request: ${analysisRequestId}`);

      // Get the analysis request
      const analysisRequest = await AnalysisRequest.getById(analysisRequestId);
      if (!analysisRequest) {
        throw new Error('Analysis request not found');
      }

      // Check if already processing
      if (this.activeScans.has(analysisRequestId)) {
        throw new Error('Analysis request is already being processed');
      }

      // Mark as processing
      this.activeScans.set(analysisRequestId, { startTime: new Date() });

      // Update status to processing
      await AnalysisRequest.update(analysisRequestId, {
        status: 'processing',
        metadata: {
          ...analysisRequest.metadata,
          processingStarted: new Date()
        }
      });

      // Initialize scanner with settings from the request
      const scannerOptions = this.buildScannerOptions(analysisRequest.settings);
      scanner = new AccessibilityScanner(scannerOptions);

      // Perform the scan with timeout wrapper
      console.log(`🔍 Starting accessibility scan for: ${analysisRequest.url}`);

      // Create a timeout promise that rejects after a certain time
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Analysis timeout: The website took too long to respond or may be blocking automated access'));
        }, scannerOptions.timeout + 10000); // Add 10 seconds buffer to scanner timeout
      });

      // Race between scan and timeout
      const scanResults = await Promise.race([
        scanner.scan(analysisRequest.url, {
          captureScreenshot: analysisRequest.settings?.captureScreenshot || false,
          axeOptions: analysisRequest.settings?.axeOptions || {}
        }),
        timeoutPromise
      ]);

      // Process and structure the results
      const processedResults = this.processResults(scanResults, analysisRequest);

      // Create analysis result in database
      const analysisResult = await AnalysisResult.create({
        analysisRequestId: analysisRequestId,
        url: analysisRequest.url,
        userId: analysisRequest.userId,
        axeCoreResults: processedResults.axeCoreResults,
        summary: processedResults.summary,
        recommendations: processedResults.recommendations,
        metadata: processedResults.metadata
      });

      // Update analysis request status to completed
      await AnalysisRequest.update(analysisRequestId, {
        status: 'completed',
        completedTimestamp: new Date(),
        metadata: {
          ...analysisRequest.metadata,
          processingCompleted: new Date(),
          resultId: analysisResult.id
        }
      });

      console.log(`✅ Analysis completed successfully: ${analysisRequestId}`);
      return {
        analysisRequest: await AnalysisRequest.getById(analysisRequestId),
        analysisResult: analysisResult
      };

    } catch (error) {
      console.error(`❌ Analysis failed for request ${analysisRequestId}:`, error);

      // Categorize the error for better user feedback
      let errorCategory = 'unknown';
      let userFriendlyMessage = error.message;

      if (error.message.includes('net::ERR_CONNECTION_TIMED_OUT') ||
          error.message.includes('timeout') ||
          error.message.includes('Analysis timeout')) {
        errorCategory = 'timeout';
        userFriendlyMessage = 'The website took too long to respond. This may be due to slow loading times, network issues, or the website blocking automated access.';
      } else if (error.message.includes('net::ERR_NAME_NOT_RESOLVED') ||
                 error.message.includes('net::ERR_INTERNET_DISCONNECTED')) {
        errorCategory = 'network';
        userFriendlyMessage = 'Unable to reach the website. Please check the URL and your internet connection.';
      } else if (error.message.includes('HTTP 403') ||
                 error.message.includes('HTTP 429') ||
                 error.message.includes('blocked')) {
        errorCategory = 'blocked';
        userFriendlyMessage = 'The website is blocking automated access. This is common with sites that have anti-bot protection.';
      } else if (error.message.includes('HTTP 404')) {
        errorCategory = 'not_found';
        userFriendlyMessage = 'The webpage was not found (404 error). Please check the URL.';
      } else if (error.message.includes('HTTP 5')) {
        errorCategory = 'server_error';
        userFriendlyMessage = 'The website is experiencing server issues. Please try again later.';
      } else if (error.message.includes('Content Security Policy') ||
                 error.message.includes('CSP')) {
        errorCategory = 'csp';
        userFriendlyMessage = 'The website has strict security policies that prevent detailed analysis. A basic analysis was attempted.';
      }

      // Update status to failed with detailed error information
      try {
        await AnalysisRequest.update(analysisRequestId, {
          status: 'failed',
          metadata: {
            error: error.message,
            errorCategory: errorCategory,
            userFriendlyMessage: userFriendlyMessage,
            failedAt: new Date(),
            processingDuration: new Date() - (this.activeScans.get(analysisRequestId)?.startTime || new Date())
          }
        });
      } catch (updateError) {
        console.error('Failed to update analysis request status:', updateError);
      }

      throw error;
    } finally {
      // Cleanup
      if (scanner) {
        await scanner.cleanup();
      }
      this.activeScans.delete(analysisRequestId);
    }
  }

  /**
   * Build scanner options from analysis request settings
   */
  buildScannerOptions(settings = {}) {
    return {
      timeout: settings.timeout || 45000, // 45 seconds - more reasonable timeout
      viewport: settings.viewport || { width: 1280, height: 720 },
      waitForSelector: settings.waitForSelector || 'body',
      userAgent: settings.userAgent || undefined
    };
  }

  /**
   * Process scan results and generate recommendations
   */
  processResults(scanResults, analysisRequest) {
    // Extract axe-core results
    const axeCoreResults = {
      violations: scanResults.violations,
      passes: scanResults.passes,
      incomplete: scanResults.incomplete,
      inapplicable: scanResults.inapplicable,
      metadata: scanResults.metadata
    };

    // Generate summary
    const summary = {
      totalIssues: scanResults.summary.totalViolations,
      criticalIssues: scanResults.summary.violationsBySeverity.critical,
      seriousIssues: scanResults.summary.violationsBySeverity.serious,
      moderateIssues: scanResults.summary.violationsBySeverity.moderate,
      minorIssues: scanResults.summary.violationsBySeverity.minor,
      wcagLevel: analysisRequest.settings?.wcagLevel || 'AA',
      complianceScore: scanResults.summary.complianceScore,
      totalPasses: scanResults.summary.totalPasses,
      totalIncomplete: scanResults.summary.totalIncomplete
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations(scanResults.violations);

    // Compile metadata
    const metadata = {
      scanTimestamp: scanResults.timestamp,
      pageMetadata: scanResults.metadata.page,
      navigation: scanResults.navigation,
      axeVersion: scanResults.metadata.axeVersion,
      screenshot: scanResults.screenshot,
      processingTime: new Date() - new Date(scanResults.timestamp)
    };

    return {
      axeCoreResults,
      summary,
      recommendations,
      metadata
    };
  }

  /**
   * Generate actionable recommendations based on violations
   */
  generateRecommendations(violations) {
    const recommendations = [];
    const priorityMap = { critical: 1, serious: 2, moderate: 3, minor: 4 };

    // Group violations by rule ID
    const groupedViolations = violations.reduce((acc, violation) => {
      if (!acc[violation.id]) {
        acc[violation.id] = [];
      }
      acc[violation.id].push(violation);
      return acc;
    }, {});

    // Generate recommendations for each violation type
    Object.entries(groupedViolations).forEach(([ruleId, ruleViolations]) => {
      const violation = ruleViolations[0]; // Use first violation as template
      const affectedElements = ruleViolations.reduce((sum, v) => sum + v.nodes.length, 0);

      recommendations.push({
        id: ruleId,
        title: violation.help,
        description: violation.description,
        impact: violation.impact,
        priority: priorityMap[violation.impact] || 4,
        affectedElements: affectedElements,
        wcagTags: violation.tags.filter(tag => tag.startsWith('wcag')),
        helpUrl: violation.helpUrl,
        remediation: this.getRemediationGuidance(ruleId, violation),
        estimatedEffort: this.estimateEffort(violation.impact, affectedElements)
      });
    });

    // Sort by priority (critical first) and affected elements
    recommendations.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return b.affectedElements - a.affectedElements;
    });

    return recommendations;
  }

  /**
   * Get specific remediation guidance for common violations
   */
  getRemediationGuidance(ruleId, violation) {
    const commonRemediations = {
      'color-contrast': 'Ensure text has sufficient color contrast against its background. Use a contrast ratio of at least 4.5:1 for normal text and 3:1 for large text.',
      'image-alt': 'Add descriptive alt text to images. Use alt="" for decorative images.',
      'heading-order': 'Use heading tags (h1-h6) in logical order without skipping levels.',
      'link-name': 'Ensure all links have descriptive text or accessible names.',
      'button-name': 'Provide accessible names for all buttons using text content or aria-label.',
      'form-field-multiple-labels': 'Ensure form fields have unique, descriptive labels.',
      'landmark-one-main': 'Include exactly one main landmark per page.',
      'page-has-heading-one': 'Include exactly one h1 heading per page.',
      'region': 'Ensure all content is contained within landmark regions.'
    };

    return commonRemediations[ruleId] || violation.help;
  }

  /**
   * Estimate effort required to fix violations
   */
  estimateEffort(impact, affectedElements) {
    const baseEffort = {
      critical: 4,
      serious: 3,
      moderate: 2,
      minor: 1
    };

    const effort = (baseEffort[impact] || 1) * Math.min(affectedElements, 10);
    
    if (effort <= 2) return 'Low';
    if (effort <= 6) return 'Medium';
    if (effort <= 12) return 'High';
    return 'Very High';
  }

  /**
   * Get scan status for an analysis request
   */
  getScanStatus(analysisRequestId) {
    if (this.activeScans.has(analysisRequestId)) {
      const scanInfo = this.activeScans.get(analysisRequestId);
      return {
        status: 'processing',
        startTime: scanInfo.startTime,
        duration: new Date() - scanInfo.startTime
      };
    }
    return { status: 'not_active' };
  }

  /**
   * Get all active scans
   */
  getActiveScans() {
    const scans = [];
    this.activeScans.forEach((scanInfo, requestId) => {
      scans.push({
        requestId,
        startTime: scanInfo.startTime,
        duration: new Date() - scanInfo.startTime
      });
    });
    return scans;
  }

  /**
   * Cancel an active scan
   */
  async cancelScan(analysisRequestId) {
    if (this.activeScans.has(analysisRequestId)) {
      this.activeScans.delete(analysisRequestId);
      
      // Update status in database
      await AnalysisRequest.update(analysisRequestId, {
        status: 'cancelled',
        metadata: {
          cancelledAt: new Date()
        }
      });

      return true;
    }
    return false;
  }
}

// Create singleton instance
const scanningService = new ScanningService();

module.exports = scanningService;

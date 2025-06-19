const { getFirestore } = require('../config/firebase-admin');
const AnalysisRequest = require('../models/AnalysisRequest');
const AnalysisResult = require('../models/AnalysisResult');

class DataIntegrityService {
  constructor() {
    this.db = getFirestore();
  }

  /**
   * Perform comprehensive data integrity check
   */
  async performIntegrityCheck() {
    console.log('🔍 Starting data integrity check...');
    
    const results = {
      timestamp: new Date(),
      checks: {
        orphanedResults: await this.checkOrphanedResults(),
        incompleteRequests: await this.checkIncompleteRequests(),
        dataConsistency: await this.checkDataConsistency(),
        duplicateAnalyses: await this.checkDuplicateAnalyses()
      },
      summary: {
        totalIssues: 0,
        criticalIssues: 0,
        warnings: 0
      }
    };

    // Calculate summary
    Object.values(results.checks).forEach(check => {
      results.summary.totalIssues += check.issues.length;
      results.summary.criticalIssues += check.issues.filter(issue => issue.severity === 'critical').length;
      results.summary.warnings += check.issues.filter(issue => issue.severity === 'warning').length;
    });

    console.log(`✅ Data integrity check completed. Found ${results.summary.totalIssues} issues.`);
    return results;
  }

  /**
   * Check for orphaned analysis results (results without corresponding requests)
   */
  async checkOrphanedResults() {
    const issues = [];
    
    try {
      const resultsSnapshot = await this.db.collection('analysisResults').get();
      
      for (const resultDoc of resultsSnapshot.docs) {
        const result = resultDoc.data();
        
        if (result.analysisRequestId) {
          const requestDoc = await this.db.collection('analysisRequests')
            .doc(result.analysisRequestId).get();
          
          if (!requestDoc.exists) {
            issues.push({
              type: 'orphaned_result',
              severity: 'critical',
              message: `Analysis result ${resultDoc.id} references non-existent request ${result.analysisRequestId}`,
              resultId: resultDoc.id,
              requestId: result.analysisRequestId
            });
          }
        } else {
          issues.push({
            type: 'missing_request_id',
            severity: 'critical',
            message: `Analysis result ${resultDoc.id} is missing analysisRequestId`,
            resultId: resultDoc.id
          });
        }
      }
    } catch (error) {
      issues.push({
        type: 'check_error',
        severity: 'critical',
        message: `Error checking orphaned results: ${error.message}`
      });
    }

    return { name: 'Orphaned Results Check', issues };
  }

  /**
   * Check for incomplete analysis requests (stuck in processing state)
   */
  async checkIncompleteRequests() {
    const issues = [];
    
    try {
      const cutoffTime = new Date(Date.now() - (2 * 60 * 60 * 1000)); // 2 hours ago
      
      const requestsSnapshot = await this.db.collection('analysisRequests')
        .where('status', '==', 'processing')
        .where('requestTimestamp', '<', cutoffTime)
        .get();
      
      requestsSnapshot.docs.forEach(doc => {
        const request = doc.data();
        issues.push({
          type: 'stuck_processing',
          severity: 'warning',
          message: `Analysis request ${doc.id} has been processing for over 2 hours`,
          requestId: doc.id,
          url: request.url,
          requestTimestamp: request.requestTimestamp
        });
      });
    } catch (error) {
      issues.push({
        type: 'check_error',
        severity: 'critical',
        message: `Error checking incomplete requests: ${error.message}`
      });
    }

    return { name: 'Incomplete Requests Check', issues };
  }

  /**
   * Check data consistency between requests and results
   */
  async checkDataConsistency() {
    const issues = [];
    
    try {
      const requestsSnapshot = await this.db.collection('analysisRequests')
        .where('status', '==', 'completed')
        .get();
      
      for (const requestDoc of requestsSnapshot.docs) {
        const request = requestDoc.data();
        
        // Check if completed request has corresponding result
        const resultSnapshot = await this.db.collection('analysisResults')
          .where('analysisRequestId', '==', requestDoc.id)
          .get();
        
        if (resultSnapshot.empty) {
          issues.push({
            type: 'missing_result',
            severity: 'critical',
            message: `Completed request ${requestDoc.id} has no corresponding result`,
            requestId: requestDoc.id,
            url: request.url
          });
        } else if (resultSnapshot.docs.length > 1) {
          issues.push({
            type: 'duplicate_results',
            severity: 'warning',
            message: `Request ${requestDoc.id} has multiple results`,
            requestId: requestDoc.id,
            resultCount: resultSnapshot.docs.length
          });
        } else {
          // Check URL consistency
          const result = resultSnapshot.docs[0].data();
          if (result.url !== request.url) {
            issues.push({
              type: 'url_mismatch',
              severity: 'critical',
              message: `URL mismatch between request and result for ${requestDoc.id}`,
              requestId: requestDoc.id,
              requestUrl: request.url,
              resultUrl: result.url
            });
          }
        }
      }
    } catch (error) {
      issues.push({
        type: 'check_error',
        severity: 'critical',
        message: `Error checking data consistency: ${error.message}`
      });
    }

    return { name: 'Data Consistency Check', issues };
  }

  /**
   * Check for potential duplicate analyses
   */
  async checkDuplicateAnalyses() {
    const issues = [];
    
    try {
      const resultsSnapshot = await this.db.collection('analysisResults').get();
      const urlGroups = {};
      
      // Group results by URL and user
      resultsSnapshot.docs.forEach(doc => {
        const result = doc.data();
        const key = `${result.url}:${result.userId || 'anonymous'}`;
        
        if (!urlGroups[key]) {
          urlGroups[key] = [];
        }
        
        urlGroups[key].push({
          id: doc.id,
          createdAt: result.createdAt,
          url: result.url,
          userId: result.userId
        });
      });
      
      // Check for potential duplicates (same URL, same user, within 1 hour)
      Object.entries(urlGroups).forEach(([key, results]) => {
        if (results.length > 1) {
          const sorted = results.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          
          for (let i = 1; i < sorted.length; i++) {
            const timeDiff = new Date(sorted[i].createdAt) - new Date(sorted[i-1].createdAt);
            const hoursDiff = timeDiff / (1000 * 60 * 60);
            
            if (hoursDiff < 1) {
              issues.push({
                type: 'potential_duplicate',
                severity: 'warning',
                message: `Potential duplicate analysis for ${sorted[i].url}`,
                resultIds: [sorted[i-1].id, sorted[i].id],
                timeDifference: `${Math.round(hoursDiff * 60)} minutes`
              });
            }
          }
        }
      });
    } catch (error) {
      issues.push({
        type: 'check_error',
        severity: 'critical',
        message: `Error checking duplicate analyses: ${error.message}`
      });
    }

    return { name: 'Duplicate Analyses Check', issues };
  }

  /**
   * Clean up orphaned results
   */
  async cleanupOrphanedResults(dryRun = true) {
    const orphanedCheck = await this.checkOrphanedResults();
    const orphanedResults = orphanedCheck.issues.filter(issue => issue.type === 'orphaned_result');
    
    if (orphanedResults.length === 0) {
      return { message: 'No orphaned results found', cleaned: 0 };
    }

    if (dryRun) {
      return { 
        message: `Found ${orphanedResults.length} orphaned results (dry run)`,
        orphanedResults: orphanedResults.map(issue => issue.resultId)
      };
    }

    // Actually delete orphaned results
    const batch = this.db.batch();
    orphanedResults.forEach(issue => {
      const docRef = this.db.collection('analysisResults').doc(issue.resultId);
      batch.delete(docRef);
    });

    await batch.commit();
    
    return { 
      message: `Cleaned up ${orphanedResults.length} orphaned results`,
      cleaned: orphanedResults.length
    };
  }

  /**
   * Fix stuck processing requests
   */
  async fixStuckRequests(dryRun = true) {
    const incompleteCheck = await this.checkIncompleteRequests();
    const stuckRequests = incompleteCheck.issues.filter(issue => issue.type === 'stuck_processing');
    
    if (stuckRequests.length === 0) {
      return { message: 'No stuck requests found', fixed: 0 };
    }

    if (dryRun) {
      return { 
        message: `Found ${stuckRequests.length} stuck requests (dry run)`,
        stuckRequests: stuckRequests.map(issue => issue.requestId)
      };
    }

    // Mark stuck requests as failed
    const batch = this.db.batch();
    stuckRequests.forEach(issue => {
      const docRef = this.db.collection('analysisRequests').doc(issue.requestId);
      batch.update(docRef, {
        status: 'failed',
        metadata: {
          error: 'Request timed out - marked as failed by data integrity service',
          failedAt: new Date(),
          autoFixed: true
        },
        updatedAt: new Date()
      });
    });

    await batch.commit();
    
    return { 
      message: `Fixed ${stuckRequests.length} stuck requests`,
      fixed: stuckRequests.length
    };
  }
}

// Create singleton instance
const dataIntegrityService = new DataIntegrityService();

module.exports = dataIntegrityService;

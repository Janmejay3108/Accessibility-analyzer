const { getFirestore } = require('../config/firebase-admin');

class AnalysisResult {
  constructor(data) {
    this.analysisRequestId = data.analysisRequestId;
    this.url = data.url;
    this.userId = data.userId || null;
    this.axeCoreResults = data.axeCoreResults || null;
    this.mlAnalysisResults = data.mlAnalysisResults || null;
    this.summary = data.summary || {
      totalIssues: 0,
      criticalIssues: 0,
      seriousIssues: 0,
      moderateIssues: 0,
      minorIssues: 0,
      wcagLevel: 'AA',
      complianceScore: 0
    };
    this.recommendations = data.recommendations || [];
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Create a new analysis result
  static async create(data) {
    try {
      const db = getFirestore();
      const analysisResult = new AnalysisResult(data);
      
      const docRef = await db.collection('analysisResults').add({
        ...analysisResult,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return {
        id: docRef.id,
        ...analysisResult
      };
    } catch (error) {
      console.error('Error creating analysis result:', error);
      throw error;
    }
  }

  // Get analysis result by ID
  static async getById(id) {
    try {
      const db = getFirestore();
      const doc = await db.collection('analysisResults').doc(id).get();
      
      if (!doc.exists) {
        return null;
      }

      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Error getting analysis result:', error);
      throw error;
    }
  }

  // Get analysis result by analysis request ID
  static async getByAnalysisRequestId(analysisRequestId) {
    try {
      const db = getFirestore();
      const snapshot = await db.collection('analysisResults')
        .where('analysisRequestId', '==', analysisRequestId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Error getting analysis result by request ID:', error);
      throw error;
    }
  }

  // Update analysis result
  static async update(id, data) {
    try {
      const db = getFirestore();
      const updateData = {
        ...data,
        updatedAt: new Date()
      };

      await db.collection('analysisResults').doc(id).update(updateData);
      
      return await this.getById(id);
    } catch (error) {
      console.error('Error updating analysis result:', error);
      throw error;
    }
  }

  // Get analysis results by user ID
  static async getByUserId(userId, limit = 10, offset = 0) {
    try {
      const db = getFirestore();
      let query = db.collection('analysisResults')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limit);

      if (offset > 0) {
        const offsetSnapshot = await db.collection('analysisResults')
          .where('userId', '==', userId)
          .orderBy('createdAt', 'desc')
          .limit(offset)
          .get();
        
        if (!offsetSnapshot.empty) {
          const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
          query = query.startAfter(lastDoc);
        }
      }

      const snapshot = await query.get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting analysis results by user:', error);
      throw error;
    }
  }

  // Get analysis results by URL for longitudinal tracking
  static async getByUrl(url, limit = 10) {
    try {
      const db = getFirestore();
      const snapshot = await db.collection('analysisResults')
        .where('url', '==', url)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting analysis results by URL:', error);
      throw error;
    }
  }

  // Delete analysis result
  static async delete(id) {
    try {
      const db = getFirestore();
      await db.collection('analysisResults').doc(id).delete();
      return true;
    } catch (error) {
      console.error('Error deleting analysis result:', error);
      throw error;
    }
  }

  // Get analytics data for dashboard
  static async getAnalytics(userId = null, dateRange = null) {
    try {
      const db = getFirestore();
      let query = db.collection('analysisResults');

      if (userId) {
        query = query.where('userId', '==', userId);
      }

      if (dateRange && dateRange.start && dateRange.end) {
        query = query.where('createdAt', '>=', dateRange.start)
                    .where('createdAt', '<=', dateRange.end);
      }

      const snapshot = await query.get();

      const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Calculate enhanced analytics
      const analytics = {
        totalAnalyses: results.length,
        averageComplianceScore: 0,
        issueDistribution: {
          critical: 0,
          serious: 0,
          moderate: 0,
          minor: 0
        },
        topIssueTypes: {},
        trendsOverTime: [],
        wcagComplianceBreakdown: {
          'wcag2a': 0,
          'wcag2aa': 0,
          'wcag21aa': 0,
          'wcag21aaa': 0
        },
        performanceMetrics: {
          averageScanTime: 0,
          totalViolationsFound: 0,
          mostProblematicUrls: []
        },
        recentAnalyses: []
      };

      if (results.length > 0) {
        // Calculate average compliance score
        analytics.averageComplianceScore = results.reduce((sum, result) =>
          sum + (result.summary?.complianceScore || 0), 0) / results.length;

        // Calculate issue distribution and other metrics
        let totalScanTime = 0;
        let scanTimeCount = 0;
        const urlViolationCounts = {};

        results.forEach(result => {
          if (result.summary) {
            analytics.issueDistribution.critical += result.summary.criticalIssues || 0;
            analytics.issueDistribution.serious += result.summary.seriousIssues || 0;
            analytics.issueDistribution.moderate += result.summary.moderateIssues || 0;
            analytics.issueDistribution.minor += result.summary.minorIssues || 0;

            analytics.performanceMetrics.totalViolationsFound += result.summary.totalIssues || 0;
          }

          // Track URL violation counts
          if (result.url && result.summary?.totalIssues) {
            urlViolationCounts[result.url] = (urlViolationCounts[result.url] || 0) + result.summary.totalIssues;
          }

          // Calculate scan time if available
          if (result.metadata?.processingTime) {
            totalScanTime += result.metadata.processingTime;
            scanTimeCount++;
          }

          // Process WCAG compliance data
          if (result.axeCoreResults?.violations) {
            result.axeCoreResults.violations.forEach(violation => {
              violation.tags?.forEach(tag => {
                if (tag.startsWith('wcag') && analytics.wcagComplianceBreakdown[tag] !== undefined) {
                  analytics.wcagComplianceBreakdown[tag]++;
                }
              });
            });
          }
        });

        // Calculate average scan time
        if (scanTimeCount > 0) {
          analytics.performanceMetrics.averageScanTime = totalScanTime / scanTimeCount;
        }

        // Get most problematic URLs
        analytics.performanceMetrics.mostProblematicUrls = Object.entries(urlViolationCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([url, violations]) => ({ url, violations }));

        // Calculate trends over time if we have enough data
        if (results.length >= 2) {
          analytics.trendsOverTime = this.calculateTrendsOverTime(results);
        }

        // Add recent analyses (sorted by creation date, most recent first)
        analytics.recentAnalyses = results
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB - dateA; // Most recent first
          })
          .slice(0, 10) // Limit to 10 most recent
          .map(result => ({
            id: result.id,
            url: result.url,
            createdAt: result.createdAt,
            summary: result.summary,
            analysisRequestId: result.analysisRequestId
          }));
      }

      return analytics;
    } catch (error) {
      console.error('Error getting analytics:', error);
      throw error;
    }
  }

  // Calculate trends over time
  static calculateTrendsOverTime(results) {
    // Sort by creation date
    const sortedResults = results.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateA - dateB;
    });

    // Group by time periods (weekly)
    const weeklyData = {};

    sortedResults.forEach(result => {
      const date = result.createdAt?.toDate ? result.createdAt.toDate() : new Date(result.createdAt);

      // Validate date
      if (isNaN(date.getTime())) {
        console.warn('Invalid date found in result:', result.id);
        return;
      }

      const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          week: weekKey,
          analyses: 0,
          totalViolations: 0,
          averageCompliance: 0,
          complianceScores: []
        };
      }

      weeklyData[weekKey].analyses++;
      weeklyData[weekKey].totalViolations += result.summary?.totalIssues || 0;
      weeklyData[weekKey].complianceScores.push(result.summary?.complianceScore || 0);
    });

    // Calculate averages and return trend data
    return Object.values(weeklyData).map(week => ({
      ...week,
      averageCompliance: week.complianceScores.reduce((sum, score) => sum + score, 0) / week.complianceScores.length,
      complianceScores: undefined // Remove raw scores from output
    }));
  }

  // Validate analysis result data integrity
  static validateResultIntegrity(resultData) {
    const errors = [];

    // Check required fields
    if (!resultData.analysisRequestId) {
      errors.push('Missing analysisRequestId');
    }

    if (!resultData.url) {
      errors.push('Missing URL');
    }

    if (!resultData.axeCoreResults) {
      errors.push('Missing axeCoreResults');
    } else {
      // Validate axe-core results structure
      const required = ['violations', 'passes', 'incomplete', 'inapplicable'];
      required.forEach(field => {
        if (!Array.isArray(resultData.axeCoreResults[field])) {
          errors.push(`axeCoreResults.${field} must be an array`);
        }
      });
    }

    if (!resultData.summary) {
      errors.push('Missing summary');
    } else {
      // Validate summary structure
      const requiredSummaryFields = ['totalIssues', 'complianceScore'];
      requiredSummaryFields.forEach(field => {
        if (typeof resultData.summary[field] !== 'number') {
          errors.push(`summary.${field} must be a number`);
        }
      });

      // Validate compliance score range
      if (resultData.summary.complianceScore < 0 || resultData.summary.complianceScore > 100) {
        errors.push('Compliance score must be between 0 and 100');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Enhanced create method with validation
  static async create(data) {
    try {
      // Validate data integrity
      const validation = this.validateResultIntegrity(data);
      if (!validation.isValid) {
        throw new Error(`Data validation failed: ${validation.errors.join(', ')}`);
      }

      const db = getFirestore();
      const analysisResult = new AnalysisResult(data);

      const docRef = await db.collection('analysisResults').add({
        ...analysisResult,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log(`✅ Analysis result created with ID: ${docRef.id}`);
      return {
        id: docRef.id,
        ...analysisResult
      };
    } catch (error) {
      console.error('Error creating analysis result:', error);
      throw error;
    }
  }
}

module.exports = AnalysisResult;

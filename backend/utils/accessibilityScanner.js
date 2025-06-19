const { chromium } = require('playwright');
const axeCore = require('axe-core');
const fs = require('fs');
const path = require('path');

class AccessibilityScanner {
  constructor(options = {}) {
    this.options = {
      timeout: options.timeout || 30000, // 30 seconds default
      waitForSelector: options.waitForSelector || 'body',
      viewport: options.viewport || { width: 1280, height: 720 },
      userAgent: options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 AccessibilityAnalyzer/1.0',
      ...options
    };
    this.browser = null;
    this.page = null;
  }

  /**
   * Initialize browser and page
   */
  async initialize() {
    try {
      console.log('🚀 Launching browser...');
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });

      this.page = await this.browser.newPage({
        viewport: this.options.viewport,
        userAgent: this.options.userAgent
      });

      // Set timeout for page operations
      this.page.setDefaultTimeout(this.options.timeout);

      console.log('✅ Browser initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize browser:', error);
      throw new Error(`Browser initialization failed: ${error.message}`);
    }
  }

  /**
   * Navigate to URL and wait for page to load
   */
  async navigateToUrl(url) {
    try {
      console.log(`🌐 Navigating to: ${url}`);
      
      // Validate URL format
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Only HTTP and HTTPS URLs are supported');
      }

      // Navigate to the page
      const response = await this.page.goto(url, {
        waitUntil: 'networkidle',
        timeout: this.options.timeout
      });

      if (!response) {
        throw new Error('Failed to load page - no response received');
      }

      if (!response.ok()) {
        throw new Error(`HTTP ${response.status()}: ${response.statusText()}`);
      }

      // Wait for the specified selector to ensure page is ready
      await this.page.waitForSelector(this.options.waitForSelector, {
        timeout: this.options.timeout
      });

      console.log('✅ Page loaded successfully');
      return {
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        title: await this.page.title()
      };
    } catch (error) {
      console.error('❌ Failed to navigate to URL:', error);
      throw new Error(`Navigation failed: ${error.message}`);
    }
  }

  /**
   * Inject axe-core and run accessibility scan
   */
  async runAccessibilityScan(options = {}) {
    try {
      console.log('🔍 Running accessibility scan...');

      // Inject axe-core into the page
      await this.page.addScriptTag({
        content: axeCore.source
      });

      // Configure axe options
      const axeOptions = {
        runOnly: options.runOnly || {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice']
        },
        resultTypes: ['violations', 'passes', 'incomplete', 'inapplicable'],
        ...options.axeOptions
      };

      // Run axe-core scan
      const results = await this.page.evaluate((axeOptions) => {
        return new Promise((resolve, reject) => {
          if (typeof window.axe === 'undefined') {
            reject(new Error('axe-core not loaded'));
            return;
          }

          window.axe.run(document, axeOptions, (err, results) => {
            if (err) {
              reject(err);
            } else {
              resolve(results);
            }
          });
        });
      }, axeOptions);

      console.log('✅ Accessibility scan completed');
      return this.processAxeResults(results);
    } catch (error) {
      console.error('❌ Accessibility scan failed:', error);
      throw new Error(`Accessibility scan failed: ${error.message}`);
    }
  }

  /**
   * Process and structure axe-core results
   */
  processAxeResults(rawResults) {
    const processedResults = {
      timestamp: new Date().toISOString(),
      url: rawResults.url,
      violations: rawResults.violations.map(this.processViolation),
      passes: rawResults.passes.map(this.processRule),
      incomplete: rawResults.incomplete.map(this.processViolation),
      inapplicable: rawResults.inapplicable.map(this.processRule),
      summary: {
        totalViolations: rawResults.violations.length,
        totalPasses: rawResults.passes.length,
        totalIncomplete: rawResults.incomplete.length,
        totalInapplicable: rawResults.inapplicable.length,
        violationsBySeverity: this.categorizeViolationsBySeverity(rawResults.violations),
        complianceScore: this.calculateComplianceScore(rawResults)
      },
      metadata: {
        axeVersion: rawResults.testEngine.version,
        testEnvironment: rawResults.testEnvironment,
        testRunner: rawResults.testRunner,
        scanDuration: rawResults.timestamp ? new Date(rawResults.timestamp).getTime() - new Date().getTime() : null
      }
    };

    return processedResults;
  }

  /**
   * Process individual violation
   */
  processViolation(violation) {
    return {
      id: violation.id,
      impact: violation.impact,
      tags: violation.tags,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      nodes: violation.nodes.map(node => ({
        html: node.html,
        target: node.target,
        failureSummary: node.failureSummary,
        impact: node.impact
      }))
    };
  }

  /**
   * Process individual rule (passes/inapplicable)
   */
  processRule(rule) {
    return {
      id: rule.id,
      impact: rule.impact,
      tags: rule.tags,
      description: rule.description,
      help: rule.help,
      helpUrl: rule.helpUrl,
      nodeCount: rule.nodes ? rule.nodes.length : 0
    };
  }

  /**
   * Categorize violations by severity
   */
  categorizeViolationsBySeverity(violations) {
    const categories = {
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0
    };

    violations.forEach(violation => {
      switch (violation.impact) {
        case 'critical':
          categories.critical++;
          break;
        case 'serious':
          categories.serious++;
          break;
        case 'moderate':
          categories.moderate++;
          break;
        case 'minor':
          categories.minor++;
          break;
      }
    });

    return categories;
  }

  /**
   * Calculate compliance score based on violations
   */
  calculateComplianceScore(results) {
    const totalRules = results.violations.length + results.passes.length;
    if (totalRules === 0) return 100;

    const passedRules = results.passes.length;
    return Math.round((passedRules / totalRules) * 100);
  }

  /**
   * Capture screenshot for documentation
   */
  async captureScreenshot(options = {}) {
    try {
      const screenshot = await this.page.screenshot({
        fullPage: options.fullPage || false,
        type: options.type || 'png',
        quality: options.quality || 80
      });

      return screenshot;
    } catch (error) {
      console.error('❌ Failed to capture screenshot:', error);
      return null;
    }
  }

  /**
   * Get page metadata
   */
  async getPageMetadata() {
    try {
      const metadata = await this.page.evaluate(() => {
        return {
          title: document.title,
          description: document.querySelector('meta[name="description"]')?.content || '',
          keywords: document.querySelector('meta[name="keywords"]')?.content || '',
          lang: document.documentElement.lang || '',
          charset: document.characterSet || '',
          viewport: document.querySelector('meta[name="viewport"]')?.content || '',
          canonical: document.querySelector('link[rel="canonical"]')?.href || '',
          robots: document.querySelector('meta[name="robots"]')?.content || ''
        };
      });

      return metadata;
    } catch (error) {
      console.error('❌ Failed to get page metadata:', error);
      return {};
    }
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      console.log('✅ Browser cleanup completed');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }

  /**
   * Main scan method - orchestrates the entire scanning process
   */
  async scan(url, options = {}) {
    try {
      // Initialize browser
      await this.initialize();

      // Navigate to URL
      const navigationResult = await this.navigateToUrl(url);

      // Get page metadata
      const metadata = await this.getPageMetadata();

      // Run accessibility scan
      const scanResults = await this.runAccessibilityScan(options);

      // Capture screenshot if requested
      let screenshot = null;
      if (options.captureScreenshot) {
        screenshot = await this.captureScreenshot(options.screenshotOptions);
      }

      // Combine all results
      const finalResults = {
        ...scanResults,
        navigation: navigationResult,
        metadata: {
          ...scanResults.metadata,
          page: metadata
        },
        screenshot: screenshot ? screenshot.toString('base64') : null
      };

      return finalResults;
    } catch (error) {
      throw error;
    } finally {
      // Always cleanup
      await this.cleanup();
    }
  }
}

module.exports = AccessibilityScanner;

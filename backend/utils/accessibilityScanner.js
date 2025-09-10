const { chromium } = require('playwright');
const axeCore = require('axe-core');
const fs = require('fs');
const path = require('path');

class AccessibilityScanner {
  constructor(options = {}) {
    this.options = {
      timeout: options.timeout || 45000, // 45 seconds default (more reasonable)
      waitForSelector: options.waitForSelector || 'body',
      viewport: options.viewport || { width: 1280, height: 720 },
      userAgent: options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--single-process',
          '--disable-extensions'
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

      // Navigate to the page with multiple fallback strategies
      let response;
      try {
        // First attempt: Wait for network idle
        response = await this.page.goto(url, {
          waitUntil: 'networkidle',
          timeout: this.options.timeout
        });
      } catch (error) {
        console.log('⚠️ Network idle failed, trying domcontentloaded...');
        try {
          // Second attempt: Wait for DOM content loaded
          response = await this.page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: this.options.timeout
          });
        } catch (error2) {
          console.log('⚠️ DOM content loaded failed, trying load...');
          // Third attempt: Wait for basic load
          response = await this.page.goto(url, {
            waitUntil: 'load',
            timeout: this.options.timeout
          });
        }
      }

      if (!response) {
        throw new Error('Failed to load page - no response received');
      }

      if (!response.ok()) {
        throw new Error(`HTTP ${response.status()}: ${response.statusText()}`);
      }

      // Enhanced waiting strategy for complex sites like YouTube
      await this.waitForPageReady(url);

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
   * Enhanced page ready detection for complex sites
   */
  async waitForPageReady(url) {
    const domain = new URL(url).hostname.toLowerCase();

    try {
      // Site-specific waiting strategies
      if (domain.includes('youtube.com')) {
        console.log('🎥 Detected YouTube - using enhanced loading strategy...');
        await this.waitForYouTube();
      } else if (domain.includes('linkedin.com')) {
        console.log('💼 Detected LinkedIn - using enhanced loading strategy...');
        await this.waitForLinkedIn();
      } else {
        // Default waiting strategy
        await this.waitForDefaultSite();
      }
    } catch (error) {
      console.log('⚠️ Enhanced waiting failed, falling back to basic strategy...');
      await this.waitForDefaultSite();
    }
  }

  /**
   * YouTube-specific waiting strategy
   */
  async waitForYouTube() {
    // YouTube has complex loading - wait for multiple indicators
    const selectors = [
      'ytd-app',           // Main YouTube app container
      '#content',          // Content area
      'ytd-masthead',      // Header
      '[role="main"]'      // Main content area
    ];

    // Try each selector with shorter timeouts
    for (const selector of selectors) {
      try {
        await this.page.waitForSelector(selector, {
          timeout: 10000,
          state: 'attached' // Just needs to be in DOM, not necessarily visible
        });
        console.log(`✅ YouTube element found: ${selector}`);

        // Additional wait for content to stabilize
        await this.page.waitForTimeout(2000);
        return;
      } catch (error) {
        console.log(`⚠️ YouTube selector ${selector} not found, trying next...`);
      }
    }

    // If all specific selectors fail, wait for any content
    await this.page.waitForFunction(() => {
      return document.readyState === 'complete' &&
             document.body &&
             document.body.children.length > 0;
    }, { timeout: 15000 });
  }

  /**
   * LinkedIn-specific waiting strategy
   */
  async waitForLinkedIn() {
    const selectors = [
      '.application-outlet',
      '.global-nav',
      '[data-test-id="nav-top"]',
      'body'
    ];

    for (const selector of selectors) {
      try {
        await this.page.waitForSelector(selector, {
          timeout: 10000,
          state: 'attached'
        });
        console.log(`✅ LinkedIn element found: ${selector}`);
        return;
      } catch (error) {
        console.log(`⚠️ LinkedIn selector ${selector} not found, trying next...`);
      }
    }
  }

  /**
   * Default waiting strategy for most sites
   */
  async waitForDefaultSite() {
    try {
      // Wait for the specified selector to ensure page is ready
      await this.page.waitForSelector(this.options.waitForSelector, {
        timeout: this.options.timeout
      });
    } catch (error) {
      // Fallback: wait for basic page readiness
      await this.page.waitForFunction(() => {
        return document.readyState === 'complete' && document.body;
      }, { timeout: 15000 });
    }
  }

  /**
   * Inject axe-core and run accessibility scan
   */
  async runAccessibilityScan(options = {}) {
    try {
      console.log('🔍 Running accessibility scan...');

      // Try to inject axe-core, with fallback for CSP-protected sites
      let axeInjected = false;

      try {
        // First attempt: Standard injection
        await this.page.addScriptTag({
          content: axeCore.source
        });
        axeInjected = true;
        console.log('✅ Standard axe-core injection successful');
      } catch (cspError) {
        console.log('⚠️ CSP detected, trying alternative injection method...');

        try {
          // Second attempt: Evaluate directly (bypasses some CSP restrictions)
          await this.page.evaluate((axeSource) => {
            // Create a script element and inject axe-core
            const script = document.createElement('script');
            script.textContent = axeSource;
            document.head.appendChild(script);
          }, axeCore.source);
          axeInjected = true;
          console.log('✅ Direct evaluation injection successful');
        } catch (fallbackError) {
          console.log('⚠️ Direct injection failed, trying iframe method...');

          try {
            // Third attempt: Use iframe context (for very strict CSP)
            await this.page.evaluate((axeSource) => {
              // Try to inject via iframe context
              const iframe = document.createElement('iframe');
              iframe.style.display = 'none';
              document.body.appendChild(iframe);

              const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
              const script = iframeDoc.createElement('script');
              script.textContent = axeSource;
              iframeDoc.head.appendChild(script);

              // Copy axe to main window
              if (iframe.contentWindow.axe) {
                window.axe = iframe.contentWindow.axe;
              }
            }, axeCore.source);
            axeInjected = true;
            console.log('✅ Iframe injection successful');
          } catch (iframeError) {
            console.log('⚠️ Iframe injection failed, using context isolation...');

            // Fourth attempt: Use addInitScript for context isolation
            await this.page.addInitScript({
              content: axeCore.source
            });

            // Reload the page to apply the init script
            await this.page.reload({ waitUntil: 'networkidle' });
            await this.waitForPageReady(this.page.url());
            axeInjected = true;
            console.log('✅ Init script injection successful');
          }
        }
      }

      if (!axeInjected) {
        throw new Error('Failed to inject axe-core due to Content Security Policy restrictions');
      }

      // Configure axe options
      const axeOptions = {
        runOnly: options.runOnly || {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice']
        },
        resultTypes: ['violations', 'passes', 'incomplete', 'inapplicable'],
        ...options.axeOptions
      };

      // Run axe-core scan with timeout
      const results = await this.page.evaluate((axeOptions) => {
        return new Promise((resolve, reject) => {
          // Set a timeout for the scan
          const timeout = setTimeout(() => {
            reject(new Error('Accessibility scan timeout'));
          }, 30000);

          if (typeof window.axe === 'undefined') {
            clearTimeout(timeout);
            reject(new Error('axe-core not loaded'));
            return;
          }

          window.axe.run(document, axeOptions, (err, results) => {
            clearTimeout(timeout);
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

      // If all injection methods fail, provide a fallback analysis
      if (error.message.includes('Content Security Policy') ||
          error.message.includes('CSP') ||
          error.message.includes('axe-core not loaded')) {
        console.log('🔄 Falling back to basic accessibility analysis...');
        return await this.performBasicAccessibilityAnalysis();
      }

      throw new Error(`Accessibility scan failed: ${error.message}`);
    }
  }

  /**
   * Perform basic accessibility analysis when axe-core injection fails
   */
  async performBasicAccessibilityAnalysis() {
    try {
      console.log('🔍 Performing basic accessibility analysis...');

      const basicResults = await this.page.evaluate(() => {
        const violations = [];
        const passes = [];
        const incomplete = [];

        // Basic accessibility checks that don't require axe-core

        // Check for missing alt text on images
        const images = document.querySelectorAll('img');
        let missingAltCount = 0;
        images.forEach((img, index) => {
          if (!img.alt && !img.getAttribute('aria-label') && !img.getAttribute('aria-labelledby')) {
            missingAltCount++;
          }
        });

        if (missingAltCount > 0) {
          violations.push({
            id: 'image-alt',
            impact: 'serious',
            tags: ['wcag2a', 'wcag111'],
            description: 'Images must have alternate text',
            help: 'All images must have alternative text to be accessible to screen readers',
            helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/image-alt',
            nodes: [{
              html: `Found ${missingAltCount} images without alt text`,
              target: ['img'],
              failureSummary: `${missingAltCount} images are missing alternative text`,
              impact: 'serious'
            }]
          });
        } else if (images.length > 0) {
          passes.push({
            id: 'image-alt',
            impact: null,
            tags: ['wcag2a', 'wcag111'],
            description: 'Images have alternate text',
            help: 'All images have appropriate alternative text',
            helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/image-alt',
            nodeCount: images.length
          });
        }

        // Check for page title
        const title = document.title;
        if (!title || title.trim().length === 0) {
          violations.push({
            id: 'document-title',
            impact: 'serious',
            tags: ['wcag2a', 'wcag242'],
            description: 'Documents must have a title',
            help: 'Page must have a title to help users understand the content',
            helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/document-title',
            nodes: [{
              html: '<title></title>',
              target: ['title'],
              failureSummary: 'Document does not have a title',
              impact: 'serious'
            }]
          });
        } else {
          passes.push({
            id: 'document-title',
            impact: null,
            tags: ['wcag2a', 'wcag242'],
            description: 'Document has a title',
            help: 'Page has an appropriate title',
            helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/document-title',
            nodeCount: 1
          });
        }

        // Check for heading structure
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const h1Count = document.querySelectorAll('h1').length;

        if (h1Count === 0) {
          violations.push({
            id: 'page-has-heading-one',
            impact: 'moderate',
            tags: ['wcag2a', 'best-practice'],
            description: 'Page should contain a level-one heading',
            help: 'Pages should have a main heading (h1) for proper document structure',
            helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/page-has-heading-one',
            nodes: [{
              html: 'No h1 heading found',
              target: ['html'],
              failureSummary: 'Page does not contain a level-one heading',
              impact: 'moderate'
            }]
          });
        } else if (h1Count === 1) {
          passes.push({
            id: 'page-has-heading-one',
            impact: null,
            tags: ['wcag2a', 'best-practice'],
            description: 'Page contains a level-one heading',
            help: 'Page has appropriate heading structure',
            helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/page-has-heading-one',
            nodeCount: 1
          });
        }

        // Check for form labels
        const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], textarea, select');
        let unlabeledInputs = 0;
        inputs.forEach(input => {
          const hasLabel = input.labels && input.labels.length > 0;
          const hasAriaLabel = input.getAttribute('aria-label');
          const hasAriaLabelledby = input.getAttribute('aria-labelledby');

          if (!hasLabel && !hasAriaLabel && !hasAriaLabelledby) {
            unlabeledInputs++;
          }
        });

        if (unlabeledInputs > 0) {
          violations.push({
            id: 'label',
            impact: 'critical',
            tags: ['wcag2a', 'wcag412'],
            description: 'Form elements must have labels',
            help: 'All form elements must have labels for accessibility',
            helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/label',
            nodes: [{
              html: `Found ${unlabeledInputs} unlabeled form elements`,
              target: ['input', 'textarea', 'select'],
              failureSummary: `${unlabeledInputs} form elements are missing labels`,
              impact: 'critical'
            }]
          });
        } else if (inputs.length > 0) {
          passes.push({
            id: 'label',
            impact: null,
            tags: ['wcag2a', 'wcag412'],
            description: 'Form elements have labels',
            help: 'All form elements have appropriate labels',
            helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/label',
            nodeCount: inputs.length
          });
        }

        return {
          url: window.location.href,
          timestamp: new Date().toISOString(),
          violations,
          passes,
          incomplete,
          inapplicable: [],
          testEngine: {
            name: 'basic-accessibility-analyzer',
            version: '1.0.0'
          },
          testEnvironment: {
            userAgent: navigator.userAgent,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight
          },
          testRunner: {
            name: 'accessibility-analyzer-fallback'
          }
        };
      });

      console.log('✅ Basic accessibility analysis completed');
      return this.processAxeResults(basicResults);
    } catch (error) {
      console.error('❌ Basic accessibility analysis failed:', error);
      throw new Error(`Basic accessibility analysis failed: ${error.message}`);
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

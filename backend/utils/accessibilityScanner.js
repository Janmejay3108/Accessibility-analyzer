const { chromium } = require('playwright');
const axeCore = require('axe-core');

class AccessibilityScanner {
  constructor(options = {}) {
    this.options = {
      timeout: options.timeout || 120000, // 2 minutes for complex sites
      waitForSelector: options.waitForSelector || 'body',
      viewport: options.viewport || { width: 1280, height: 720 },
      userAgent: options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      stealthMode: options.stealthMode !== false, // Enable stealth mode by default
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
      console.log('Chromium executable path:', process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || 'default');
      console.log('Environment variable value:', JSON.stringify(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH));

      const launchOptions = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-extensions',
          '--disable-software-rasterizer',
          '--disable-background-networking',
          '--disable-site-isolation-trials',
          '--disable-features=CrossOriginOpenerPolicy',
          '--disable-features=CrossOriginEmbedderPolicy',
          '--disable-blink-features=AutomationControlled',
          '--allow-running-insecure-content',
          '--ignore-certificate-errors',
          '--ignore-ssl-errors',
          '--ignore-certificate-errors-spki-list',
          '--disable-ipc-flooding-protection',
          // Additional args for enterprise websites
          '--disable-features=IsolateOrigins',
          '--disable-features=site-per-process',
          '--disable-web-security',
          '--disable-features=BlockInsecurePrivateNetworkRequests',
          // Enhanced stealth mode arguments
          '--disable-blink-features=AutomationControlled',
          '--exclude-switches=enable-automation',
          '--disable-default-apps',
          '--disable-component-extensions-with-background-pages',
          '--disable-component-update',
          '--disable-domain-reliability',
          '--disable-sync',
          '--disable-plugins-discovery',
          '--disable-preconnect',
          '--no-default-browser-check',
          '--no-pings',
          '--disable-prompt-on-repost',
          '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
        ]
      };

      // Try system Chromium first, then fallback to Playwright's bundled browser
      try {
        if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
          launchOptions.executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
          console.log('Trying system Chromium...');
        }
        this.browser = await chromium.launch(launchOptions);
      } catch (systemError) {
        console.warn('System Chromium failed, trying Playwright bundled browser:', systemError.message);
        delete launchOptions.executablePath;
        this.browser = await chromium.launch(launchOptions);
      }

      this.page = await this.browser.newPage({
        viewport: this.options.viewport,
        userAgent: this.options.userAgent
      });

      // Set timeout for page operations
      this.page.setDefaultTimeout(this.options.timeout);

      // Enhanced stealth mode setup
      if (this.options.stealthMode) {
        await this.setupStealthMode();
      }

      // Add error handlers to prevent premature closure
      this.page.on('error', (error) => {
        console.warn('Page error (non-fatal):', error.message);
      });

      this.page.on('pageerror', (error) => {
        console.warn('Page script error (non-fatal):', error.message);
      });

      console.log('✅ Browser initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize browser:', error);
      throw new Error(`Browser initialization failed: ${error.message}`);
    }
  }

  /**
   * Setup stealth mode to avoid bot detection
   */
  async setupStealthMode() {
    try {
      console.log('🥷 Setting up stealth mode...');
      
      // Override webdriver property
      await this.page.addInitScript(() => {
        // Remove webdriver property
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });
        
        // Override plugins property
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });
        
        // Override languages property
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
        });
        
        // Override chrome property
        window.chrome = {
          runtime: {},
        };
        
        // Override permissions
        const permissions = window.navigator.permissions;
        const originalQuery = permissions && permissions.query ? permissions.query.bind(permissions) : null;
        if (originalQuery) {
          permissions.query = (parameters) => {
            if (parameters && parameters.name === 'notifications') {
              const state = typeof Notification !== 'undefined' && Notification.permission
                ? Notification.permission
                : 'denied';
              return Promise.resolve({ state });
            }
            return originalQuery(parameters);
          };
        }
      });
      
      // Set additional headers
      await this.page.setExtraHTTPHeaders({
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'max-age=0',
        'Sec-Ch-Ua': '"Chromium";v="131", "Not_A Brand";v="24"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      });
      
      console.log('✅ Stealth mode configured');
    } catch (error) {
      console.warn('⚠️ Stealth mode setup failed:', error.message);
    }
  }

  /**
   * Navigate to URL and wait for page to load
   */
  async navigateToUrl(url) {
    try {
      console.log(`🌐 Navigating to: ${url}`);

      // Check if browser and page are still valid
      if (!this.browser || !this.page || this.page.isClosed()) {
        throw new Error('Browser or page has been closed unexpectedly');
      }

      // Validate URL format
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Only HTTP and HTTPS URLs are supported');
      }

      // Add random delay to appear more human-like
      await this.page.waitForTimeout(Math.random() * 2000 + 1000);
      
      // Navigate to the page with multiple fallback strategies
      let response;
      let navigationSuccess = false;

      // Strategy 1: Try networkidle (best for most sites)
      try {
        console.log('📡 Attempting navigation with networkidle...');
        response = await this.page.goto(url, {
          waitUntil: 'networkidle',
          timeout: this.options.timeout
        });
        navigationSuccess = true;
        console.log('✅ Navigation successful with networkidle');
      } catch (error) {
        console.log('⚠️ Network idle failed:', error.message.substring(0, 100));
      }

      // Strategy 2: Try domcontentloaded (faster, good for complex sites)
      if (!navigationSuccess) {
        try {
          console.log('📡 Attempting navigation with domcontentloaded...');
          response = await this.page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: this.options.timeout
          });
          navigationSuccess = true;
          console.log('✅ Navigation successful with domcontentloaded');
          // Give extra time for JS to execute
          await this.page.waitForTimeout(3000);
        } catch (error2) {
          console.log('⚠️ DOM content loaded failed:', error2.message.substring(0, 100));
        }
      }

      // Strategy 3: Try basic load (most permissive)
      if (!navigationSuccess) {
        try {
          console.log('📡 Attempting navigation with load...');
          response = await this.page.goto(url, {
            waitUntil: 'load',
            timeout: this.options.timeout
          });
          navigationSuccess = true;
          console.log('✅ Navigation successful with load');
          // Give extra time for JS to execute
          await this.page.waitForTimeout(5000);
        } catch (error3) {
          console.log('⚠️ Load failed:', error3.message.substring(0, 100));
        }
      }

      // Strategy 4: Last resort - just navigate without waiting
      if (!navigationSuccess) {
        try {
          console.log('📡 Last resort: navigating without wait condition...');
          response = await this.page.goto(url, {
            waitUntil: 'commit',
            timeout: this.options.timeout
          });
          // Wait for page to have some content
          await this.page.waitForFunction(() => {
            return document.body && document.body.innerHTML.length > 100;
          }, { timeout: 30000 });
          navigationSuccess = true;
          console.log('✅ Navigation successful with commit');
        } catch (error4) {
          console.log('❌ All navigation strategies failed');
        }
      }

      if (!navigationSuccess || !response) {
        throw new Error('Failed to load page after trying all navigation strategies. The website may be blocking automated access or experiencing issues.');
      }

      // Check response status
      const status = response.status();
      if (status >= 400) {
        if (status === 403) {
          console.log('🚫 Access forbidden detected. Attempting alternative approach...');
          
          // Try with different user agent and headers for enterprise sites
          await this.page.setExtraHTTPHeaders({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache'
          });
          
          // Add random delay
          await this.page.waitForTimeout(Math.random() * 3000 + 2000);
          
          // Try again with modified headers
          try {
            response = await this.page.goto(url, {
              waitUntil: 'domcontentloaded',
              timeout: this.options.timeout
            });
            
            if (response.status() >= 400) {
              throw new Error(`Access Forbidden (${response.status()}): The website is blocking automated access. This is common with enterprise sites that have bot protection.`);
            }
            
            console.log('✅ Alternative approach successful!');
          } catch (retryError) {
            throw new Error(`Access Forbidden (403): The website is blocking automated access. This is common with enterprise sites that have bot protection.`);
          }
        } else if (status === 404) {
          throw new Error(`Page Not Found (404): The URL does not exist or has been moved.`);
        } else if (status === 503) {
          throw new Error(`Service Unavailable (503): The website is temporarily down or overloaded.`);
        } else {
          throw new Error(`HTTP ${status}: ${response.statusText()}`);
        }
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

      // Handle specific COOP/COEP errors
      if (error.message.includes('Cross-Origin-Opener-Policy') ||
          error.message.includes('Cross-Origin-Embedder-Policy') ||
          error.message.includes('window.closed')) {
        throw new Error('Website is blocking automated access due to security policies (COOP/COEP). This is common with sites that have strict security headers.');
      }

      // Handle timeout errors
      if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        throw new Error('Website took too long to respond. This could be due to slow loading times or the site blocking automated access.');
      }

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
      } else if (domain.includes('keysight.com')) {
        console.log('📡 Detected Keysight - using enterprise loading strategy...');
        await this.waitForKeysight();
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
   * Keysight-specific waiting strategy
   */
  async waitForKeysight() {
    const selectors = [
      'main',
      '.main-content',
      '[role="main"]',
      'header',
      'nav',
      'body'
    ];

    for (const selector of selectors) {
      try {
        await this.page.waitForSelector(selector, {
          timeout: 10000,
          state: 'attached'
        });
        console.log(`✅ Keysight element found: ${selector}`);
        
        // Additional wait for dynamic content
        await this.page.waitForTimeout(3000);
        
        // Wait for potential lazy loading
        await this.page.waitForFunction(() => {
          return document.readyState === 'complete' &&
                 (!window.jQuery || window.jQuery.active === 0);
        }, { timeout: 10000 }).catch(() => {
          console.log('⚠️ jQuery check timeout, continuing...');
        });
        
        return;
      } catch (error) {
        console.log(`⚠️ Keysight selector ${selector} not found, trying next...`);
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
      // Cleanup on error
      await this.cleanup();
      throw error;
    }
  }
}

module.exports = AccessibilityScanner;

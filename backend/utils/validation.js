/**
 * URL validation utility
 */
function validateUrl(url) {
  const errors = [];

  // Check if URL is provided
  if (!url || typeof url !== 'string') {
    errors.push('URL is required and must be a string');
    return { isValid: false, errors };
  }

  // Trim whitespace
  url = url.trim();

  // Check if URL is empty after trimming
  if (!url) {
    errors.push('URL cannot be empty');
    return { isValid: false, errors };
  }

  // Check URL format
  try {
    const urlObj = new URL(url);
    
    // Check protocol
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      errors.push('Only HTTP and HTTPS URLs are supported');
    }

    // Check for localhost/private IPs in production
    if (process.env.NODE_ENV === 'production') {
      const hostname = urlObj.hostname.toLowerCase();
      
      // Block localhost
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
        errors.push('Localhost URLs are not allowed in production');
      }
      
      // Block private IP ranges
      if (isPrivateIP(hostname)) {
        errors.push('Private IP addresses are not allowed');
      }
    }

    // Check URL length
    if (url.length > 2048) {
      errors.push('URL is too long (maximum 2048 characters)');
    }

  } catch (error) {
    errors.push('Invalid URL format');
  }

  return {
    isValid: errors.length === 0,
    errors,
    normalizedUrl: url
  };
}

/**
 * Check if hostname is a private IP address
 */
function isPrivateIP(hostname) {
  // IPv4 private ranges
  const privateIPv4Ranges = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^169\.254\./ // Link-local
  ];

  // IPv6 private ranges
  const privateIPv6Ranges = [
    /^fc00::/i, // Unique local
    /^fd00::/i, // Unique local
    /^fe80::/i  // Link-local
  ];

  return privateIPv4Ranges.some(range => range.test(hostname)) ||
         privateIPv6Ranges.some(range => range.test(hostname));
}

/**
 * Validate analysis settings
 */
function validateAnalysisSettings(settings) {
  const errors = [];
  const validatedSettings = {};

  if (!settings || typeof settings !== 'object') {
    return { isValid: true, errors: [], settings: {} };
  }

  // Validate WCAG level
  if (settings.wcagLevel) {
    const validLevels = ['A', 'AA', 'AAA'];
    if (!validLevels.includes(settings.wcagLevel)) {
      errors.push('WCAG level must be one of: A, AA, AAA');
    } else {
      validatedSettings.wcagLevel = settings.wcagLevel;
    }
  }

  // Validate timeout
  if (settings.timeout !== undefined) {
    const timeout = parseInt(settings.timeout);
    if (isNaN(timeout) || timeout < 5000 || timeout > 120000) {
      errors.push('Timeout must be between 5000 and 120000 milliseconds');
    } else {
      validatedSettings.timeout = timeout;
    }
  }

  // Validate viewport
  if (settings.viewport) {
    if (typeof settings.viewport !== 'object') {
      errors.push('Viewport must be an object');
    } else {
      const { width, height } = settings.viewport;
      if (width && (isNaN(width) || width < 320 || width > 3840)) {
        errors.push('Viewport width must be between 320 and 3840 pixels');
      }
      if (height && (isNaN(height) || height < 240 || height > 2160)) {
        errors.push('Viewport height must be between 240 and 2160 pixels');
      }
      if (errors.length === 0) {
        validatedSettings.viewport = {
          width: width || 1280,
          height: height || 720
        };
      }
    }
  }

  // Validate capture screenshot
  if (settings.captureScreenshot !== undefined) {
    if (typeof settings.captureScreenshot !== 'boolean') {
      errors.push('captureScreenshot must be a boolean');
    } else {
      validatedSettings.captureScreenshot = settings.captureScreenshot;
    }
  }

  if (settings.includeScreenshots !== undefined && settings.captureScreenshot === undefined) {
    if (typeof settings.includeScreenshots !== 'boolean') {
      errors.push('includeScreenshots must be a boolean');
    } else {
      validatedSettings.captureScreenshot = settings.includeScreenshots;
    }
  }

  // Validate axe options
  if (settings.axeOptions) {
    if (typeof settings.axeOptions !== 'object') {
      errors.push('axeOptions must be an object');
    } else {
      // Basic validation for axe options
      validatedSettings.axeOptions = settings.axeOptions;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    settings: validatedSettings
  };
}

/**
 * Sanitize user input to prevent XSS and injection attacks
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return input;
  }

  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate pagination parameters
 */
function validatePagination(query) {
  const errors = [];
  const pagination = {};

  // Validate limit
  const limit = parseInt(query.limit) || 10;
  if (limit < 1 || limit > 100) {
    errors.push('Limit must be between 1 and 100');
  } else {
    pagination.limit = limit;
  }

  // Validate offset
  const offset = parseInt(query.offset) || 0;
  if (offset < 0) {
    errors.push('Offset must be non-negative');
  } else {
    pagination.offset = offset;
  }

  return {
    isValid: errors.length === 0,
    errors,
    pagination
  };
}

/**
 * Validate date range
 */
function validateDateRange(dateRange) {
  const errors = [];

  if (!dateRange) {
    return { isValid: true, errors: [], dateRange: null };
  }

  try {
    const parsed = typeof dateRange === 'string' ? JSON.parse(dateRange) : dateRange;
    
    if (parsed.start) {
      const startDate = new Date(parsed.start);
      if (isNaN(startDate.getTime())) {
        errors.push('Invalid start date format');
      } else {
        parsed.start = startDate;
      }
    }

    if (parsed.end) {
      const endDate = new Date(parsed.end);
      if (isNaN(endDate.getTime())) {
        errors.push('Invalid end date format');
      } else {
        parsed.end = endDate;
      }
    }

    // Check if start is before end
    if (parsed.start && parsed.end && parsed.start > parsed.end) {
      errors.push('Start date must be before end date');
    }

    // Check if date range is not too far in the past or future
    const now = new Date();
    const maxPastDate = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000)); // 1 year ago
    const maxFutureDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from now

    if (parsed.start && parsed.start < maxPastDate) {
      errors.push('Start date cannot be more than 1 year in the past');
    }

    if (parsed.end && parsed.end > maxFutureDate) {
      errors.push('End date cannot be more than 30 days in the future');
    }

    return {
      isValid: errors.length === 0,
      errors,
      dateRange: errors.length === 0 ? parsed : null
    };

  } catch (error) {
    return {
      isValid: false,
      errors: ['Invalid date range format'],
      dateRange: null
    };
  }
}

module.exports = {
  validateUrl,
  validateAnalysisSettings,
  sanitizeInput,
  validatePagination,
  validateDateRange,
  isPrivateIP
};

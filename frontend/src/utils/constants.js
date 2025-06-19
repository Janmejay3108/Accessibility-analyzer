/**
 * Application Constants
 */

// API Endpoints
export const API_ENDPOINTS = {
  ANALYSIS: '/api/analysis',
  ANALYTICS: '/api/analysis/dashboard/analytics',
  HISTORY: '/api/analysis/history/comparison',
  VIOLATIONS: '/api/analysis/:id/violations',
  STATUS: '/api/analysis/status/:id',
  USER_ANALYSES: '/api/analysis/user/requests',
  RECENT: '/api/analysis/recent',
};

// Application Routes
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  ANALYSIS: '/analysis',
  RESULTS: '/results/:id',
  HISTORY: '/history',
  PROFILE: '/profile',
  LOGIN: '/login',
  REGISTER: '/register',
  SETTINGS: '/settings',
};

// Analysis Status
export const ANALYSIS_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

// WCAG Levels
export const WCAG_LEVELS = {
  A: 'A',
  AA: 'AA',
  AAA: 'AAA',
};

// Violation Impact Levels
export const IMPACT_LEVELS = {
  CRITICAL: 'critical',
  SERIOUS: 'serious',
  MODERATE: 'moderate',
  MINOR: 'minor',
};

// Impact Level Colors (Tailwind classes)
export const IMPACT_COLORS = {
  [IMPACT_LEVELS.CRITICAL]: 'text-red-600 bg-red-50 border-red-200',
  [IMPACT_LEVELS.SERIOUS]: 'text-orange-600 bg-orange-50 border-orange-200',
  [IMPACT_LEVELS.MODERATE]: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  [IMPACT_LEVELS.MINOR]: 'text-blue-600 bg-blue-50 border-blue-200',
};

// Default Analysis Settings
export const DEFAULT_ANALYSIS_SETTINGS = {
  wcagLevel: WCAG_LEVELS.AA,
  captureScreenshot: false,
  timeout: 30000,
  viewport: {
    width: 1280,
    height: 720,
  },
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_PREFERENCES: 'userPreferences',
  THEME: 'theme',
  RECENT_URLS: 'recentUrls',
};

// Application Metadata
export const APP_INFO = {
  NAME: process.env.REACT_APP_NAME || 'Accessibility Analyzer',
  VERSION: process.env.REACT_APP_VERSION || '1.0.0',
  ENVIRONMENT: process.env.REACT_APP_ENVIRONMENT || 'development',
};

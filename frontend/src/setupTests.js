// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock axios (axios is ESM and CRA/Jest doesn't transform node_modules by default)
jest.mock('axios', () => {
  const mockAxios = {
    create: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  };

  mockAxios.create.mockImplementation(() => mockAxios);

  return mockAxios;
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn(),
});

// Mock environment variables
process.env.REACT_APP_API_BASE_URL = 'http://localhost:5000';
process.env.REACT_APP_API_TIMEOUT = '30000';

// Mock Firebase modules
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(() => ({
    setCustomParameters: jest.fn(),
  })),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  updateProfile: jest.fn(),
}));

// Global test utilities
global.testUtils = {
  createMockUser: (overrides = {}) => ({
    uid: 'test-uid',
    email: 'test@example.com',
    displayName: 'Test User',
    getIdToken: jest.fn().mockResolvedValue('mock-token'),
    ...overrides
  }),

  createMockAnalysis: (overrides = {}) => ({
    id: 'test-analysis-id',
    url: 'https://example.com',
    status: 'completed',
    createdAt: '2024-01-01T00:00:00Z',
    settings: { wcagLevel: 'AA', includeScreenshots: true },
    ...overrides
  }),

  createMockResult: (overrides = {}) => ({
    id: 'test-result-id',
    analysisId: 'test-analysis-id',
    complianceScore: 85,
    violations: [],
    passes: [],
    incomplete: [],
    recommendations: [],
    createdAt: '2024-01-01T00:00:00Z',
    scanDuration: 15000,
    ...overrides
  })
};

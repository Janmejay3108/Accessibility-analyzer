import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import App from '../App';
import { analysisService } from '../services/api/analysisService';
import { authService } from '../services/firebase/authService';

jest.setTimeout(15000);

// Mock services
jest.mock('../services/api/analysisService');
jest.mock('../services/firebase/authService');

// App already includes a BrowserRouter; use history to set the initial route
const renderWithRoute = (route = '/') => {
  window.history.pushState({}, 'Test', route);
  return render(<App />);
};

describe('App Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock auth service to return no user initially
    authService.onAuthStateChanged.mockImplementation((callback) => {
      callback(null);
      return jest.fn(); // unsubscribe function
    });

    // Default no-op to prevent Analysis page from crashing in tests
    analysisService.pollAnalysisStatus.mockImplementation(() => {});
  });

  test('complete analysis workflow - from URL input to results', async () => {
    // Mock API responses
    const mockCreateAnalysisResponse = {
      data: {
        data: {
          id: 'test-analysis-123',
          url: 'https://example.com',
          status: 'pending',
          createdAt: '2024-01-01T00:00:00Z'
        }
      }
    };

    const mockGetAnalysisResponse = {
      data: {
        id: 'test-analysis-123',
        url: 'https://example.com',
        status: 'pending',
        createdAt: '2024-01-01T00:00:00Z'
      }
    };

    const mockStatusResponses = [
      { data: { status: 'processing', message: 'Starting analysis...' } },
      { data: { status: 'completed', message: 'Analysis complete' } }
    ];

    const mockResultResponse = {
      data: {
        id: 'test-result-123',
        analysisId: 'test-analysis-123',
        complianceScore: 78,
        violations: [
          {
            id: 'color-contrast',
            impact: 'serious',
            description: 'Elements must have sufficient color contrast',
            help: 'Ensure all text elements have sufficient color contrast',
            helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/color-contrast',
            nodes: [
              {
                target: ['.low-contrast-text'],
                html: '<span class="low-contrast-text">Hard to read text</span>'
              }
            ]
          }
        ],
        passes: [
          {
            id: 'document-title',
            description: 'Documents must have a title'
          }
        ],
        incomplete: [],
        recommendations: ['Fix color contrast issues', 'Improve accessibility labels'],
        createdAt: '2024-01-01T00:00:00Z',
        scanDuration: 12000
      }
    };

    analysisService.createAnalysis.mockResolvedValue(mockCreateAnalysisResponse);
    analysisService.getAnalysis.mockResolvedValue(mockGetAnalysisResponse);
    
    let statusCallCount = 0;
    analysisService.getAnalysisStatus.mockImplementation(() => {
      return Promise.resolve(mockStatusResponses[statusCallCount++] || mockStatusResponses[1]);
    });
    
    analysisService.getAnalysisResult.mockResolvedValue(mockResultResponse);

    analysisService.pollAnalysisStatus.mockImplementation((analysisId, onUpdate) => {
      onUpdate({ status: 'processing', message: 'Starting analysis...' });
      const timerId = setTimeout(() => {
        onUpdate({ status: 'completed', message: 'Analysis complete' });
      }, 0);

      return () => clearTimeout(timerId);
    });

    // Start at home page
    renderWithRoute('/home');

    // Verify we're on the home page
    expect(screen.getByRole('heading', { level: 1, name: /web accessibility analyzer/i })).toBeInTheDocument();

    // Fill out the URL input form
    const urlInput = screen.getByLabelText(/website url/i);
    const analyzeButton = screen.getByRole('button', { name: /analyze website/i });

    await userEvent.type(urlInput, 'https://example.com');
    await userEvent.click(analyzeButton);

    // Verify API was called correctly
    await waitFor(() => {
      expect(analysisService.createAnalysis).toHaveBeenCalledWith({
        url: 'https://example.com',
        settings: {
          wcagLevel: 'AA',
          includeScreenshots: true,
          timeout: 30000,
          viewport: { width: 1920, height: 1080 }
        },
        isPublic: false
      });
    });

    // Should navigate to analysis page and show loading state
    await waitFor(() => {
      expect(screen.getByText('Accessibility Analysis')).toBeInTheDocument();
      expect(screen.getByText('https://example.com')).toBeInTheDocument();
    });

    // Should show processing status
    await waitFor(() => {
      const statusNode =
        screen.queryByText(/starting analysis/i) ||
        screen.queryByText(/analyzing website/i) ||
        screen.queryByText(/analysis completed successfully/i);
      expect(statusNode).toBeInTheDocument();
    });

    // Wait for analysis to complete and results to load
    await waitFor(() => {
      expect(screen.getAllByText('78%').length).toBeGreaterThan(0); // Compliance score
      expect(screen.getByText('Compliance Score')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Verify results are displayed
    expect(screen.getByRole('button', { name: /violations/i })).toHaveTextContent(/violations\s*1/i); // Violations count
    expect(screen.getByText('color-contrast')).toBeInTheDocument();
    expect(screen.getByText('serious')).toBeInTheDocument();

    // Test expanding violation details
    const violationButton = screen.getByText('color-contrast').closest('button');
    await userEvent.click(violationButton);

    await waitFor(() => {
      expect(screen.getByText('Elements must have sufficient color contrast')).toBeInTheDocument();
      expect(screen.getByText('Ensure all text elements have sufficient color contrast')).toBeInTheDocument();
    });

    // Test switching to passes tab
    const passesTab = screen.getByRole('button', { name: /passes/i });
    await userEvent.click(passesTab);

    expect(screen.getByText('document-title')).toBeInTheDocument();
    expect(screen.getByText('Documents must have a title')).toBeInTheDocument();

    // Test switching to summary tab
    const summaryTab = screen.getByRole('button', { name: /summary/i });
    await userEvent.click(summaryTab);

    expect(screen.getByText('Analysis Details')).toBeInTheDocument();
    expect(screen.getByText('12s')).toBeInTheDocument(); // Scan duration
    expect(screen.getByText('Key Recommendations')).toBeInTheDocument();
    expect(screen.getByText('Fix color contrast issues')).toBeInTheDocument();
  });

  test('navigation between different pages', async () => {
    // Simulate authenticated user so Dashboard link exists
    const mockUser = global.testUtils.createMockUser();
    authService.onAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser);
      return jest.fn();
    });

    renderWithRoute('/home');

    // Test navigation to dashboard
    const [dashboardLink] = await screen.findAllByRole('link', { name: /dashboard/i });
    await userEvent.click(dashboardLink);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^dashboard$/i })).toBeInTheDocument();
    });

    // Test navigation back to home
    const [homeLink] = screen.getAllByRole('link', { name: /home/i });
    await userEvent.click(homeLink);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /web accessibility analyzer/i })).toBeInTheDocument();
    });
  });

  test('error handling in analysis workflow', async () => {
    // Mock API error
    analysisService.createAnalysis.mockRejectedValue({
      response: {
        data: { message: 'Invalid URL provided' },
        status: 400
      }
    });

    renderWithRoute('/home');

    // Fill out form with URL that will cause error
    const urlInput = screen.getByLabelText(/website url/i);
    const analyzeButton = screen.getByRole('button', { name: /analyze website/i });

    await userEvent.type(urlInput, 'https://invalid-url.com');
    await userEvent.click(analyzeButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getAllByText(/invalid url provided/i).length).toBeGreaterThan(0);
    });

    // Form should be re-enabled
    expect(analyzeButton).not.toBeDisabled();
  });

  test('authentication workflow', async () => {
    const mockUser = global.testUtils.createMockUser();

    // Mock successful sign in
    authService.signIn.mockResolvedValue(mockUser);

    renderWithRoute('/');

    // Fill out sign in form
    const emailInput = screen.getByLabelText(/^email$/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const signInButton = screen.getByRole('button', { name: /log in/i });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(signInButton);

    // Verify auth service was called
    await waitFor(() => {
      expect(authService.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  test('responsive layout and mobile navigation', async () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    renderWithRoute('/home');

    // On mobile, navigation should be hidden initially
    // and mobile menu button should be visible
    const mobileMenuButton = screen.getByRole('button', { name: /open main menu/i });
    expect(mobileMenuButton).toBeInTheDocument();

    // Click mobile menu button to open navigation
    await userEvent.click(mobileMenuButton);

    // Navigation items should now be visible
    await waitFor(() => {
      expect(screen.getAllByRole('link', { name: /home/i }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('link', { name: /sign in/i }).length).toBeGreaterThan(0);
    });
  });

  test('accessibility features', () => {
    renderWithRoute('/home');

    // Check for proper heading structure
    const mainHeading = screen.getByRole('heading', { level: 1, name: /web accessibility analyzer/i });
    expect(mainHeading).toHaveTextContent('Web Accessibility Analyzer');

    // Check for proper form labels
    const urlInput = screen.getByLabelText(/website url/i);
    expect(urlInput).toBeInTheDocument();

    // Check for proper button roles
    const analyzeButton = screen.getByRole('button', { name: /analyze website/i });
    expect(analyzeButton).toBeInTheDocument();

    // Check for navigation landmarks
    const navigation = screen.getAllByRole('navigation');
    expect(navigation.length).toBeGreaterThan(0);

    // Check for main content area
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
  });

  test('handles direct navigation to analysis page', async () => {
    const mockAnalysis = global.testUtils.createMockAnalysis();
    const mockResult = global.testUtils.createMockResult();

    analysisService.getAnalysis.mockResolvedValue({ data: mockAnalysis });
    analysisService.getAnalysisResult.mockResolvedValue({ data: mockResult });
    analysisService.getAnalysisStatus.mockResolvedValue({ 
      data: { status: 'completed', message: 'Analysis complete' } 
    });

    // Navigate directly to analysis page
    renderWithRoute('/analysis/test-analysis-123');

    // Should load analysis data
    await waitFor(() => {
      expect(screen.getByText('Accessibility Analysis')).toBeInTheDocument();
      expect(screen.getByText('https://example.com')).toBeInTheDocument();
    });

    // Should display results
    await waitFor(() => {
      expect(screen.getAllByText('85%').length).toBeGreaterThan(0); // Default compliance score
    });
  });
});

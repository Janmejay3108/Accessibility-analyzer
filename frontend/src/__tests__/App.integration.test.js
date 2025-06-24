import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { analysisService } from '../services/api/analysisService';
import { authService } from '../services/firebase/authService';

// Mock services
jest.mock('../services/api/analysisService');
jest.mock('../services/firebase/authService');

// Mock React Router to control navigation
const renderWithRouter = (initialEntries = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <App />
    </MemoryRouter>
  );
};

describe('App Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock auth service to return no user initially
    authService.onAuthStateChanged.mockImplementation((callback) => {
      callback(null);
      return jest.fn(); // unsubscribe function
    });
  });

  test('complete analysis workflow - from URL input to results', async () => {
    const user = userEvent.setup();
    
    // Mock API responses
    const mockAnalysisResponse = {
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

    analysisService.createAnalysis.mockResolvedValue(mockAnalysisResponse);
    analysisService.getAnalysis.mockResolvedValue(mockAnalysisResponse);
    
    let statusCallCount = 0;
    analysisService.getAnalysisStatus.mockImplementation(() => {
      return Promise.resolve(mockStatusResponses[statusCallCount++] || mockStatusResponses[1]);
    });
    
    analysisService.getAnalysisResult.mockResolvedValue(mockResultResponse);

    // Start at home page
    renderWithRouter(['/']);

    // Verify we're on the home page
    expect(screen.getByText('Web Accessibility')).toBeInTheDocument();
    expect(screen.getByText('Analyzer')).toBeInTheDocument();

    // Fill out the URL input form
    const urlInput = screen.getByLabelText(/website url/i);
    const analyzeButton = screen.getByRole('button', { name: /analyze website/i });

    await user.type(urlInput, 'https://example.com');
    await user.click(analyzeButton);

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
      expect(screen.getByText(/analysis in progress/i)).toBeInTheDocument();
    });

    // Wait for analysis to complete and results to load
    await waitFor(() => {
      expect(screen.getByText('78%')).toBeInTheDocument(); // Compliance score
      expect(screen.getByText('Compliance Score')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Verify results are displayed
    expect(screen.getByText('1')).toBeInTheDocument(); // Violations count
    expect(screen.getByText('color-contrast')).toBeInTheDocument();
    expect(screen.getByText('serious')).toBeInTheDocument();

    // Test expanding violation details
    const violationButton = screen.getByText('color-contrast').closest('button');
    await user.click(violationButton);

    await waitFor(() => {
      expect(screen.getByText('Elements must have sufficient color contrast')).toBeInTheDocument();
      expect(screen.getByText('Ensure all text elements have sufficient color contrast')).toBeInTheDocument();
    });

    // Test switching to passes tab
    const passesTab = screen.getByRole('button', { name: /passes/i });
    await user.click(passesTab);

    expect(screen.getByText('document-title')).toBeInTheDocument();
    expect(screen.getByText('Documents must have a title')).toBeInTheDocument();

    // Test switching to summary tab
    const summaryTab = screen.getByRole('button', { name: /summary/i });
    await user.click(summaryTab);

    expect(screen.getByText('Analysis Details')).toBeInTheDocument();
    expect(screen.getByText('12s')).toBeInTheDocument(); // Scan duration
    expect(screen.getByText('Key Recommendations')).toBeInTheDocument();
    expect(screen.getByText('Fix color contrast issues')).toBeInTheDocument();
  });

  test('navigation between different pages', async () => {
    const user = userEvent.setup();
    
    renderWithRouter(['/']);

    // Test navigation to dashboard
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    await user.click(dashboardLink);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Overview of accessibility analysis activity')).toBeInTheDocument();
    });

    // Test navigation to auth page
    const authLink = screen.getByRole('link', { name: /sign in/i });
    await user.click(authLink);

    await waitFor(() => {
      expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    });

    // Test navigation back to home
    const homeLink = screen.getByRole('link', { name: /home/i });
    await user.click(homeLink);

    await waitFor(() => {
      expect(screen.getByText('Web Accessibility')).toBeInTheDocument();
      expect(screen.getByText('Analyzer')).toBeInTheDocument();
    });
  });

  test('error handling in analysis workflow', async () => {
    const user = userEvent.setup();
    
    // Mock API error
    analysisService.createAnalysis.mockRejectedValue({
      response: {
        data: { message: 'Invalid URL provided' },
        status: 400
      }
    });

    renderWithRouter(['/']);

    // Fill out form with URL that will cause error
    const urlInput = screen.getByLabelText(/website url/i);
    const analyzeButton = screen.getByRole('button', { name: /analyze website/i });

    await user.type(urlInput, 'https://invalid-url.com');
    await user.click(analyzeButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/failed to start analysis/i)).toBeInTheDocument();
    });

    // Form should be re-enabled
    expect(analyzeButton).not.toBeDisabled();
  });

  test('authentication workflow', async () => {
    const user = userEvent.setup();
    const mockUser = global.testUtils.createMockUser();

    // Mock successful sign in
    authService.signIn.mockResolvedValue(mockUser);

    renderWithRouter(['/auth']);

    // Fill out sign in form
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const signInButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(signInButton);

    // Verify auth service was called
    await waitFor(() => {
      expect(authService.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  test('responsive layout and mobile navigation', async () => {
    const user = userEvent.setup();
    
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    renderWithRouter(['/']);

    // On mobile, navigation should be hidden initially
    // and mobile menu button should be visible
    const mobileMenuButton = screen.getByRole('button', { name: /open main menu/i });
    expect(mobileMenuButton).toBeInTheDocument();

    // Click mobile menu button to open navigation
    await user.click(mobileMenuButton);

    // Navigation items should now be visible
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    });
  });

  test('accessibility features', () => {
    renderWithRouter(['/']);

    // Check for proper heading structure
    const mainHeading = screen.getByRole('heading', { level: 1 });
    expect(mainHeading).toHaveTextContent('Web Accessibility');

    // Check for proper form labels
    const urlInput = screen.getByLabelText(/website url/i);
    expect(urlInput).toBeInTheDocument();

    // Check for proper button roles
    const analyzeButton = screen.getByRole('button', { name: /analyze website/i });
    expect(analyzeButton).toBeInTheDocument();

    // Check for navigation landmarks
    const navigation = screen.getByRole('navigation');
    expect(navigation).toBeInTheDocument();

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
    renderWithRouter(['/analysis/test-analysis-123']);

    // Should load analysis data
    await waitFor(() => {
      expect(screen.getByText('Accessibility Analysis')).toBeInTheDocument();
      expect(screen.getByText('https://example.com')).toBeInTheDocument();
    });

    // Should display results
    await waitFor(() => {
      expect(screen.getByText('85%')).toBeInTheDocument(); // Default compliance score
    });
  });
});

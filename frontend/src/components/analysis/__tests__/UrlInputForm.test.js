import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import UrlInputForm from '../UrlInputForm';
import { ToastProvider } from '../../common/Toast';
import { analysisService } from '../../../services/api/analysisService';

// Mock the analysis service
jest.mock('../../../services/api/analysisService');

// Mock component wrapper with ToastProvider
const TestWrapper = ({ children }) => (
  <ToastProvider>
    {children}
  </ToastProvider>
);

describe('UrlInputForm', () => {
  const mockOnSubmit = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <TestWrapper>
        <UrlInputForm onSubmit={mockOnSubmit} {...props} />
      </TestWrapper>
    );
  };

  test('renders form elements correctly', () => {
    renderComponent();
    
    expect(screen.getByLabelText(/website url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/wcag compliance level/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/include screenshots/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/make results publicly viewable/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /analyze website/i })).toBeInTheDocument();
  });

  test('validates URL input', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const urlInput = screen.getByLabelText(/website url/i);
    const submitButton = screen.getByRole('button', { name: /analyze website/i });
    
    // Test invalid URL
    await user.type(urlInput, 'invalid-url');
    await user.click(submitButton);
    
    expect(screen.getByText(/please enter a valid url/i)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('validates URL protocol', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const urlInput = screen.getByLabelText(/website url/i);
    const submitButton = screen.getByRole('button', { name: /analyze website/i });
    
    // Test FTP protocol (should be rejected)
    await user.clear(urlInput);
    await user.type(urlInput, 'ftp://example.com');
    await user.click(submitButton);
    
    expect(screen.getByText(/url must use http or https protocol/i)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('submits form with valid URL', async () => {
    const user = userEvent.setup();
    const mockResponse = { data: { id: 'test-analysis-id' } };
    analysisService.createAnalysis.mockResolvedValue(mockResponse);
    
    renderComponent();
    
    const urlInput = screen.getByLabelText(/website url/i);
    const submitButton = screen.getByRole('button', { name: /analyze website/i });
    
    await user.type(urlInput, 'https://example.com');
    await user.click(submitButton);
    
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
    
    expect(mockOnSubmit).toHaveBeenCalledWith('test-analysis-id');
  });

  test('handles API errors gracefully', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Network error';
    analysisService.createAnalysis.mockRejectedValue(new Error(errorMessage));
    
    renderComponent();
    
    const urlInput = screen.getByLabelText(/website url/i);
    const submitButton = screen.getByRole('button', { name: /analyze website/i });
    
    await user.type(urlInput, 'https://example.com');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/failed to start analysis/i)).toBeInTheDocument();
    });
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('updates WCAG level setting', async () => {
    const user = userEvent.setup();
    const mockResponse = { data: { id: 'test-analysis-id' } };
    analysisService.createAnalysis.mockResolvedValue(mockResponse);
    
    renderComponent();
    
    const urlInput = screen.getByLabelText(/website url/i);
    const wcagSelect = screen.getByLabelText(/wcag compliance level/i);
    const submitButton = screen.getByRole('button', { name: /analyze website/i });
    
    await user.type(urlInput, 'https://example.com');
    await user.selectOptions(wcagSelect, 'AAA');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(analysisService.createAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({
            wcagLevel: 'AAA'
          })
        })
      );
    });
  });

  test('toggles screenshot setting', async () => {
    const user = userEvent.setup();
    const mockResponse = { data: { id: 'test-analysis-id' } };
    analysisService.createAnalysis.mockResolvedValue(mockResponse);
    
    renderComponent();
    
    const urlInput = screen.getByLabelText(/website url/i);
    const screenshotCheckbox = screen.getByLabelText(/include screenshots/i);
    const submitButton = screen.getByRole('button', { name: /analyze website/i });
    
    await user.type(urlInput, 'https://example.com');
    await user.click(screenshotCheckbox); // Uncheck it
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(analysisService.createAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({
            includeScreenshots: false
          })
        })
      );
    });
  });

  test('toggles public setting', async () => {
    const user = userEvent.setup();
    const mockResponse = { data: { id: 'test-analysis-id' } };
    analysisService.createAnalysis.mockResolvedValue(mockResponse);
    
    renderComponent();
    
    const urlInput = screen.getByLabelText(/website url/i);
    const publicCheckbox = screen.getByLabelText(/make results publicly viewable/i);
    const submitButton = screen.getByRole('button', { name: /analyze website/i });
    
    await user.type(urlInput, 'https://example.com');
    await user.click(publicCheckbox); // Check it
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(analysisService.createAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({
          isPublic: true
        })
      );
    });
  });

  test('disables form during submission', async () => {
    const user = userEvent.setup();
    // Mock a delayed response
    analysisService.createAnalysis.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ data: { id: 'test-id' } }), 100))
    );
    
    renderComponent();
    
    const urlInput = screen.getByLabelText(/website url/i);
    const submitButton = screen.getByRole('button', { name: /analyze website/i });
    
    await user.type(urlInput, 'https://example.com');
    await user.click(submitButton);
    
    // Check that form is disabled during submission
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/starting analysis/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  test('clears error when user starts typing', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const urlInput = screen.getByLabelText(/website url/i);
    const submitButton = screen.getByRole('button', { name: /analyze website/i });
    
    // Trigger an error first
    await user.type(urlInput, 'invalid-url');
    await user.click(submitButton);
    
    expect(screen.getByText(/please enter a valid url/i)).toBeInTheDocument();
    
    // Start typing again
    await user.clear(urlInput);
    await user.type(urlInput, 'h');
    
    expect(screen.queryByText(/please enter a valid url/i)).not.toBeInTheDocument();
  });
});

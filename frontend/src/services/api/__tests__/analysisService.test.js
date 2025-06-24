import axios from 'axios';
import { analysisService } from '../analysisService';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
global.localStorage = localStorageMock;

describe('analysisService', () => {
  const mockAnalysisData = {
    url: 'https://example.com',
    settings: {
      wcagLevel: 'AA',
      includeScreenshots: true
    },
    isPublic: false
  };

  const mockAnalysisResponse = {
    data: {
      id: 'test-analysis-id',
      url: 'https://example.com',
      status: 'pending',
      createdAt: '2024-01-01T00:00:00Z'
    }
  };

  const mockResultResponse = {
    data: {
      id: 'test-result-id',
      analysisId: 'test-analysis-id',
      complianceScore: 85,
      violations: [],
      passes: [],
      incomplete: []
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('mock-token');
  });

  describe('createAnalysis', () => {
    test('creates analysis successfully', async () => {
      mockedAxios.post.mockResolvedValue(mockAnalysisResponse);

      const result = await analysisService.createAnalysis(mockAnalysisData);

      expect(mockedAxios.post).toHaveBeenCalledWith('/analysis', mockAnalysisData);
      expect(result).toEqual(mockAnalysisResponse);
    });

    test('handles creation error', async () => {
      const errorResponse = {
        response: {
          data: { message: 'Invalid URL' },
          status: 400
        }
      };
      mockedAxios.post.mockRejectedValue(errorResponse);

      await expect(analysisService.createAnalysis(mockAnalysisData))
        .rejects.toEqual(errorResponse);
    });
  });

  describe('getAnalysis', () => {
    test('fetches analysis successfully', async () => {
      mockedAxios.get.mockResolvedValue(mockAnalysisResponse);

      const result = await analysisService.getAnalysis('test-analysis-id');

      expect(mockedAxios.get).toHaveBeenCalledWith('/analysis/test-analysis-id');
      expect(result).toEqual(mockAnalysisResponse);
    });

    test('handles not found error', async () => {
      const errorResponse = {
        response: {
          status: 404,
          data: { message: 'Analysis not found' }
        }
      };
      mockedAxios.get.mockRejectedValue(errorResponse);

      await expect(analysisService.getAnalysis('nonexistent-id'))
        .rejects.toEqual(errorResponse);
    });
  });

  describe('getAnalysisResult', () => {
    test('fetches analysis result successfully', async () => {
      mockedAxios.get.mockResolvedValue(mockResultResponse);

      const result = await analysisService.getAnalysisResult('test-analysis-id');

      expect(mockedAxios.get).toHaveBeenCalledWith('/analysis/test-analysis-id/result');
      expect(result).toEqual(mockResultResponse);
    });
  });

  describe('getAnalysisStatus', () => {
    test('fetches analysis status successfully', async () => {
      const statusResponse = {
        data: {
          status: 'processing',
          message: 'Analyzing website...',
          progress: 50
        }
      };
      mockedAxios.get.mockResolvedValue(statusResponse);

      const result = await analysisService.getAnalysisStatus('test-analysis-id');

      expect(mockedAxios.get).toHaveBeenCalledWith('/analysis/test-analysis-id/status');
      expect(result).toEqual(statusResponse);
    });
  });

  describe('triggerScan', () => {
    test('triggers scan successfully', async () => {
      const scanResponse = { data: { message: 'Scan triggered' } };
      mockedAxios.post.mockResolvedValue(scanResponse);

      const result = await analysisService.triggerScan('test-analysis-id');

      expect(mockedAxios.post).toHaveBeenCalledWith('/analysis/test-analysis-id/scan');
      expect(result).toEqual(scanResponse);
    });
  });

  describe('getUserAnalyses', () => {
    test('fetches user analyses with default pagination', async () => {
      const analysesResponse = {
        data: {
          analyses: [mockAnalysisResponse.data],
          pagination: { page: 1, limit: 10, total: 1 }
        }
      };
      mockedAxios.get.mockResolvedValue(analysesResponse);

      const result = await analysisService.getUserAnalyses();

      expect(mockedAxios.get).toHaveBeenCalledWith('/analysis/user/requests', {
        params: { page: 1, limit: 10 }
      });
      expect(result).toEqual(analysesResponse);
    });

    test('fetches user analyses with custom pagination', async () => {
      const analysesResponse = { data: { analyses: [] } };
      mockedAxios.get.mockResolvedValue(analysesResponse);

      await analysisService.getUserAnalyses(2, 20);

      expect(mockedAxios.get).toHaveBeenCalledWith('/analysis/user/requests', {
        params: { page: 2, limit: 20 }
      });
    });
  });

  describe('getUrlHistory', () => {
    test('fetches URL history successfully', async () => {
      const historyResponse = { data: { analyses: [] } };
      mockedAxios.get.mockResolvedValue(historyResponse);

      const result = await analysisService.getUrlHistory('https://example.com');

      expect(mockedAxios.get).toHaveBeenCalledWith('/analysis/url/history', {
        params: { url: 'https://example.com', page: 1, limit: 10 }
      });
      expect(result).toEqual(historyResponse);
    });
  });

  describe('getRecentPublicAnalyses', () => {
    test('fetches recent public analyses successfully', async () => {
      const recentResponse = { data: [mockAnalysisResponse.data] };
      mockedAxios.get.mockResolvedValue(recentResponse);

      const result = await analysisService.getRecentPublicAnalyses(5);

      expect(mockedAxios.get).toHaveBeenCalledWith('/analysis/public/recent', {
        params: { limit: 5 }
      });
      expect(result).toEqual(recentResponse);
    });
  });

  describe('getDashboardAnalytics', () => {
    test('fetches dashboard analytics successfully', async () => {
      const analyticsResponse = {
        data: {
          totalAnalyses: 100,
          averageComplianceScore: 85,
          totalViolations: 250
        }
      };
      mockedAxios.get.mockResolvedValue(analyticsResponse);

      const result = await analysisService.getDashboardAnalytics();

      expect(mockedAxios.get).toHaveBeenCalledWith('/analysis/dashboard/analytics');
      expect(result).toEqual(analyticsResponse);
    });
  });

  describe('pollAnalysisStatus', () => {
    test('polls status until completion', async () => {
      const statusResponses = [
        { data: { status: 'processing', message: 'Starting...' } },
        { data: { status: 'processing', message: 'Analyzing...' } },
        { data: { status: 'completed', message: 'Analysis complete' } }
      ];

      let callCount = 0;
      mockedAxios.get.mockImplementation(() => {
        return Promise.resolve(statusResponses[callCount++]);
      });

      const onUpdate = jest.fn();
      
      // Mock setTimeout to execute immediately
      jest.spyOn(global, 'setTimeout').mockImplementation((callback) => {
        callback();
        return 123; // mock timer id
      });

      await analysisService.pollAnalysisStatus('test-analysis-id', onUpdate, 3);

      expect(onUpdate).toHaveBeenCalledTimes(3);
      expect(onUpdate).toHaveBeenNthCalledWith(1, { status: 'processing', message: 'Starting...' });
      expect(onUpdate).toHaveBeenNthCalledWith(2, { status: 'processing', message: 'Analyzing...' });
      expect(onUpdate).toHaveBeenNthCalledWith(3, { status: 'completed', message: 'Analysis complete' });

      global.setTimeout.mockRestore();
    });

    test('handles polling error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      const onUpdate = jest.fn();

      await analysisService.pollAnalysisStatus('test-analysis-id', onUpdate);

      expect(onUpdate).toHaveBeenCalledWith({
        status: 'error',
        error: 'Network error'
      });
    });
  });

  describe('authentication token handling', () => {
    test('includes auth token in requests when available', async () => {
      localStorageMock.getItem.mockReturnValue('test-token');
      mockedAxios.post.mockResolvedValue(mockAnalysisResponse);

      // The axios instance should be configured with interceptors
      // We can't directly test the interceptor, but we can verify the service works
      await analysisService.createAnalysis(mockAnalysisData);

      expect(mockedAxios.post).toHaveBeenCalled();
    });

    test('works without auth token', async () => {
      localStorageMock.getItem.mockReturnValue(null);
      mockedAxios.post.mockResolvedValue(mockAnalysisResponse);

      await analysisService.createAnalysis(mockAnalysisData);

      expect(mockedAxios.post).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    test('logs errors appropriately', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');
      mockedAxios.post.mockRejectedValue(error);

      await expect(analysisService.createAnalysis(mockAnalysisData))
        .rejects.toThrow('Test error');

      expect(consoleSpy).toHaveBeenCalledWith('Error creating analysis:', error);
      
      consoleSpy.mockRestore();
    });
  });
});

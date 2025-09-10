import axios from 'axios';

// Create axios instance with base configuration
const getBaseURL = () => {
  const envBaseURL = process.env.REACT_APP_API_BASE_URL;

  // If explicitly set to empty string (production), use same domain
  if (envBaseURL === '') {
    return '/api';
  }

  // If set to a specific URL, use it
  if (envBaseURL) {
    return envBaseURL + '/api';
  }

  // Default for development
  return 'http://localhost:5000/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) || 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      // Could redirect to login page here
    }
    return Promise.reject(error);
  }
);

export const analysisService = {
  // Create a new analysis request
  createAnalysis: async (analysisData) => {
    try {
      const response = await api.post('/analysis', analysisData);
      return response;
    } catch (error) {
      console.error('Error creating analysis:', error);
      throw error;
    }
  },

  // Get analysis request details
  getAnalysis: async (analysisId) => {
    try {
      const response = await api.get(`/analysis/${analysisId}`);
      // Backend returns { message, data }, so we need to extract the data
      return { ...response, data: response.data.data };
    } catch (error) {
      console.error('Error fetching analysis:', error);
      throw error;
    }
  },

  // Get analysis results
  getAnalysisResult: async (analysisId) => {
    try {
      const response = await api.get(`/analysis/${analysisId}/result`);
      // Backend returns { message, data }, so we need to extract the data
      return { ...response, data: response.data.data };
    } catch (error) {
      console.error('Error fetching analysis result:', error);
      throw error;
    }
  },

  // Get analysis status
  getAnalysisStatus: async (analysisId) => {
    try {
      const response = await api.get(`/analysis/${analysisId}/status`);
      // Backend returns { message, data }, so we need to extract the data
      return { ...response, data: response.data.data };
    } catch (error) {
      console.error('Error fetching analysis status:', error);
      throw error;
    }
  },

  // Trigger manual scan
  triggerScan: async (analysisId) => {
    try {
      const response = await api.post(`/analysis/${analysisId}/scan`);
      return response;
    } catch (error) {
      console.error('Error triggering scan:', error);
      throw error;
    }
  },

  // Get user's analysis requests
  getUserAnalyses: async (page = 1, limit = 10) => {
    try {
      const response = await api.get('/analysis/user/requests', {
        params: { page, limit }
      });
      return response;
    } catch (error) {
      console.error('Error fetching user analyses:', error);
      throw error;
    }
  },

  // Get analysis history by URL
  getUrlHistory: async (url, page = 1, limit = 10) => {
    try {
      const response = await api.get('/analysis/url/history', {
        params: { url, page, limit }
      });
      return response;
    } catch (error) {
      console.error('Error fetching URL history:', error);
      throw error;
    }
  },

  // Get user's analysis requests (requires authentication)
  getUserAnalysisRequests: async (page = 1, limit = 10) => {
    try {
      const response = await api.get('/analysis/user/requests', {
        params: {
          page,
          limit,
          offset: (page - 1) * limit
        }
      });
      return response;
    } catch (error) {
      console.error('Error fetching user analysis requests:', error);
      throw error;
    }
  },

  // Get user's analysis results (requires authentication) - for dashboard consistency
  getUserAnalysisResults: async (page = 1, limit = 10) => {
    try {
      const response = await api.get('/analysis/user/results', {
        params: {
          page,
          limit,
          offset: (page - 1) * limit
        }
      });
      return response;
    } catch (error) {
      console.error('Error fetching user analysis results:', error);
      throw error;
    }
  },

  // Get recent public analyses
  getRecentPublicAnalyses: async (limit = 10) => {
    try {
      const response = await api.get('/analysis/public/recent', {
        params: { limit }
      });
      // Backend returns { message, data }, so we need to extract the data
      return { ...response, data: response.data.data };
    } catch (error) {
      console.error('Error fetching recent public analyses:', error);
      throw error;
    }
  },

  // Get dashboard analytics
  getDashboardAnalytics: async () => {
    try {
      const response = await api.get('/analysis/dashboard/analytics');
      // Backend returns { message, data }, so we need to extract the data
      return { ...response, data: response.data.data };
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      throw error;
    }
  },

  // Get detailed violation analysis
  getViolationAnalysis: async (analysisId) => {
    try {
      const response = await api.get(`/analysis/${analysisId}/violations`);
      return response;
    } catch (error) {
      console.error('Error fetching violation analysis:', error);
      throw error;
    }
  },

  // Get historical comparison
  getHistoricalComparison: async (url) => {
    try {
      const response = await api.get('/analysis/history/comparison', {
        params: { url }
      });
      return response;
    } catch (error) {
      console.error('Error fetching historical comparison:', error);
      throw error;
    }
  },

  // Poll for analysis status updates
  pollAnalysisStatus: async (analysisId, onUpdate, maxAttempts = 60) => {
    let attempts = 0;
    
    const poll = async () => {
      try {
        const response = await analysisService.getAnalysisStatus(analysisId);
        const statusData = response.data;

        // Extract the actual analysis status from the response
        const status = {
          status: statusData.analysisRequest?.status || statusData.status,
          message: statusData.scanStatus?.message || statusData.message,
          error: statusData.error,
          userFriendlyMessage: statusData.analysisRequest?.metadata?.userFriendlyMessage || statusData.userFriendlyMessage,
          errorCategory: statusData.analysisRequest?.metadata?.errorCategory || statusData.errorCategory
        };

        onUpdate(status);
        
        // Continue polling if still processing or pending
        if ((status.status === 'processing' || status.status === 'pending') && attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 2000); // Poll every 2 seconds
        } else if (status.status === 'failed') {
          // Stop polling for failed status
          console.log('Analysis failed:', status.userFriendlyMessage || status.error);
        }
      } catch (error) {
        console.error('Error polling analysis status:', error);
        onUpdate({ status: 'error', error: error.message });
      }
    };
    
    poll();
  }
};

export default analysisService;

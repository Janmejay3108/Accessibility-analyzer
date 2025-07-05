import React, { useState } from 'react';
import { ExclamationCircleIcon, ArrowPathIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { analysisService } from '../../services/api/analysisService';
import { useToast } from '../common/Toast';

const UrlInputForm = ({ onSubmit }) => {
  const { showSuccess, showError } = useToast();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [settings] = useState({
    wcagLevel: 'AA',
    includeScreenshots: true,
    isPublic: false
  });

  const validateUrl = (url) => {
    try {
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return 'URL must use HTTP or HTTPS protocol';
      }
      return null;
    } catch (e) {
      return 'Please enter a valid URL (e.g., https://example.com)';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate URL
    const urlError = validateUrl(url);
    if (urlError) {
      setError(urlError);
      return;
    }

    setLoading(true);

    try {
      // Create analysis request
      const response = await analysisService.createAnalysis({
        url: url.trim(),
        settings: {
          wcagLevel: settings.wcagLevel,
          includeScreenshots: settings.includeScreenshots,
          timeout: 30000,
          viewport: { width: 1920, height: 1080 }
        },
        isPublic: settings.isPublic
      });

      if (response.data && response.data.data && response.data.data.id) {
        showSuccess('Analysis started successfully! Redirecting to results...');
        // Call the onSubmit callback with the analysis ID
        onSubmit(response.data.data.id);
      } else {
        setError('Failed to create analysis request. Please try again.');
      }
    } catch (err) {
      console.error('Analysis creation error:', err);
      const errorMessage = err.response?.data?.message ||
        'Failed to start analysis. Please check the URL and try again.';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUrlChange = (e) => {
    setUrl(e.target.value);
    if (error) setError(''); // Clear error when user starts typing
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="w-full">
        {/* URL Input Field */}
        <div className="relative">
          <input
            type="url"
            id="url"
            value={url}
            onChange={handleUrlChange}
            placeholder="Enter a URL to start a comprehensive accessibility analysis"
            className="w-full px-4 py-3 text-base bg-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 pr-14"
            disabled={loading}
            required
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? (
              <ArrowPathIcon className="animate-spin h-5 w-5" />
            ) : (
              <MagnifyingGlassIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </form>

      {error && (
        <p className="mt-4 text-sm text-red-500 text-center flex items-center justify-center">
          <ExclamationCircleIcon className="h-4 w-4 mr-2" />
          {error}
        </p>
      )}
    </div>

  );
};

export default UrlInputForm;

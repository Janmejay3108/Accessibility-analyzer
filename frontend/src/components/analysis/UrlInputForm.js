import React, { useState } from 'react';
import { ExclamationCircleIcon, ArrowPathIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { analysisService } from '../../services/api/analysisService';
import { useToast } from '../common/Toast';

const UrlInputForm = ({ onSubmit }) => {
  const { showSuccess, showError } = useToast();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState({
    wcagLevel: 'AA',
    includeScreenshots: true,
    isPublic: false
  });

  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

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
        <div className="mb-3">
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
            Website URL
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={handleUrlChange}
            placeholder="Enter a URL to start a comprehensive accessibility analysis"
            className="w-full px-4 py-3 text-base bg-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            disabled={loading}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div>
            <label htmlFor="wcagLevel" className="block text-sm font-medium text-gray-700 mb-2">
              WCAG Compliance Level
            </label>
            <select
              id="wcagLevel"
              name="wcagLevel"
              value={settings.wcagLevel}
              onChange={handleSettingsChange}
              disabled={loading}
              className="w-full px-3 py-2 bg-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="A">A</option>
              <option value="AA">AA</option>
              <option value="AAA">AAA</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center space-x-2 text-sm text-gray-700">
              <input
                type="checkbox"
                name="includeScreenshots"
                checked={settings.includeScreenshots}
                onChange={handleSettingsChange}
                disabled={loading}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <span>Include Screenshots</span>
            </label>
          </div>

          <div className="flex items-end">
            <label className="flex items-center space-x-2 text-sm text-gray-700">
              <input
                type="checkbox"
                name="isPublic"
                checked={settings.isPublic}
                onChange={handleSettingsChange}
                disabled={loading}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <span>Make results publicly viewable</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <ArrowPathIcon className="animate-spin h-5 w-5" />
              <span>Starting analysis...</span>
            </>
          ) : (
            <>
              <MagnifyingGlassIcon className="h-5 w-5" />
              <span>Analyze Website</span>
            </>
          )}
        </button>
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

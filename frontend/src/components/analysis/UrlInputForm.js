import React, { useState } from 'react';
import { ExclamationCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* URL Input */}
      <div>
        <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
          Website URL
        </label>
        <div className="relative">
          <input
            type="url"
            id="url"
            value={url}
            onChange={handleUrlChange}
            placeholder="https://example.com"
            className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              error ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={loading}
            required
          />
          {error && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
            </div>
          )}
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <ExclamationCircleIcon className="h-4 w-4 mr-1" />
            {error}
          </p>
        )}
      </div>

      {/* Analysis Settings */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700">Analysis Settings</h4>
        
        {/* WCAG Level */}
        <div>
          <label htmlFor="wcagLevel" className="block text-sm text-gray-600 mb-1">
            WCAG Compliance Level
          </label>
          <select
            id="wcagLevel"
            value={settings.wcagLevel}
            onChange={(e) => setSettings({ ...settings, wcagLevel: e.target.value })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          >
            <option value="A">WCAG 2.1 Level A</option>
            <option value="AA">WCAG 2.1 Level AA (Recommended)</option>
            <option value="AAA">WCAG 2.1 Level AAA</option>
          </select>
        </div>

        {/* Checkboxes */}
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.includeScreenshots}
              onChange={(e) => setSettings({ ...settings, includeScreenshots: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={loading}
            />
            <span className="ml-2 text-sm text-gray-600">Include screenshots in report</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.isPublic}
              onChange={(e) => setSettings({ ...settings, isPublic: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={loading}
            />
            <span className="ml-2 text-sm text-gray-600">Make results publicly viewable</span>
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !url.trim()}
        className={`w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
          loading || !url.trim()
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
        }`}
      >
        {loading ? (
          <>
            <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />
            Starting Analysis...
          </>
        ) : (
          'Analyze Website'
        )}
      </button>

      {/* Help Text */}
      <div className="text-xs text-gray-500 text-center">
        <p>Analysis typically takes 15-30 seconds depending on page complexity.</p>
        <p>We'll scan your website for WCAG compliance and provide detailed recommendations.</p>
      </div>
    </form>
  );
};

export default UrlInputForm;

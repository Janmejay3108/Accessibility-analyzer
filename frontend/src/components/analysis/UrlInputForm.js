import React, { useCallback, useEffect, useState } from 'react';
import { ArrowPathIcon, ArrowRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { analysisService } from '../../services/api/analysisService';
import { useToast } from '../common/Toast';
import { useAuth } from '../../contexts/AuthContext';

const UrlInputForm = ({ onSubmit }) => {
  const { showSuccess, showError } = useToast();
  const { isAuthenticated } = useAuth();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usage, setUsage] = useState(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    wcagLevel: 'AA',
    includeScreenshots: true,
    isPublic: false
  });

  const loadUsage = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setUsageLoading(true);
      const response = await analysisService.getUsage();
      setUsage(response.data);
    } catch (e) {
      setUsage(null);
    } finally {
      setUsageLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadUsage();
    }
  }, [isAuthenticated, loadUsage]);

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

    if (!isAuthenticated) {
      const message = 'Please sign in with Google to run accessibility scans.';
      setError(message);
      showError(message);
      return;
    }

    const urlError = validateUrl(url);
    if (urlError) {
      setError(urlError);
      return;
    }

    if (usage && usage.finished) {
      const message = 'Your demo usage is finished, you can however use the opensourced project through locally through GitHub.';
      setError(message);
      showError(message);
      return;
    }

    setLoading(true);

    try {
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
        await loadUsage();
        showSuccess('Analysis started successfully! Redirecting to results...');
        onSubmit(response.data.data.id);
      } else {
        setError('Failed to create analysis request. Please try again.');
      }
    } catch (err) {
      console.error('Analysis creation error:', err);
      if (err.response?.status === 429 && err.response?.data?.code === 'QUOTA_EXCEEDED') {
        await loadUsage();
      }

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
    if (error) setError('');
  };

  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl border border-border-light p-8 shadow-soft text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text-main mb-2">
            Sign in to continue
          </h3>
          <p className="text-text-subtle text-sm mb-6">
            Sign in with Google to run accessibility scans.
          </p>
          <Link
            to="/"
            className="btn-primary inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="w-full">
        {usage && usage.finished && (
          <div className="mb-4 px-5 py-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <p className="text-sm text-amber-900 text-center">
              Your demo usage is finished, you can however use the opensourced project through locally through{' '}
              <a
                href="https://github.com/Janmejay3108/Accessibility-analyzer"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline"
              >
                GitHub
              </a>
              .
            </p>
          </div>
        )}

        {isAuthenticated && (
          <div className="mb-4">
            <div className="bg-white rounded-2xl border border-border-light px-5 py-4 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-text-main font-medium">Demo usage</p>
                <p className="text-sm text-text-muted">
                  {usageLoading ? 'Loading…' : usage ? `${usage.used}/${usage.limit} used` : '—'}
                </p>
              </div>
              <div className="mt-3 h-2 bg-gray-100 rounded-pill overflow-hidden">
                <div
                  className="h-full bg-gray-900 rounded-pill transition-all"
                  style={{
                    width: usage ? `${Math.min((usage.used / usage.limit) * 100, 100)}%` : '0%'
                  }}
                />
              </div>
              {usage && !usage.finished && (
                <p className="mt-2 text-xs text-text-muted">
                  {usage.remaining} remaining
                </p>
              )}
            </div>
          </div>
        )}

        {/* Omnibar - The signature input */}
        <div className="relative">
          <input
            type="url"
            id="url"
            value={url}
            onChange={handleUrlChange}
            placeholder="Enter website URL to analyze..."
            className="omnibar pr-36 text-base md:text-lg"
            disabled={loading}
            required
          />
          <button
            type="submit"
            disabled={loading || !url.trim() || (usage && usage.finished)}
            className="absolute right-2 top-1/2 -translate-y-1/2 
                       bg-gray-900 text-white px-5 py-2.5 rounded-pill
                       hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98]
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100
                       transition-all duration-200 ease-spring
                       flex items-center gap-2 text-sm font-medium"
          >
            {loading ? (
              <>
                <ArrowPathIcon className="animate-spin h-4 w-4" />
                <span className="hidden sm:inline">Analyzing...</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Analyze</span>
                <ArrowRightIcon className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl">
            <p className="text-sm text-red-600 text-center">{error}</p>
          </div>
        )}

        {/* Collapsible Settings */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 text-sm text-text-subtle hover:text-text-main transition-colors mx-auto"
          >
            <span>Advanced options</span>
            <ChevronDownIcon 
              className={`h-4 w-4 transition-transform duration-200 ${showSettings ? 'rotate-180' : ''}`} 
            />
          </button>

          {showSettings && (
            <div className="mt-4 p-5 bg-white rounded-2xl border border-border-light shadow-soft animate-slide-up">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="wcagLevel" className="block text-sm font-medium text-text-main mb-2">
                    WCAG Level
                  </label>
                  <select
                    id="wcagLevel"
                    name="wcagLevel"
                    value={settings.wcagLevel}
                    onChange={handleSettingsChange}
                    disabled={loading}
                    className="select-field"
                  >
                    <option value="A">Level A</option>
                    <option value="AA">Level AA</option>
                    <option value="AAA">Level AAA</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-3 text-sm text-text-main cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        name="includeScreenshots"
                        checked={settings.includeScreenshots}
                        onChange={handleSettingsChange}
                        disabled={loading}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-gray-200 rounded-pill peer-checked:bg-gray-900 transition-colors" />
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm peer-checked:translate-x-4 transition-transform" />
                    </div>
                    <span className="group-hover:text-text-main transition-colors">Screenshots</span>
                  </label>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-3 text-sm text-text-main cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        name="isPublic"
                        checked={settings.isPublic}
                        onChange={handleSettingsChange}
                        disabled={loading}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-gray-200 rounded-pill peer-checked:bg-gray-900 transition-colors" />
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm peer-checked:translate-x-4 transition-transform" />
                    </div>
                    <span className="group-hover:text-text-main transition-colors">Public results</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default UrlInputForm;

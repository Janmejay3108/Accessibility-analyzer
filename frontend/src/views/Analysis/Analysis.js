import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { analysisService } from '../../services/api/analysisService';
import AnalysisResults from '../../components/analysis/AnalysisResults';
import StatusIndicator from '../../components/common/StatusIndicator';
import Loading from '../../components/common/Loading';
import { NetworkError, NotFoundError } from '../../components/common/ErrorMessage';
import { useToast } from '../../components/common/Toast';

const Analysis = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [analysis, setAnalysis] = useState(null);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState('generic');

  useEffect(() => {
    if (id) {
      loadAnalysis();
      startStatusPolling();
    }
  }, [id]);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      setError('');
      setErrorType('generic');

      const response = await analysisService.getAnalysis(id);
      setAnalysis(response.data);

      // Try to load results if analysis is complete
      if (response.data.status === 'completed') {
        await loadResults();
      }
    } catch (err) {
      console.error('Error loading analysis:', err);

      if (err.response?.status === 404) {
        setErrorType('notFound');
        setError('Analysis not found. It may have been deleted or the URL is incorrect.');
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        setErrorType('network');
        setError('Unable to connect to the server. Please check your internet connection.');
      } else {
        setErrorType('generic');
        setError(err.response?.data?.message || 'Failed to load analysis. Please try again.');
      }

      showError(error || 'Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };

  const loadResults = async () => {
    try {
      const response = await analysisService.getAnalysisResult(id);
      setResult(response.data);
    } catch (err) {
      console.error('Error loading results:', err);
      // Don't set error here as analysis might still be processing
    }
  };

  const startStatusPolling = () => {
    analysisService.pollAnalysisStatus(id, (statusUpdate) => {
      setStatus(statusUpdate);
      
      if (statusUpdate.status === 'completed') {
        loadResults();
      } else if (statusUpdate.status === 'error') {
        setError(statusUpdate.error || 'Analysis failed. Please try again.');
      }
    });
  };

  const handleRetryAnalysis = async () => {
    try {
      setError('');
      setErrorType('generic');
      setStatus({ status: 'processing', message: 'Restarting analysis...' });
      await analysisService.triggerScan(id);
      showSuccess('Analysis restarted successfully');
      startStatusPolling();
    } catch (err) {
      const errorMessage = 'Failed to restart analysis. Please try again.';
      setError(errorMessage);
      showError(errorMessage);
    }
  };

  const getStatusIcon = () => {
    if (!status) return <ClockIcon className="h-5 w-5 text-gray-400" />;
    
    switch (status.status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'processing':
        return <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusMessage = () => {
    if (!status) return 'Loading...';
    
    switch (status.status) {
      case 'completed':
        return 'Analysis completed successfully';
      case 'error':
        return status.error || 'Analysis failed';
      case 'processing':
        return status.message || 'Analyzing website...';
      default:
        return status.message || 'Preparing analysis...';
    }
  };

  if (loading) {
    return (
      <Loading
        size="large"
        message="Loading analysis..."
        className="min-h-64"
      />
    );
  }

  if (error && !analysis) {
    return (
      <div className="max-w-2xl mx-auto">
        {errorType === 'notFound' ? (
          <NotFoundError
            resource="analysis"
            onGoBack={() => navigate('/')}
          />
        ) : errorType === 'network' ? (
          <NetworkError
            onRetry={loadAnalysis}
            onDismiss={() => setError('')}
          />
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Analysis</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <div className="space-x-3">
              <button
                onClick={loadAnalysis}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/')}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Start New Analysis
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analysis Header */}
      {analysis && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Accessibility Analysis
              </h1>
              <p className="text-gray-600 break-all">{analysis.url}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                Started: {new Date(analysis.createdAt).toLocaleString()}
              </p>
              {analysis.settings && (
                <p className="text-sm text-gray-500">
                  WCAG Level: {analysis.settings.wcagLevel || 'AA'}
                </p>
              )}
            </div>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
            {getStatusIcon()}
            <span className="text-sm font-medium text-gray-700">
              {getStatusMessage()}
            </span>
            {status?.status === 'error' && (
              <button
                onClick={handleRetryAnalysis}
                className="ml-auto text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                Retry Analysis
              </button>
            )}
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {result ? (
        <AnalysisResults result={result} analysis={analysis} />
      ) : status?.status === 'processing' ? (
        <div className="bg-white shadow rounded-lg p-8">
          <div className="text-center">
            <ArrowPathIcon className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Analysis in Progress
            </h3>
            <p className="text-gray-600 mb-4">
              We're scanning your website for accessibility issues. This typically takes 15-30 seconds.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>What we're checking:</strong>
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• WCAG 2.1 compliance violations</li>
                <li>• Color contrast and accessibility</li>
                <li>• Keyboard navigation support</li>
                <li>• Screen reader compatibility</li>
                <li>• Form and input accessibility</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Waiting for Results
          </h3>
          <p className="text-gray-600">
            Analysis results will appear here once the scan is complete.
          </p>
        </div>
      )}
    </div>
  );
};

export default Analysis;

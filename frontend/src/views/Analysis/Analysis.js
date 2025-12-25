import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ClockIcon,
  GlobeAltIcon,
  SparklesIcon,
  ClipboardDocumentIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { analysisService } from '../../services/api/analysisService';
import { useAuth } from '../../contexts/AuthContext';
import Loading from '../../components/common/Loading';

const Analysis = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [analysis, setAnalysis] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedViolations, setExpandedViolations] = useState({});
  const [generatingFix, setGeneratingFix] = useState({});
  const [aiFixes, setAiFixes] = useState({});

  const loadAnalysisData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch analysis request details
      const analysisResponse = await analysisService.getAnalysis(id);
      setAnalysis(analysisResponse.data);

      // If completed, fetch results
      if (analysisResponse.data?.status === 'completed') {
        try {
          const resultResponse = await analysisService.getAnalysisResult(id);
          setResult(resultResponse.data);
        } catch (resultErr) {
          console.error('Error fetching results:', resultErr);
        }
      }
    } catch (err) {
      console.error('Error loading analysis:', err);
      setError('Failed to load analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadAnalysisData();
    }
  }, [id, loadAnalysisData]);

  // Poll for status if processing
  useEffect(() => {
    if (analysis?.status === 'processing' || analysis?.status === 'pending') {
      const interval = setInterval(async () => {
        try {
          const statusResponse = await analysisService.getAnalysisStatus(id);
          const status = statusResponse.data?.analysisRequest?.status || statusResponse.data?.status;
          
          if (status === 'completed' || status === 'error' || status === 'failed') {
            clearInterval(interval);
            loadAnalysisData();
          } else {
            setAnalysis(prev => ({ ...prev, status }));
          }
        } catch (err) {
          console.error('Error polling status:', err);
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [analysis?.status, id, loadAnalysisData]);

  const toggleViolation = (index) => {
    setExpandedViolations(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleGenerateAIFix = async (violationIndex) => {
    try {
      setGeneratingFix(prev => ({ ...prev, [violationIndex]: true }));
      const response = await analysisService.generateAIFix(id, violationIndex);
      setAiFixes(prev => ({ ...prev, [violationIndex]: response.data }));
    } catch (err) {
      console.error('Error generating AI fix:', err);
    } finally {
      setGeneratingFix(prev => ({ ...prev, [violationIndex]: false }));
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'serious':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'minor':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 70) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 90) return 'bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'bg-amber-50 border-amber-200';
    return 'bg-red-50 border-red-200';
  };

  const toDateSafe = (value) => {
    if (!value) return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    if (typeof value === 'string' || typeof value === 'number') {
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d;
    }
    if (typeof value === 'object') {
      if (typeof value.toDate === 'function') {
        const d = value.toDate();
        return d instanceof Date && !isNaN(d.getTime()) ? d : null;
      }
      if (typeof value.seconds === 'number') {
        const d = new Date(value.seconds * 1000);
        return isNaN(d.getTime()) ? null : d;
      }
      if (typeof value._seconds === 'number') {
        const d = new Date(value._seconds * 1000);
        return isNaN(d.getTime()) ? null : d;
      }
    }
    return null;
  };

  const formatDate = (dateValue) => {
    const d = toDateSafe(dateValue);
    if (!d) return 'N/A';
    return d.toLocaleString();
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="card p-8">
          <h2 className="text-2xl font-semibold text-text-main mb-3">Sign In Required</h2>
          <p className="text-text-subtle mb-6">Please sign in to view analysis results.</p>
          <Link to="/" className="btn-primary">Sign In</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return <Loading size="large" message="Loading analysis..." className="min-h-64" />;
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="card p-8">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text-main mb-3">Error Loading Analysis</h2>
          <p className="text-text-subtle mb-6">{error}</p>
          <Link to="/analysis" className="btn-primary">Back to History</Link>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="card p-8">
          <h2 className="text-xl font-semibold text-text-main mb-3">Analysis Not Found</h2>
          <p className="text-text-subtle mb-6">The requested analysis could not be found.</p>
          <Link to="/analysis" className="btn-primary">Back to History</Link>
        </div>
      </div>
    );
  }

  // Processing/Pending State
  if (analysis.status === 'processing' || analysis.status === 'pending') {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-brand-light rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ClockIcon className="h-8 w-8 text-brand animate-pulse" />
          </div>
          <h2 className="text-2xl font-semibold text-text-main mb-3">Analysis in Progress</h2>
          <p className="text-text-subtle mb-6">
            We're scanning <span className="font-medium text-text-main">{analysis.url}</span> for accessibility issues.
            This may take a few moments.
          </p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (analysis.status === 'error' || analysis.status === 'failed' || analysis.status === 'cancelled') {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Link to="/analysis" className="inline-flex items-center gap-2 text-text-subtle hover:text-text-main mb-6">
          <ArrowLeftIcon className="h-4 w-4" />
          Back to History
        </Link>
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-semibold text-text-main mb-3">
            {analysis.status === 'cancelled' ? 'Analysis Cancelled' : 'Analysis Failed'}
          </h2>
          <p className="text-text-subtle mb-4">
            {analysis.metadata?.userFriendlyMessage || 'We encountered an error while analyzing this URL.'}
          </p>
          <p className="text-sm text-text-muted mb-6">{analysis.url}</p>
          <Link to="/home" className="btn-primary">Try Another URL</Link>
        </div>
      </div>
    );
  }

  // Completed State - Show Results
  const violations = result?.axeCoreResults?.violations || result?.scanResults?.violations || [];
  const passes = result?.axeCoreResults?.passes || result?.scanResults?.passes || [];
  const complianceScore =
    result?.summary?.complianceScore ??
    result?.complianceScore ??
    analysis?.complianceScore ??
    0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/analysis" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeftIcon className="h-5 w-5 text-text-subtle" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-text-main">Analysis Results</h1>
            <div className="flex items-center gap-2 mt-1">
              <GlobeAltIcon className="h-4 w-4 text-text-muted" />
              <a href={analysis.url} target="_blank" rel="noopener noreferrer" 
                 className="text-sm text-brand hover:underline truncate max-w-md">
                {analysis.url}
              </a>
            </div>
          </div>
        </div>
        <div className="text-sm text-text-muted">
          {formatDate(analysis.createdAt || analysis.requestTimestamp)}
        </div>
      </div>

      {/* Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`card p-6 border-2 ${getScoreBg(complianceScore)}`}>
          <p className="text-sm font-medium text-text-subtle mb-1">Compliance Score</p>
          <p className={`text-4xl font-bold ${getScoreColor(complianceScore)}`}>
            {Math.round(complianceScore)}%
          </p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-medium text-text-subtle mb-1">Issues Found</p>
          <p className="text-4xl font-bold text-red-600">{violations.length}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-medium text-text-subtle mb-1">Tests Passed</p>
          <p className="text-4xl font-bold text-emerald-600">{passes.length}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-medium text-text-subtle mb-1">Total Elements</p>
          <p className="text-4xl font-bold text-text-main">
            {violations.reduce((sum, v) => sum + (v.nodes?.length || 0), 0)}
          </p>
        </div>
      </div>

      {/* Violations List */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-border-light">
          <h2 className="text-lg font-semibold text-text-main">
            Accessibility Issues ({violations.length})
          </h2>
        </div>

        {violations.length > 0 ? (
          <div className="divide-y divide-border-light">
            {violations.map((violation, index) => (
              <div key={index} className="px-6 py-4">
                <div 
                  className="flex items-start justify-between cursor-pointer"
                  onClick={() => toggleViolation(index)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-lg border ${getImpactColor(violation.impact)}`}>
                        {violation.impact}
                      </span>
                      <span className="text-xs text-text-muted">
                        {violation.nodes?.length || 0} element(s)
                      </span>
                    </div>
                    <h3 className="font-medium text-text-main">{violation.id}</h3>
                    <p className="text-sm text-text-subtle mt-1">{violation.description}</p>
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    {expandedViolations[index] ? (
                      <ChevronUpIcon className="h-5 w-5 text-text-subtle" />
                    ) : (
                      <ChevronDownIcon className="h-5 w-5 text-text-subtle" />
                    )}
                  </button>
                </div>

                {expandedViolations[index] && (
                  <div className="mt-4 space-y-4">
                    {/* Help text */}
                    {violation.help && (
                      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl">
                        <InformationCircleIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-700">{violation.help}</p>
                      </div>
                    )}

                    {/* Affected elements */}
                    {violation.nodes?.slice(0, 5).map((node, nodeIndex) => (
                      <div key={nodeIndex} className="p-3 bg-gray-50 rounded-xl">
                        <p className="text-xs font-medium text-text-subtle mb-2">Element {nodeIndex + 1}</p>
                        <code className="text-xs text-text-main break-all block p-2 bg-white rounded-lg border border-border-light">
                          {node.html || node.target?.join(' > ')}
                        </code>
                        {node.failureSummary && (
                          <p className="text-xs text-text-subtle mt-2">{node.failureSummary}</p>
                        )}
                      </div>
                    ))}
                    {violation.nodes?.length > 5 && (
                      <p className="text-xs text-text-muted">
                        ...and {violation.nodes.length - 5} more elements
                      </p>
                    )}

                    {/* AI Fix Button */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateAIFix(index);
                        }}
                        disabled={generatingFix[index]}
                        className="btn-secondary text-sm flex items-center gap-2"
                      >
                        <SparklesIcon className="h-4 w-4" />
                        {generatingFix[index] ? 'Generating...' : 'Get AI Fix'}
                      </button>
                    </div>

                    {/* AI Fix Result */}
                    {aiFixes[index] && (
                      <div className="p-4 bg-brand-light rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-brand">AI-Generated Fix</p>
                          <button
                            onClick={() => copyToClipboard(JSON.stringify(aiFixes[index].aiFix ?? aiFixes[index], null, 2))}
                            className="p-1.5 hover:bg-white/50 rounded-lg transition-colors"
                          >
                            <ClipboardDocumentIcon className="h-4 w-4 text-brand" />
                          </button>
                        </div>
                        <pre className="text-xs text-text-main whitespace-pre-wrap bg-white p-3 rounded-lg">
                          {JSON.stringify(aiFixes[index].aiFix ?? aiFixes[index], null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <CheckCircleIcon className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-main mb-2">No Issues Found!</h3>
            <p className="text-text-subtle">
              Great job! This page passed all accessibility checks.
            </p>
          </div>
        )}
      </div>

      {/* Passed Tests Summary */}
      {passes.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-text-main mb-4">
            Passed Tests ({passes.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {passes.slice(0, 12).map((pass, index) => (
              <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50">
                <CheckCircleIcon className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-emerald-700 truncate">{pass.id || pass}</span>
              </div>
            ))}
          </div>
          {passes.length > 12 && (
            <p className="text-sm text-text-muted mt-3">
              ...and {passes.length - 12} more passed tests
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Analysis;

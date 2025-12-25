import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DocumentMagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { analysisService } from '../../services/api/analysisService';
import { useAuth } from '../../contexts/AuthContext';
import Loading from '../../components/common/Loading';

const AnalysisHistory = () => {
  const { isAuthenticated } = useAuth();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    if (isAuthenticated) {
      loadAnalyses();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, currentPage]);

  const loadAnalyses = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await analysisService.getUserAnalysisRequests(currentPage, itemsPerPage);
      
      if (response.data && response.data.data) {
        setAnalyses(response.data.data.analyses || []);
        setTotalCount(response.data.data.total || 0);
        setTotalPages(Math.ceil((response.data.data.total || 0) / itemsPerPage));
      } else {
        setAnalyses([]);
        setTotalCount(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Error loading analyses:', err);
      setError('Failed to load analysis history. Please try again.');
      setAnalyses([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusDot = (status) => {
    switch (status) {
      case 'completed':
        return <div className="w-2 h-2 rounded-full bg-emerald-500" />;
      case 'failed':
      case 'error':
        return <div className="w-2 h-2 rounded-full bg-red-500" />;
      case 'processing':
        return <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />;
      default:
        return <div className="w-2 h-2 rounded-full bg-gray-400" />;
    }
  };

  const getComplianceColor = (score) => {
    if (score >= 90) return 'bg-emerald-50 text-emerald-600';
    if (score >= 70) return 'bg-amber-50 text-amber-600';
    return 'bg-red-50 text-red-500';
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
    const date = toDateSafe(dateValue);
    if (!date) {
      return {
        date: 'N/A',
        time: ''
      };
    }
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="card p-8">
          <div className="w-16 h-16 bg-brand-light rounded-2xl flex items-center justify-center mx-auto mb-6">
            <DocumentMagnifyingGlassIcon className="h-8 w-8 text-brand" />
          </div>
          <h2 className="text-2xl font-semibold text-text-main mb-3">Sign In Required</h2>
          <p className="text-text-subtle mb-6">
            Please sign in to view your analysis history and track your accessibility testing progress.
          </p>
          <Link to="/" className="btn-primary inline-flex items-center gap-2">
            Sign In
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <Loading
        size="large"
        message="Loading your analysis history..."
        className="min-h-64"
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-main">Analysis History</h1>
          <p className="text-text-subtle mt-1">
            View and manage all your accessibility analyses
          </p>
        </div>
        <Link to="/home" className="btn-primary flex items-center gap-2">
          <span>New Analysis</span>
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Analysis List */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-border-light">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-main">
              Your Analyses ({totalCount})
            </h3>
            {totalCount > 0 && (
              <p className="text-sm text-text-muted">
                Page {currentPage} of {totalPages}
              </p>
            )}
          </div>
        </div>

        <div className="divide-y divide-border-light">
          {analyses.length > 0 ? (
            analyses.map((analysis, index) => {
              const { date, time } = formatDate(analysis.createdAt || analysis.requestTimestamp);
              return (
                <div key={analysis.id || index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        {getStatusDot(analysis.status)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-main truncate">
                            {analysis.url}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-text-muted">
                              {date} at {time}
                            </p>
                            {analysis.status === 'processing' && (
                              <span className="text-xs text-brand">In progress...</span>
                            )}
                            {(analysis.status === 'failed' || analysis.status === 'error') && (
                              <span className="text-xs text-red-500">Failed</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {analysis.status === 'completed' && analysis.complianceScore !== undefined && (
                        <span className={`inline-flex items-center px-3 py-1 rounded-pill text-xs font-medium ${getComplianceColor(analysis.complianceScore)}`}>
                          {Math.round(analysis.complianceScore)}%
                        </span>
                      )}
                      <Link
                        to={`/analysis/${analysis.id}`}
                        className="text-brand hover:text-brand-hover text-sm font-medium"
                      >
                        {analysis.status === 'completed' ? 'View →' : 'Status →'}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-6 py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <DocumentMagnifyingGlassIcon className="h-8 w-8 text-text-subtle" />
              </div>
              <h3 className="text-lg font-semibold text-text-main mb-2">No Analyses Yet</h3>
              <p className="text-text-subtle mb-6">
                You haven't run any accessibility analyses yet. Start by analyzing your first website!
              </p>
              <Link to="/home" className="btn-primary">
                Start Your First Analysis
              </Link>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border-light bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-text-muted">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl bg-white border border-border text-text-subtle hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
                
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  const page = i + 1;
                  const isCurrentPage = page === currentPage;
                  
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                        isCurrentPage
                          ? 'bg-gray-900 text-white'
                          : 'bg-white text-text-main border border-border hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl bg-white border border-border text-text-subtle hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisHistory;

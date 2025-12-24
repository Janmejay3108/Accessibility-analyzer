import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DocumentMagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'processing':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getComplianceColor = (score) => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
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
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
          <DocumentMagnifyingGlassIcon className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-blue-900 mb-4">Sign In Required</h2>
          <p className="text-blue-800 mb-6">
            Please sign in to view your analysis history and track your accessibility testing progress.
          </p>
          <Link
            to="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Sign In
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analysis History</h1>
          <p className="text-gray-600">
            View and manage all your accessibility analyses
          </p>
        </div>
        <Link
          to="/"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          New Analysis
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Analysis List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Your Analyses ({totalCount})
            </h3>
            {totalCount > 0 && (
              <p className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </p>
            )}
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {analyses.length > 0 ? (
            analyses.map((analysis, index) => {
              const { date, time } = formatDate(analysis.createdAt);
              return (
                <div key={analysis.id || index} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(analysis.status)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {analysis.url}
                          </p>
                          <p className="text-sm text-gray-500">
                            {date} at {time}
                          </p>
                          {analysis.status === 'processing' && (
                            <p className="text-xs text-yellow-600 mt-1">
                              Analysis in progress...
                            </p>
                          )}
                          {analysis.status === 'error' && (
                            <p className="text-xs text-red-600 mt-1">
                              Analysis failed
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {analysis.status === 'completed' && analysis.complianceScore !== undefined && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getComplianceColor(analysis.complianceScore)}`}>
                          {Math.round(analysis.complianceScore)}% compliant
                        </span>
                      )}
                      <Link
                        to={`/analysis/${analysis.id}`}
                        className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                      >
                        {analysis.status === 'completed' ? 'View Report' : 'View Status'}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-6 py-12 text-center">
              <DocumentMagnifyingGlassIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Analyses Yet</h3>
              <p className="text-gray-600 mb-6">
                You haven't run any accessibility analyses yet. Start by analyzing your first website!
              </p>
              <Link
                to="/"
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Start Your First Analysis
              </Link>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
                
                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  const isCurrentPage = page === currentPage;
                  
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        isCurrentPage
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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

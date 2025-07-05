import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ChartBarIcon,
  DocumentMagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { analysisService } from '../../services/api/analysisService';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard = () => {
  const { isAuthenticated } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, [isAuthenticated]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      if (isAuthenticated) {
        // Load analytics data for authenticated users
        const analyticsResponse = await analysisService.getDashboardAnalytics();
        setAnalytics(analyticsResponse.data);

        // Load user's recent analyses (using results for consistency with analytics)
        if (analyticsResponse.data && analyticsResponse.data.recentAnalyses) {
          setRecentAnalyses(analyticsResponse.data.recentAnalyses.slice(0, 5));
        } else {
          setRecentAnalyses([]);
        }
      } else {
        // For unauthenticated users, show public recent analyses
        try {
          const publicAnalysesResponse = await analysisService.getRecentPublicAnalyses(5);
          setRecentAnalyses(publicAnalysesResponse.data || []);

          // Set basic analytics for unauthenticated users
          setAnalytics({
            totalAnalyses: 0,
            averageComplianceScore: 0,
            issueDistribution: { critical: 0, serious: 0, moderate: 0, minor: 0 },
            recentAnalyses: publicAnalysesResponse.data || []
          });
        } catch (publicErr) {
          console.error('Error loading public analyses:', publicErr);
          // Set empty state if public analyses also fail
          setRecentAnalyses([]);
          setAnalytics({
            totalAnalyses: 0,
            averageComplianceScore: 0,
            issueDistribution: { critical: 0, serious: 0, moderate: 0, minor: 0 },
            recentAnalyses: []
          });
        }
      }

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      if (err.response?.status === 401) {
        setError('Please sign in to view your personal analytics.');
      } else {
        setError('Failed to load dashboard data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getComplianceColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <ChartBarIcon className="h-8 w-8 text-blue-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            {isAuthenticated
              ? "Overview of your accessibility analysis activity"
              : "Overview of recent accessibility analysis activity"}
          </p>
        </div>
        <Link
          to="/"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          New Analysis
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {!isAuthenticated && !error && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <CheckCircleIcon className="h-5 w-5 text-blue-400" />
            <div className="ml-3">
              <p className="text-sm text-blue-800">
                <Link to="/login" className="font-medium underline hover:text-blue-900">
                  Sign in
                </Link> to view your personal analytics and track your accessibility analysis history.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentMagnifyingGlassIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Analyses</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analytics.totalAnalyses || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getComplianceColor(analytics.averageComplianceScore || 0)}`}>
                  <span className="text-sm font-bold">
                    {Math.round(analytics.averageComplianceScore || 0)}%
                  </span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg. Compliance</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {Math.round(analytics.averageComplianceScore || 0)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Issues</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analytics.totalViolations || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg. Scan Time</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analytics.averageScanTime ? `${Math.round(analytics.averageScanTime / 1000)}s` : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Analyses */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Your Recent Analyses</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentAnalyses.length > 0 ? (
            recentAnalyses.map((analysis, index) => (
              <div key={index} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(analysis.status)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {analysis.url}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(analysis.createdAt).toLocaleDateString()} at{' '}
                          {new Date(analysis.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {analysis.summary?.complianceScore !== undefined && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getComplianceColor(analysis.summary.complianceScore)}`}>
                        {Math.round(analysis.summary.complianceScore)}% compliant
                      </span>
                    )}
                    <Link
                      to={`/analysis/${analysis.analysisRequestId || analysis.id}`}
                      className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                    >
                      View Report
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center">
              <DocumentMagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Analyses</h3>
              <p className="text-gray-600 mb-4">
                Start analyzing websites to see recent activity here.
              </p>
              <Link
                to="/"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Start Analysis
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* WCAG Compliance Breakdown */}
      {analytics && analytics.wcagBreakdown && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">WCAG Compliance Breakdown</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(analytics.wcagBreakdown).map(([level, data]) => (
                <div key={level} className="text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 ${getComplianceColor(data.averageScore || 0)}`}>
                    <span className="text-lg font-bold">
                      {Math.round(data.averageScore || 0)}%
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">WCAG {level}</p>
                  <p className="text-xs text-gray-500">{data.count || 0} analyses</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <DocumentMagnifyingGlassIcon className="h-8 w-8 text-blue-600 mr-4" />
              <div>
                <p className="font-medium text-gray-900">New Analysis</p>
                <p className="text-sm text-gray-600">Analyze a website for accessibility issues</p>
              </div>
            </Link>
            
            <div className="flex items-center p-4 border border-gray-200 rounded-lg opacity-50">
              <ChartBarIcon className="h-8 w-8 text-gray-400 mr-4" />
              <div>
                <p className="font-medium text-gray-500">Historical Reports</p>
                <p className="text-sm text-gray-400">View trends and historical data (Coming Soon)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

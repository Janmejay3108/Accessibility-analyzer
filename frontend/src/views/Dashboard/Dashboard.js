import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ChartBarIcon,
  DocumentMagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { analysisService } from '../../services/api/analysisService';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard = () => {
  const { isAuthenticated } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  useEffect(() => {
    loadDashboardData();
  }, [isAuthenticated]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      if (isAuthenticated) {
        const analyticsResponse = await analysisService.getDashboardAnalytics();
        setAnalytics(analyticsResponse.data);

        if (analyticsResponse.data && analyticsResponse.data.recentAnalyses) {
          setRecentAnalyses(analyticsResponse.data.recentAnalyses.slice(0, 5));
        } else {
          setRecentAnalyses([]);
        }
      } else {
        try {
          const publicAnalysesResponse = await analysisService.getRecentPublicAnalyses(5);
          setRecentAnalyses(publicAnalysesResponse.data || []);
          setAnalytics({
            totalAnalyses: 0,
            averageComplianceScore: 0,
            issueDistribution: { critical: 0, serious: 0, moderate: 0, minor: 0 },
            recentAnalyses: publicAnalysesResponse.data || []
          });
        } catch (publicErr) {
          console.error('Error loading public analyses:', publicErr);
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
    if (score >= 90) return 'text-emerald-600 bg-emerald-50';
    if (score >= 70) return 'text-amber-600 bg-amber-50';
    return 'text-red-500 bg-red-50';
  };

  const getStatusDot = (status) => {
    switch (status) {
      case 'completed':
        return <div className="w-2 h-2 rounded-full bg-emerald-500" />;
      case 'processing':
        return <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />;
      case 'failed':
      case 'error':
        return <div className="w-2 h-2 rounded-full bg-red-500" />;
      default:
        return <div className="w-2 h-2 rounded-full bg-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <ChartBarIcon className="h-6 w-6 text-text-subtle" />
          </div>
          <p className="text-text-subtle">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-main">Dashboard</h1>
          <p className="text-text-subtle mt-1">
            {isAuthenticated
              ? "Overview of your accessibility analysis activity"
              : "Overview of recent accessibility analysis activity"}
          </p>
        </div>
        <Link to="/home" className="btn-primary flex items-center gap-2">
          <span>New Analysis</span>
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {!isAuthenticated && !error && (
        <div className="bg-brand-light border border-brand/20 rounded-2xl p-4">
          <p className="text-sm text-brand">
            <Link to="/" className="font-medium underline">Sign in</Link> to view your personal analytics and track your accessibility analysis history.
          </p>
        </div>
      )}

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-subtle mb-1">Total Analyses</p>
                <p className="text-3xl font-semibold text-text-main">
                  {analytics.totalAnalyses || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-brand-light rounded-xl flex items-center justify-center">
                <DocumentMagnifyingGlassIcon className="h-5 w-5 text-brand" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-subtle mb-1">Avg. Compliance</p>
                <p className="text-3xl font-semibold text-text-main">
                  {Math.round(analytics.averageComplianceScore || 0)}%
                </p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getComplianceColor(analytics.averageComplianceScore || 0)}`}>
                <CheckCircleIcon className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-subtle mb-1">Total Issues</p>
                <p className="text-3xl font-semibold text-text-main">
                  {analytics.totalViolations || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-subtle mb-1">Avg. Scan Time</p>
                <p className="text-3xl font-semibold text-text-main">
                  {analytics.averageScanTime ? `${Math.round(analytics.averageScanTime / 1000)}s` : 'N/A'}
                </p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <ClockIcon className="h-5 w-5 text-text-subtle" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Analyses */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-border-light">
          <h3 className="text-lg font-semibold text-text-main">Recent Analyses</h3>
        </div>
        <div className="divide-y divide-border-light">
          {recentAnalyses.length > 0 ? (
            recentAnalyses.map((analysis, index) => (
              <div key={index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      {getStatusDot(analysis.status)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-main truncate">
                          {analysis.url}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {(() => {
                            const d = toDateSafe(analysis.createdAt || analysis.completedTimestamp);
                            if (!d) return 'N/A';
                            return `${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {analysis.summary?.complianceScore !== undefined && (
                      <span className={`inline-flex items-center px-3 py-1 rounded-pill text-xs font-medium ${getComplianceColor(analysis.summary.complianceScore)}`}>
                        {Math.round(analysis.summary.complianceScore)}%
                      </span>
                    )}
                    <Link
                      to={`/analysis/${analysis.analysisRequestId || analysis.id}`}
                      className="text-brand hover:text-brand-hover text-sm font-medium"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <DocumentMagnifyingGlassIcon className="h-7 w-7 text-text-subtle" />
              </div>
              <h3 className="text-lg font-semibold text-text-main mb-2">No Recent Analyses</h3>
              <p className="text-text-subtle mb-6">
                Start analyzing websites to see recent activity here.
              </p>
              <Link to="/home" className="btn-primary">
                Start Analysis
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* WCAG Compliance Breakdown */}
      {analytics && analytics.wcagBreakdown && (
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-border-light">
            <h3 className="text-lg font-semibold text-text-main">WCAG Compliance Breakdown</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {Object.entries(analytics.wcagBreakdown).map(([level, data]) => (
                <div key={level} className="text-center">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 ${getComplianceColor(data.averageScore || 0)}`}>
                    <span className="text-xl font-semibold">
                      {Math.round(data.averageScore || 0)}%
                    </span>
                  </div>
                  <p className="text-sm font-medium text-text-main">WCAG {level}</p>
                  <p className="text-xs text-text-muted">{data.count || 0} analyses</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-border-light">
          <h3 className="text-lg font-semibold text-text-main">Quick Actions</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/home"
              className="flex items-center p-5 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors group"
            >
              <div className="w-12 h-12 bg-brand-light rounded-xl flex items-center justify-center mr-4 group-hover:scale-105 transition-transform">
                <DocumentMagnifyingGlassIcon className="h-6 w-6 text-brand" />
              </div>
              <div>
                <p className="font-medium text-text-main">New Analysis</p>
                <p className="text-sm text-text-subtle">Analyze a website for accessibility issues</p>
              </div>
            </Link>
            
            <div className="flex items-center p-5 bg-gray-50 rounded-2xl opacity-60">
              <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mr-4">
                <ChartBarIcon className="h-6 w-6 text-text-muted" />
              </div>
              <div>
                <p className="font-medium text-text-subtle">Historical Reports</p>
                <p className="text-sm text-text-muted">View trends and historical data (Coming Soon)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

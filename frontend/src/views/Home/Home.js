import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DocumentMagnifyingGlassIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import UrlInputForm from '../../components/analysis/UrlInputForm';

const Home = () => {
  const navigate = useNavigate();
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleAnalysisSubmit = async (analysisId) => {
    // Navigate to the analysis page to show results
    navigate(`/analysis/${analysisId}`);
  };

  const features = [
    {
      icon: DocumentMagnifyingGlassIcon,
      title: 'Comprehensive Scanning',
      description: 'Automated WCAG 2.1 AA/AAA compliance checking using axe-core engine'
    },
    {
      icon: CheckCircleIcon,
      title: 'Detailed Reports',
      description: 'In-depth violation analysis with actionable remediation recommendations'
    },
    {
      icon: ExclamationTriangleIcon,
      title: 'Real-time Analysis',
      description: 'Live scanning with progress tracking and immediate feedback'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
          <span className="block">Web Accessibility</span>
          <span className="block text-blue-600">Analyzer</span>
        </h1>
        <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          Comprehensive web accessibility analysis and reporting. Ensure your website meets WCAG guidelines and provides an inclusive experience for all users.
        </p>
      </div>

      {/* URL Input Form */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-center">
            Analyze Your Website
          </h2>
          <p className="text-gray-600 text-center mb-6">
            Enter a URL to start a comprehensive accessibility analysis
          </p>
          <UrlInputForm onSubmit={handleAnalysisSubmit} />
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-4xl mx-auto">
        <h3 className="text-2xl font-semibold text-gray-900 text-center mb-8">
          Why Choose Our Analyzer?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="flex justify-center mb-4">
                <feature.icon className="h-12 w-12 text-blue-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h4>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Analyses Section */}
      {recentAnalyses.length > 0 && (
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6">
            Recent Public Analyses
          </h3>
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-4">
                {recentAnalyses.map((analysis, index) => (
                  <div key={index} className="flex items-center justify-between border-b border-gray-200 pb-4 last:border-b-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {analysis.url}
                      </p>
                      <p className="text-sm text-gray-500">
                        Analyzed {new Date(analysis.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        analysis.complianceScore >= 90 
                          ? 'bg-green-100 text-green-800'
                          : analysis.complianceScore >= 70
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {analysis.complianceScore}% compliant
                      </span>
                      <button
                        onClick={() => navigate(`/analysis/${analysis.id}`)}
                        className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                      >
                        View Report
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Getting Started Section */}
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Get Started in Seconds
          </h3>
          <p className="text-blue-800 mb-4">
            Simply enter your website URL above and click "Analyze" to receive a comprehensive accessibility report with actionable recommendations.
          </p>
          <div className="text-sm text-blue-700">
            <p>✓ No registration required for basic analysis</p>
            <p>✓ Detailed WCAG 2.1 compliance checking</p>
            <p>✓ Instant results with remediation guidance</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

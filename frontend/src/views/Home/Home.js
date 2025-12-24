import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlusIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import UrlInputForm from '../../components/analysis/UrlInputForm';
import Footer from '../../components/common/Footer';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleAnalysisSubmit = async (analysisId) => {
    // Navigate to the analysis page to show results
    navigate(`/analysis/${analysisId}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* Hero Section */}
      <div className="text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Web Accessibility Analyzer
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Comprehensive web accessibility analysis and reporting.
          Ensure your website meets WCAG guidelines.
        </p>

        {/* URL Input Form */}
        <div className="w-full max-w-2xl mx-auto mb-12">
          <UrlInputForm onSubmit={handleAnalysisSubmit} />
        </div>

        {/* Authentication CTA for non-authenticated users */}
        {!isAuthenticated && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-900">
                Sign In Required
              </h3>
            </div>
            <p className="text-blue-700 mb-4 text-center">
              Please sign in with Google to run accessibility scans.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/"
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
              >
                <UserPlusIcon className="h-5 w-5 mr-2" />
                Sign In with Google
              </Link>
            </div>
          </div>
        )}

        {/* Footer */}
        <Footer variant="home" />
      </div>
    </div>
  );
};

export default Home;

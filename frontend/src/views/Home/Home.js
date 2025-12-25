import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import UrlInputForm from '../../components/analysis/UrlInputForm';
import MakerBadge from '../../components/common/MakerBadge';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleAnalysisSubmit = async (analysisId) => {
    navigate(`/analysis/${analysisId}`);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Main Content - Mission Control Layout */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Brand Mark */}
        <div className="mb-8 animate-fade-in">
          <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center shadow-medium">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Hero Typography - Thin, elegant */}
        <div className="text-center max-w-3xl mx-auto mb-10 animate-fade-in">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-text-main tracking-tight mb-4">
            Analyze Accessibility
          </h1>
          <p className="text-lg md:text-xl text-text-subtle font-light max-w-xl mx-auto">
            Comprehensive WCAG analysis for modern web experiences
          </p>
        </div>

        {/* The Omnibar */}
        <div className="w-full animate-slide-up" style={{ animationDelay: '100ms' }}>
          <UrlInputForm onSubmit={handleAnalysisSubmit} />
        </div>

        {/* Quick Stats / Trust Indicators */}
        {isAuthenticated && (
          <div className="mt-12 flex items-center gap-8 text-sm text-text-muted animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span>WCAG 2.1 Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-brand rounded-full" />
              <span>AI-Powered Fixes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full" />
              <span>Instant Reports</span>
            </div>
          </div>
        )}
      </div>

      {/* Maker Badge */}
      <MakerBadge />
    </div>
  );
};

export default Home;

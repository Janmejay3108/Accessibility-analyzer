import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import MakerBadge from '../../components/common/MakerBadge';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithGoogle, error: authError, loading: authLoading, isAuthenticated } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/home';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleGoogleAuth = async () => {
    try {
      setError('');
      await signInWithGoogle();
      localStorage.setItem('lastAuthMethod', 'google');
      const from = location.state?.from?.pathname || '/home';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Google authentication failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-surface-subtle flex items-center justify-center p-4 relative">
      {/* Subtle particle background */}
      <div className="login-particles" />

      {/* Main Content Card */}
      <div className="w-full max-w-md relative z-10">
        {/* Brand Mark */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-medium">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-light text-text-main tracking-tight mb-2">
            Accessibility Analyzer
          </h1>
          <p className="text-text-subtle">
            Sign in to analyze your websites
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl border border-border-light p-8 shadow-soft animate-fade-in-up animation-delay-100">
          <h2 className="text-xl font-semibold text-text-main mb-6 text-center">
            Welcome back
          </h2>

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleAuth}
            disabled={authLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 
                       bg-white border border-border rounded-2xl
                       text-text-main font-medium
                       hover:bg-gray-50 hover:border-gray-300 hover:shadow-soft
                       focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200 group"
          >
            {authLoading ? (
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            <span>{authLoading ? 'Signing in...' : 'Continue with Google'}</span>
          </button>

          {/* Error Display */}
          {(error || authError) && (
            <div className="mt-4 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl">
              <p className="text-sm text-red-600 text-center">{error || authError}</p>
            </div>
          )}

          {/* Info */}
          <p className="mt-6 text-center text-sm text-text-muted">
            By signing in, you agree to our terms of service
          </p>
        </div>

        {/* Features Preview */}
        <div className="mt-8 grid grid-cols-3 gap-4 animate-fade-in-up animation-delay-200">
          <div className="text-center">
            <div className="w-10 h-10 bg-white rounded-xl border border-border-light flex items-center justify-center mx-auto mb-2 shadow-soft">
              <svg className="w-5 h-5 text-text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xs text-text-muted">WCAG 2.1</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-white rounded-xl border border-border-light flex items-center justify-center mx-auto mb-2 shadow-soft">
              <svg className="w-5 h-5 text-text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-xs text-text-muted">AI Fixes</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-white rounded-xl border border-border-light flex items-center justify-center mx-auto mb-2 shadow-soft">
              <svg className="w-5 h-5 text-text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-xs text-text-muted">Reports</p>
          </div>
        </div>

        {/* Maker Badge */}
        <MakerBadge />
      </div>
    </div>
  );
};

export default Login;

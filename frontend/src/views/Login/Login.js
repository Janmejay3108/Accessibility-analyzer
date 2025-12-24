import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import BrandLogo from '../../components/common/BrandLogo';
import Footer from '../../components/common/Footer';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithGoogle, error: authError, loading: authLoading, isAuthenticated } = useAuth();
  const [error, setError] = useState('');
  const [lastUsedMethod, setLastUsedMethod] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/home';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Load last used method from localStorage
  useEffect(() => {
    const lastMethod = localStorage.getItem('lastAuthMethod');
    if (lastMethod) {
      setLastUsedMethod(lastMethod);
    }
  }, []);

  const handleGoogleAuth = async () => {
    try {
      setError('');
      await signInWithGoogle();
      
      // Store last used method
      localStorage.setItem('lastAuthMethod', 'google');
      
      // Redirect to intended page or home
      const from = location.state?.from?.pathname || '/home';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Google authentication failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex login-container">
      {/* Left Panel - Authentication */}
      <div className="flex-1 max-w-md lg:max-w-lg xl:max-w-xl bg-gray-900 flex flex-col justify-center px-8 py-12 login-left-panel relative pb-24">
        {/* Brand Logo */}
        <div className="mb-8">
          <BrandLogo />
        </div>

        {/* Main Content */}
        <>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Log in
            </h1>
            <p className="text-gray-400">
              Sign in with Google to continue.
            </p>
          </div>

        {/* Google Sign In */}
        <button
          onClick={handleGoogleAuth}
          disabled={authLoading}
          className="w-full flex items-center justify-center px-4 py-3 border border-gray-600 rounded-lg text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors duration-200 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
          {lastUsedMethod === 'google' && (
            <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded">
              Last used
            </span>
          )}
        </button>

        {/* Error Display */}
        {(error || authError) && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-3 mb-6">
            <p className="text-sm text-red-200">{error || authError}</p>
          </div>
        )}

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-900 text-gray-400">Google sign-in required</span>
          </div>
        </div>

        {/* Email/Password Form */}
        {null}

        {/* Footer */}
        <Footer variant="login" />
        </>
      </div>

      {/* Mobile Continue Without Login */}
      {null}

      {/* Desktop Right Panel - Continue Without Login */}
      <div className="hidden lg:flex flex-1 gradient-background floating-elements relative overflow-hidden login-right-panel">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center text-center px-12 py-16">
          <div className="max-w-md">
            <h2 className="text-3xl font-bold text-white mb-6">
              Sign In Required
            </h2>
            
            {/* Warning Message */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 mb-8">
              <div className="flex items-start space-x-3">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-300 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-white font-medium mb-2">
                    Demo Mode
                  </p>
                  <p className="text-white/90 text-sm">
                    Please sign in with Google to run accessibility scans.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

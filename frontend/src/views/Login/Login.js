import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import BrandLogo from '../../components/common/BrandLogo';
import ForgotPassword from '../../components/auth/ForgotPassword';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, signInWithGoogle, error: authError, loading: authLoading, isAuthenticated } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  const [error, setError] = useState('');
  const [lastUsedMethod, setLastUsedMethod] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (!isLogin) {
        // Registration validation
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters long');
          return;
        }
        await signUp(formData.email, formData.password, formData.name);
      } else {
        await signIn(formData.email, formData.password);
      }

      // Store last used method
      localStorage.setItem('lastAuthMethod', 'email');
      
      // Redirect to intended page or home
      const from = location.state?.from?.pathname || '/home';
      navigate(from, { replace: true });

    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    }
  };

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

  const handleContinueWithoutLogin = () => {
    // Navigate to home page without authentication
    navigate('/home', { replace: true });
  };

  return (
    <div className="min-h-screen flex login-container">
      {/* Left Panel - Authentication */}
      <div className="flex-1 max-w-md lg:max-w-lg xl:max-w-xl bg-gray-900 flex flex-col justify-center px-8 py-12 login-left-panel">
        {/* Brand Logo */}
        <div className="mb-8">
          <BrandLogo />
        </div>

        {/* Main Content */}
        {showForgotPassword ? (
          <ForgotPassword onBack={() => setShowForgotPassword(false)} />
        ) : (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                {isLogin ? 'Log in' : 'Create account'}
              </h1>
              <p className="text-gray-400">
                {isLogin
                  ? 'Welcome back! Please sign in to continue.'
                  : 'Join us to save your analysis and track progress.'
                }
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

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-900 text-gray-400">OR</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4 login-form">
          {/* Error Display */}
          {(error || authError) && (
            <div className="bg-red-900/50 border border-red-500 rounded-lg p-3">
              <p className="text-sm text-red-200">{error || authError}</p>
            </div>
          )}

          {/* Name Field (Sign Up Only) */}
          {!isLogin && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required={!isLogin}
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 login-input"
                placeholder="Enter your full name"
              />
            </div>
          )}

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email
              {lastUsedMethod === 'email' && (
                <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded">
                  Last used
                </span>
              )}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
              placeholder="Enter your email"
            />
          </div>

          {/* Password Field */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              {isLogin && (
                <button
                  type="button"
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 pr-12"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors duration-200"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password Field (Sign Up Only) */}
          {!isLogin && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required={!isLogin}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                placeholder="Confirm your password"
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={authLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {authLoading ? 'Processing...' : (isLogin ? 'Log in' : 'Create account')}
          </button>
        </form>

        {/* Toggle Login/Signup */}
        <div className="mt-6 text-center">
          <span className="text-gray-400">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
          </span>
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setFormData({ email: '', password: '', confirmPassword: '', name: '' });
            }}
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200"
          >
            {isLogin ? 'Create your account' : 'Log in'}
          </button>
        </div>
        </>
        )}
      </div>

      {/* Mobile Continue Without Login */}
      <div className="lg:hidden bg-gray-800 px-8 py-6 border-t border-gray-700">
        <div className="text-center">
          <button
            onClick={handleContinueWithoutLogin}
            className="group bg-gray-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 flex items-center space-x-2 mx-auto"
          >
            <span>Continue as Guest</span>
            <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
          <p className="text-gray-400 text-sm mt-2">
            Limited features without login
          </p>
        </div>
      </div>

      {/* Desktop Right Panel - Continue Without Login */}
      <div className="hidden lg:flex flex-1 gradient-background floating-elements relative overflow-hidden login-right-panel">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center text-center px-12 py-16">
          <div className="max-w-md">
            <h2 className="text-3xl font-bold text-white mb-6">
              Continue Without Login
            </h2>
            
            {/* Warning Message */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 mb-8">
              <div className="flex items-start space-x-3">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-300 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-white font-medium mb-2">
                    Limited Experience
                  </p>
                  <p className="text-white/90 text-sm">
                    Your analysis and progress will not be saved if you proceed without logging in. 
                    You'll miss out on history tracking, saved reports, and personalized insights.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleContinueWithoutLogin}
              className="group bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-lg font-medium hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 flex items-center space-x-3 login-button"
            >
              <span>Continue as Guest</span>
              <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

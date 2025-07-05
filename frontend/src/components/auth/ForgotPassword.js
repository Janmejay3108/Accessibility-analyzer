import React, { useState } from 'react';
import { ArrowLeftIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

const ForgotPassword = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (error) => {
    switch (error.code) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/too-many-requests':
        return 'Too many requests. Please try again later.';
      default:
        return 'Failed to send reset email. Please try again.';
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <EnvelopeIcon className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">
          Check Your Email
        </h2>
        <p className="text-gray-300 mb-6">
          We've sent a password reset link to <strong>{email}</strong>
        </p>
        <p className="text-gray-400 text-sm mb-8">
          Didn't receive the email? Check your spam folder or try again.
        </p>
        <button
          onClick={onBack}
          className="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to login
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="inline-flex items-center text-gray-400 hover:text-gray-300 mb-6 transition-colors duration-200"
      >
        <ArrowLeftIcon className="h-4 w-4 mr-2" />
        Back to login
      </button>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          Reset Password
        </h2>
        <p className="text-gray-400">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-3">
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="reset-email" className="block text-sm font-medium text-gray-300 mb-2">
            Email Address
          </label>
          <input
            id="reset-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            placeholder="Enter your email address"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
    </div>
  );
};

export default ForgotPassword;

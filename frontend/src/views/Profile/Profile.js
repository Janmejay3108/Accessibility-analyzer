import React, { useState, useEffect } from 'react';
import {
  UserIcon,
  EnvelopeIcon,
  CalendarIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import Loading from '../../components/common/Loading';

const Profile = () => {
  const { user, updateProfile, displayName } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user?.displayName) {
      setEditedName(user.displayName);
    }
  }, [user]);

  const handleSave = async () => {
    if (!editedName.trim()) {
      setError('Name cannot be empty');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await updateProfile({ displayName: editedName.trim() });
      
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedName(user?.displayName || '');
    setIsEditing(false);
    setError('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <Loading
        size="large"
        message="Loading profile..."
        className="min-h-64"
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-main">Profile Settings</h1>
        <p className="text-text-subtle mt-1">
          Manage your account information and preferences
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
            <CheckIcon className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-sm text-emerald-700">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Profile Card */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-border-light">
          <h3 className="text-lg font-semibold text-text-main">Account Information</h3>
        </div>

        <div className="p-6 space-y-8">
          {/* Profile Picture */}
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="h-20 w-20 object-cover"
                />
              ) : (
                <UserIcon className="h-10 w-10 text-text-subtle" />
              )}
            </div>
            <div>
              <h4 className="text-xl font-semibold text-text-main">{displayName}</h4>
              <p className="text-sm text-text-muted mt-0.5">Profile Picture</p>
            </div>
          </div>

          {/* Display Name & Email */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-text-main mb-2">
                Display Name
              </label>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="input-field flex-1"
                      placeholder="Enter your name"
                      disabled={loading}
                    />
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                    >
                      <CheckIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={loading}
                      className="p-2.5 bg-gray-100 text-text-subtle rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                    <span className="text-sm text-text-main">
                      {user.displayName || 'Not set'}
                    </span>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1.5 text-brand hover:text-brand-hover rounded-lg hover:bg-brand-light transition-colors"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-main mb-2">
                Email Address
              </label>
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <EnvelopeIcon className="h-5 w-5 text-text-muted" />
                <span className="text-sm text-text-main flex-1">{user.email}</span>
                {user.emailVerified && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-pill text-xs font-medium bg-emerald-50 text-emerald-600">
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-text-main mb-2">
                Account Created
              </label>
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <CalendarIcon className="h-5 w-5 text-text-muted" />
                <span className="text-sm text-text-main">
                  {formatDate(user.metadata?.creationTime)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-main mb-2">
                Last Sign In
              </label>
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <CalendarIcon className="h-5 w-5 text-text-muted" />
                <span className="text-sm text-text-main">
                  {formatDate(user.metadata?.lastSignInTime)}
                </span>
              </div>
            </div>
          </div>

          {/* Provider Information */}
          <div>
            <label className="block text-sm font-medium text-text-main mb-3">
              Sign-in Methods
            </label>
            <div className="space-y-2">
              {user.providerData?.map((provider, index) => (
                <div key={index} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                  <div className="h-8 w-8 rounded-lg bg-white border border-border-light flex items-center justify-center">
                    {provider.providerId === 'google.com' ? (
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    ) : provider.providerId === 'password' ? (
                      <EnvelopeIcon className="h-4 w-4 text-text-subtle" />
                    ) : (
                      <UserIcon className="h-4 w-4 text-text-subtle" />
                    )}
                  </div>
                  <span className="text-sm text-text-main">
                    {provider.providerId === 'google.com' ? 'Google' : 
                     provider.providerId === 'password' ? 'Email/Password' : 
                     provider.providerId}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-border-light">
          <h3 className="text-lg font-semibold text-text-main">Account Actions</h3>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-5 py-4">
            <div>
              <h4 className="text-sm font-medium text-text-main">Email Verification</h4>
              <p className="text-sm text-text-subtle mt-0.5">
                {user.emailVerified 
                  ? 'Your email address has been verified' 
                  : 'Verify your email address to secure your account'
                }
              </p>
            </div>
            {user.emailVerified ? (
              <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
                <CheckIcon className="h-4 w-4 text-emerald-600" />
              </div>
            ) : (
              <button className="btn-primary text-sm">
                Send Verification
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

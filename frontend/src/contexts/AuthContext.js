import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/firebase/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
      
      // Store auth token in localStorage for API requests
      if (user) {
        user.getIdToken().then(token => {
          localStorage.setItem('authToken', token);
        });
      } else {
        localStorage.removeItem('authToken');
      }
    });

    return unsubscribe;
  }, []);

  const signUp = async (email, password, displayName) => {
    try {
      setError('');
      setLoading(true);
      const user = await authService.signUp(email, password, displayName);
      return user;
    } catch (error) {
      setError(getErrorMessage(error));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      setError('');
      setLoading(true);
      const user = await authService.signIn(email, password);
      return user;
    } catch (error) {
      setError(getErrorMessage(error));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError('');
      setLoading(true);
      const user = await authService.signInWithGoogle();
      return user;
    } catch (error) {
      setError(getErrorMessage(error));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError('');
      await authService.signOut();
    } catch (error) {
      setError(getErrorMessage(error));
      throw error;
    }
  };

  const updateProfile = async (updates) => {
    try {
      setError('');
      const updatedUser = await authService.updateUserProfile(updates);
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      setError(getErrorMessage(error));
      throw error;
    }
  };

  const getErrorMessage = (error) => {
    switch (error.code) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in popup was closed before completing.';
      case 'auth/cancelled-popup-request':
        return 'Only one popup request is allowed at a time.';
      case 'auth/popup-blocked':
        return 'Sign-in popup was blocked by the browser.';
      default:
        return error.message || 'An error occurred during authentication.';
    }
  };

  const value = {
    user,
    loading,
    error,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
    isAuthenticated: !!user,
    displayName: user?.displayName || user?.email || 'User'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from '../AuthContext';
import { authService } from '../../services/firebase/authService';

// Mock the auth service
jest.mock('../../services/firebase/authService');

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Test component that uses the auth context
const TestComponent = () => {
  const { 
    user, 
    loading, 
    error, 
    signIn, 
    signUp, 
    signInWithGoogle, 
    signOut, 
    isAuthenticated,
    displayName 
  } = useAuth();

  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="authenticated">{isAuthenticated.toString()}</div>
      <div data-testid="display-name">{displayName}</div>
      <div data-testid="error">{error}</div>
      <div data-testid="user-email">{user?.email || 'No user'}</div>
      
      <button onClick={() => signIn('test@example.com', 'password')}>
        Sign In
      </button>
      <button onClick={() => signUp('test@example.com', 'password', 'Test User')}>
        Sign Up
      </button>
      <button onClick={signInWithGoogle}>
        Sign In with Google
      </button>
      <button onClick={signOut}>
        Sign Out
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  const mockUser = {
    uid: 'test-uid',
    email: 'test@example.com',
    displayName: 'Test User',
    getIdToken: jest.fn().mockResolvedValue('mock-token')
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  const renderWithProvider = () => {
    return render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
  };

  test('provides initial state correctly', () => {
    // Mock no user initially
    authService.onAuthStateChanged.mockImplementation((callback) => {
      callback(null);
      return jest.fn(); // unsubscribe function
    });

    renderWithProvider();

    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('display-name')).toHaveTextContent('User');
    expect(screen.getByTestId('error')).toHaveTextContent('');
    expect(screen.getByTestId('user-email')).toHaveTextContent('No user');
  });

  test('handles user authentication state change', async () => {
    authService.onAuthStateChanged.mockImplementation((callback) => {
      // Simulate user login
      setTimeout(() => callback(mockUser), 0);
      return jest.fn();
    });

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('display-name')).toHaveTextContent('Test User');
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', 'mock-token');
  });

  test('handles sign in successfully', async () => {
    const user = userEvent.setup();
    authService.onAuthStateChanged.mockImplementation((callback) => {
      callback(null);
      return jest.fn();
    });
    authService.signIn.mockResolvedValue(mockUser);

    renderWithProvider();

    const signInButton = screen.getByText('Sign In');
    await user.click(signInButton);

    await waitFor(() => {
      expect(authService.signIn).toHaveBeenCalledWith('test@example.com', 'password');
    });
  });

  test('handles sign in error', async () => {
    const user = userEvent.setup();
    authService.onAuthStateChanged.mockImplementation((callback) => {
      callback(null);
      return jest.fn();
    });
    
    const error = { code: 'auth/wrong-password' };
    authService.signIn.mockRejectedValue(error);

    renderWithProvider();

    const signInButton = screen.getByText('Sign In');
    await user.click(signInButton);

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Incorrect password.');
    });
  });

  test('handles sign up successfully', async () => {
    const user = userEvent.setup();
    authService.onAuthStateChanged.mockImplementation((callback) => {
      callback(null);
      return jest.fn();
    });
    authService.signUp.mockResolvedValue(mockUser);

    renderWithProvider();

    const signUpButton = screen.getByText('Sign Up');
    await user.click(signUpButton);

    await waitFor(() => {
      expect(authService.signUp).toHaveBeenCalledWith('test@example.com', 'password', 'Test User');
    });
  });

  test('handles Google sign in successfully', async () => {
    const user = userEvent.setup();
    authService.onAuthStateChanged.mockImplementation((callback) => {
      callback(null);
      return jest.fn();
    });
    authService.signInWithGoogle.mockResolvedValue(mockUser);

    renderWithProvider();

    const googleSignInButton = screen.getByText('Sign In with Google');
    await user.click(googleSignInButton);

    await waitFor(() => {
      expect(authService.signInWithGoogle).toHaveBeenCalled();
    });
  });

  test('handles sign out successfully', async () => {
    const user = userEvent.setup();
    authService.onAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser);
      return jest.fn();
    });
    authService.signOut.mockResolvedValue();

    renderWithProvider();

    const signOutButton = screen.getByText('Sign Out');
    await user.click(signOutButton);

    await waitFor(() => {
      expect(authService.signOut).toHaveBeenCalled();
    });
  });

  test('maps Firebase error codes to user-friendly messages', async () => {
    const user = userEvent.setup();
    authService.onAuthStateChanged.mockImplementation((callback) => {
      callback(null);
      return jest.fn();
    });

    const testCases = [
      { code: 'auth/user-not-found', expected: 'No account found with this email address.' },
      { code: 'auth/email-already-in-use', expected: 'An account with this email already exists.' },
      { code: 'auth/weak-password', expected: 'Password should be at least 6 characters.' },
      { code: 'auth/invalid-email', expected: 'Invalid email address.' },
    ];

    for (const testCase of testCases) {
      authService.signIn.mockRejectedValue({ code: testCase.code });
      
      renderWithProvider();
      
      const signInButton = screen.getByText('Sign In');
      await user.click(signInButton);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(testCase.expected);
      });
    }
  });

  test('removes auth token on sign out', async () => {
    authService.onAuthStateChanged.mockImplementation((callback) => {
      // First call with user, then without
      callback(mockUser);
      setTimeout(() => callback(null), 100);
      return jest.fn();
    });

    renderWithProvider();

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', 'mock-token');
    });

    await waitFor(() => {
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
    });
  });

  test('provides correct display name fallbacks', async () => {
    const userWithoutDisplayName = {
      ...mockUser,
      displayName: null
    };

    authService.onAuthStateChanged.mockImplementation((callback) => {
      callback(userWithoutDisplayName);
      return jest.fn();
    });

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('display-name')).toHaveTextContent('test@example.com');
    });
  });

  test('throws error when useAuth is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });

  test('handles loading state during authentication', () => {
    authService.onAuthStateChanged.mockImplementation((callback) => {
      // Don't call callback immediately to simulate loading
      return jest.fn();
    });

    renderWithProvider();

    expect(screen.getByTestId('loading')).toHaveTextContent('true');
  });
});

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';

// Firebase configuration with fallback
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || 'demo-app-id'
};

// Check if Firebase is properly configured
const isFirebaseConfigured = process.env.REACT_APP_FIREBASE_API_KEY &&
  process.env.REACT_APP_FIREBASE_API_KEY !== 'your-web-api-key';

// Initialize Firebase only if properly configured
let app, auth, googleProvider;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
  } catch (error) {
    console.warn('Firebase initialization failed:', error);
  }
} else {
  console.warn('Firebase not configured - authentication features will be disabled');
}

// Configure Google provider if available
if (googleProvider) {
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });
}

// Helper function to check if Firebase is available
const checkFirebaseAvailable = () => {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase authentication is not configured. Please set up Firebase credentials.');
  }
};

export const authService = {
  // Sign up with email and password
  signUp: async (email, password, displayName) => {
    try {
      checkFirebaseAvailable();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update user profile with display name
      if (displayName) {
        await updateProfile(userCredential.user, {
          displayName: displayName
        });
      }
      
      return userCredential.user;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  },

  // Sign in with email and password
  signIn: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  },

  // Sign in with Google
  signInWithGoogle: async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  },

  // Sign out
  signOut: async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },

  // Get current user
  getCurrentUser: () => {
    if (!isFirebaseConfigured || !auth) return null;
    return auth.currentUser;
  },

  // Get auth token
  getAuthToken: async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        return await user.getIdToken();
      }
      return null;
    } catch (error) {
      console.error('Get auth token error:', error);
      throw error;
    }
  },

  // Listen to auth state changes
  onAuthStateChanged: (callback) => {
    if (!isFirebaseConfigured || !auth) {
      // Call callback with null user if Firebase not configured
      callback(null);
      return () => {}; // Return empty unsubscribe function
    }
    return onAuthStateChanged(auth, callback);
  },

  // Update user profile
  updateUserProfile: async (updates) => {
    try {
      const user = auth.currentUser;
      if (user) {
        await updateProfile(user, updates);
        return user;
      }
      throw new Error('No user is currently signed in');
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  // Get user display name
  getUserDisplayName: () => {
    const user = auth.currentUser;
    return user?.displayName || 'User';
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    if (!isFirebaseConfigured || !auth) return false;
    return !!auth.currentUser;
  },

  // Check if Firebase is configured
  isFirebaseConfigured: () => {
    return isFirebaseConfigured;
  }
};

export default authService;

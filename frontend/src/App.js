import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/common/Toast';
import ErrorBoundary from './components/common/ErrorBoundary';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import Login from './views/Login/Login';
import Home from './views/Home/Home';
import Analysis from './views/Analysis/Analysis';
import Dashboard from './views/Dashboard/Dashboard';
import Profile from './views/Profile/Profile';
import Auth from './views/Auth/Auth';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <div className="min-h-screen">
              <Routes>
                {/* Login Route - Landing Page */}
                <Route path="/" element={<Login />} />

                {/* Main Application Routes - With Layout */}
                <Route path="/*" element={
                  <Layout>
                    <Routes>
                      <Route path="/home" element={<Home />} />
                      <Route path="/analysis/:id" element={<Analysis />} />
                      <Route path="/dashboard" element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      } />
                      <Route path="/profile" element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      } />
                      <Route path="/auth" element={<Auth />} />
                    </Routes>
                  </Layout>
                } />
              </Routes>
            </div>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

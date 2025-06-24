import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/common/Toast';
import ErrorBoundary from './components/common/ErrorBoundary';
import Layout from './components/layout/Layout';
import Home from './views/Home/Home';
import Analysis from './views/Analysis/Analysis';
import Dashboard from './views/Dashboard/Dashboard';
import Auth from './views/Auth/Auth';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/analysis" element={<Analysis />} />
                  <Route path="/analysis/:id" element={<Analysis />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/auth" element={<Auth />} />
                </Routes>
              </Layout>
            </div>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

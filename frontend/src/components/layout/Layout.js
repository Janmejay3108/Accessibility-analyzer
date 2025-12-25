import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, signOut, displayName } = useAuth();

  const navigation = [
    { name: 'Home', href: '/home' },
    ...(isAuthenticated
      ? [
          { name: 'Dashboard', href: '/dashboard' },
          { name: 'Profile', href: '/profile' }
        ]
      : [{ name: 'Sign In', href: '/' }]
    ),
  ];

  const isActive = (path) => {
    if (path === '/home') {
      return location.pathname === '/home';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-surface-subtle">
      {/* Skip Navigation Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-white text-text-main px-4 py-2 rounded-xl font-medium z-50"
      >
        Skip to main content
      </a>

      {/* Mobile navigation overlay */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-white shadow-elevated">
          <div className="flex items-center justify-between h-16 px-4 border-b border-border-light">
            <Link to="/home" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="font-semibold text-text-main">Accessibility</span>
            </Link>
            <button
              type="button"
              className="p-2 rounded-xl text-text-subtle hover:text-text-main hover:bg-gray-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <nav className="p-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                  ${isActive(item.href)
                    ? 'bg-gray-900 text-white'
                    : 'text-text-subtle hover:bg-gray-100 hover:text-text-main'
                  }
                `}
                onClick={() => setSidebarOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            {isAuthenticated && (
              <button
                onClick={() => { signOut(); setSidebarOpen(false); }}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-text-subtle hover:bg-gray-100 hover:text-text-main rounded-xl transition-all duration-200"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                Sign out
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Top Navigation Bar - Minimal Antigravity Style */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-border-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center gap-8">
              <Link to="/home" className="flex items-center gap-3 group">
                <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="hidden sm:block font-semibold text-text-main">Accessibility</span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200
                      ${isActive(item.href)
                        ? 'bg-gray-100 text-text-main'
                        : 'text-text-subtle hover:text-text-main hover:bg-gray-50'
                      }
                    `}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* User menu for desktop */}
              {isAuthenticated && (
                <div className="hidden md:flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-pill">
                    <div className="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-white">
                        {displayName?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-text-main max-w-[120px] truncate">
                      {displayName}
                    </span>
                  </div>
                  <button
                    onClick={signOut}
                    className="p-2 text-text-subtle hover:text-text-main hover:bg-gray-100 rounded-xl transition-colors"
                    title="Sign out"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  </button>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                type="button"
                aria-label="Open main menu"
                className="md:hidden p-2 rounded-xl text-text-subtle hover:text-text-main hover:bg-gray-100 transition-colors"
                onClick={() => setSidebarOpen(true)}
              >
                <Bars3Icon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main id="main-content" className="flex-1" role="main">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;

import React from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

const Loading = ({ 
  size = 'medium', 
  message = 'Loading...', 
  fullScreen = false,
  className = '' 
}) => {
  const getContainerSize = () => {
    switch (size) {
      case 'small':
        return 'w-8 h-8';
      case 'large':
        return 'w-14 h-14';
      case 'xlarge':
        return 'w-20 h-20';
      default:
        return 'w-12 h-12';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 'h-4 w-4';
      case 'large':
        return 'h-7 w-7';
      case 'xlarge':
        return 'h-10 w-10';
      default:
        return 'h-5 w-5';
    }
  };

  const content = (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <div className={`${getContainerSize()} bg-gray-100 rounded-2xl flex items-center justify-center`}>
        <ArrowPathIcon className={`${getIconSize()} text-text-subtle animate-spin`} />
      </div>
      {message && (
        <p className="text-sm text-text-subtle">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-surface-subtle/80 backdrop-blur-sm flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
};

// Skeleton loader for content
export const SkeletonLoader = ({ lines = 3, className = '' }) => {
  return (
    <div className={`animate-pulse space-y-4 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="space-y-2">
          <div className="h-4 bg-gray-200 rounded-xl w-3/4"></div>
          <div className="h-4 bg-gray-100 rounded-xl w-1/2"></div>
        </div>
      ))}
    </div>
  );
};

// Card skeleton loader
export const CardSkeleton = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-3xl border border-border-light p-6 animate-pulse ${className}`}>
      <div className="flex items-center gap-4">
        <div className="rounded-2xl bg-gray-100 h-12 w-12"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded-xl w-3/4"></div>
          <div className="h-3 bg-gray-100 rounded-xl w-1/2"></div>
        </div>
      </div>
    </div>
  );
};

// Button loading state
export const LoadingButton = ({ 
  loading, 
  children, 
  className = '',
  disabled,
  ...props 
}) => {
  return (
    <button
      className={`flex items-center justify-center gap-2 ${className} ${
        loading || disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      disabled={loading || disabled}
      {...props}
    >
      {loading && (
        <ArrowPathIcon className="h-4 w-4 animate-spin" />
      )}
      {children}
    </button>
  );
};

export default Loading;

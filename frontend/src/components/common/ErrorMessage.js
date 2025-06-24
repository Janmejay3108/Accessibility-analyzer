import React from 'react';
import { 
  ExclamationTriangleIcon, 
  ExclamationCircleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const ErrorMessage = ({ 
  type = 'error', 
  title, 
  message, 
  onDismiss,
  actions,
  className = '' 
}) => {
  const getErrorConfig = () => {
    switch (type) {
      case 'warning':
        return {
          icon: ExclamationTriangleIcon,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          iconColor: 'text-yellow-400',
          titleColor: 'text-yellow-800',
          textColor: 'text-yellow-700'
        };
      case 'info':
        return {
          icon: InformationCircleIcon,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-400',
          titleColor: 'text-blue-800',
          textColor: 'text-blue-700'
        };
      default:
        return {
          icon: ExclamationCircleIcon,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-400',
          titleColor: 'text-red-800',
          textColor: 'text-red-700'
        };
    }
  };

  const config = getErrorConfig();
  const Icon = config.icon;

  return (
    <div className={`rounded-md border p-4 ${config.bgColor} ${config.borderColor} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${config.iconColor}`} />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${config.titleColor}`}>
              {title}
            </h3>
          )}
          <div className={`${title ? 'mt-2' : ''} text-sm ${config.textColor}`}>
            {typeof message === 'string' ? (
              <p>{message}</p>
            ) : (
              message
            )}
          </div>
          {actions && (
            <div className="mt-4">
              <div className="-mx-2 -my-1.5 flex">
                {actions}
              </div>
            </div>
          )}
        </div>
        {onDismiss && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                className={`inline-flex rounded-md p-1.5 ${config.bgColor} ${config.textColor} hover:${config.bgColor} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-${config.bgColor.split('-')[1]}-50 focus:ring-${config.iconColor.split('-')[1]}-600`}
                onClick={onDismiss}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Specific error message components
export const NetworkError = ({ onRetry, onDismiss }) => (
  <ErrorMessage
    type="error"
    title="Network Error"
    message="Unable to connect to the server. Please check your internet connection and try again."
    onDismiss={onDismiss}
    actions={
      onRetry && (
        <button
          type="button"
          className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
          onClick={onRetry}
        >
          Try Again
        </button>
      )
    }
  />
);

export const ValidationError = ({ errors, onDismiss }) => (
  <ErrorMessage
    type="error"
    title="Validation Error"
    message={
      <ul className="list-disc list-inside space-y-1">
        {Array.isArray(errors) ? (
          errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))
        ) : (
          <li>{errors}</li>
        )}
      </ul>
    }
    onDismiss={onDismiss}
  />
);

export const NotFoundError = ({ resource = 'resource', onGoBack }) => (
  <ErrorMessage
    type="warning"
    title={`${resource.charAt(0).toUpperCase() + resource.slice(1)} Not Found`}
    message={`The ${resource} you're looking for doesn't exist or may have been removed.`}
    actions={
      onGoBack && (
        <button
          type="button"
          className="rounded-md bg-yellow-50 px-2 py-1.5 text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600"
          onClick={onGoBack}
        >
          Go Back
        </button>
      )
    }
  />
);

export const PermissionError = ({ onSignIn }) => (
  <ErrorMessage
    type="warning"
    title="Permission Required"
    message="You need to be signed in to access this feature."
    actions={
      onSignIn && (
        <button
          type="button"
          className="rounded-md bg-yellow-50 px-2 py-1.5 text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600"
          onClick={onSignIn}
        >
          Sign In
        </button>
      )
    }
  />
);

export default ErrorMessage;

import React from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  ArrowPathIcon, 
  ClockIcon 
} from '@heroicons/react/24/outline';

const StatusIndicator = ({ status, message, className = '' }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return {
          icon: CheckCircleIcon,
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800'
        };
      case 'error':
        return {
          icon: ExclamationTriangleIcon,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800'
        };
      case 'processing':
        return {
          icon: ArrowPathIcon,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          animate: true
        };
      default:
        return {
          icon: ClockIcon,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`flex items-center space-x-3 p-3 rounded-lg border ${config.bgColor} ${config.borderColor} ${className}`}>
      <Icon className={`h-5 w-5 ${config.color} ${config.animate ? 'animate-spin' : ''}`} />
      <span className={`text-sm font-medium ${config.textColor}`}>
        {message || status}
      </span>
    </div>
  );
};

export default StatusIndicator;

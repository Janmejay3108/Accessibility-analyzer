import React from 'react';

const BrandLogo = ({ className = "", size = "default" }) => {
  const sizeClasses = {
    small: "h-8 w-8",
    default: "h-12 w-12",
    large: "h-16 w-16"
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Gradient Heart Logo */}
      
      
      {/* Brand Text */}
      <div className="flex flex-col">
        <span className="text-white font-bold text-lg leading-tight">
          Accessibility
        </span>
        <span className="text-gray-300 font-medium text-sm leading-tight">
          Analyzer
        </span>
      </div>
    </div>
  );
};

export default BrandLogo;

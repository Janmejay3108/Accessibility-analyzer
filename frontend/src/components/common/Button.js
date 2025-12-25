import React from 'react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  ...props
}) => {
  const baseStyles = `
    inline-flex items-center justify-center font-medium
    transition-all duration-200 ease-spring
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
  `;

  const variants = {
    primary: `
      bg-gray-900 text-white rounded-pill
      hover:scale-[1.02] active:scale-[0.98]
      focus:ring-gray-900
    `,
    secondary: `
      bg-white text-gray-900 rounded-pill
      border border-gray-300
      hover:bg-gray-50 hover:scale-[1.02] active:scale-[0.98]
      focus:ring-gray-300
    `,
    brand: `
      bg-brand text-white rounded-pill
      hover:bg-brand-hover hover:scale-[1.02] active:scale-[0.98]
      focus:ring-brand
    `,
    ghost: `
      text-text-subtle rounded-xl
      hover:bg-gray-100 hover:text-text-main
      focus:ring-gray-200
    `,
    danger: `
      bg-red-600 text-white rounded-pill
      hover:bg-red-700 hover:scale-[1.02] active:scale-[0.98]
      focus:ring-red-500
    `,
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm gap-1.5',
    md: 'px-6 py-3 text-sm gap-2',
    lg: 'px-8 py-4 text-base gap-2.5',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-5 w-5',
  };

  const LoadingSpinner = () => (
    <svg
      className={`animate-spin ${iconSizes[size]}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  return (
    <button
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `.replace(/\s+/g, ' ').trim()}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LoadingSpinner />}
      {!loading && Icon && iconPosition === 'left' && (
        <Icon className={iconSizes[size]} />
      )}
      {children}
      {!loading && Icon && iconPosition === 'right' && (
        <Icon className={iconSizes[size]} />
      )}
    </button>
  );
};

export default Button;

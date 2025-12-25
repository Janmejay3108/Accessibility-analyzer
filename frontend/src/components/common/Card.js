import React from 'react';

const Card = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  onClick,
  ...props
}) => {
  const baseStyles = `
    bg-white border transition-all duration-300
  `;

  const variants = {
    default: `
      rounded-3xl border-border-light
      shadow-soft hover:shadow-medium
    `,
    elevated: `
      rounded-3xl border-border-light
      shadow-soft hover:shadow-elevated hover:-translate-y-1
    `,
    glass: `
      rounded-3xl border-white/20
      bg-white/80 backdrop-blur-xl shadow-elevated
    `,
    flat: `
      rounded-2xl border-border
      shadow-none hover:bg-gray-50
    `,
    interactive: `
      rounded-3xl border-border-light
      shadow-soft hover:shadow-elevated hover:-translate-y-1
      cursor-pointer
    `,
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${paddings[padding]}
        ${className}
      `.replace(/\s+/g, ' ').trim()}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold text-text-main ${className}`}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '' }) => (
  <p className={`text-sm text-text-subtle mt-1 ${className}`}>
    {children}
  </p>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={className}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`mt-4 pt-4 border-t border-border-light ${className}`}>
    {children}
  </div>
);

export default Card;

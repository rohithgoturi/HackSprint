import React from 'react';

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className = '',
  icon: Icon
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-civic-action disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-civic-action hover:bg-civic-action-hover text-white shadow-sm border border-transparent',
    secondary: 'bg-white border border-civic-border text-civic-navy hover:bg-civic-light-gray shadow-sm',
    outline: 'border border-civic-action text-civic-action hover:bg-blue-50',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm focus:ring-red-500 border border-transparent',
    ghost: 'text-civic-muted hover:text-civic-navy hover:bg-civic-light-gray'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {Icon && <Icon className={`w-4 h-4 ${children ? 'mr-1.5' : ''}`} />}
      {children}
    </button>
  );
};

export default Button;

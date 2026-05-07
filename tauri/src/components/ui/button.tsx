import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'subtle';
  size?: 'default' | 'sm' | 'xs';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'default',
  children,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

  const variantClasses = {
    default: 'bg-zinc-900 text-zinc-100 hover:bg-zinc-800 border border-zinc-700',
    outline: 'border border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-100',
    subtle: 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
  };

  const sizeClasses = {
    default: 'h-10 px-4 py-2 text-sm',
    sm: 'h-9 px-3 text-sm',
    xs: 'h-8 px-2 text-xs'
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
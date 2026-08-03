import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled,
  isLoading: externalLoading,
  loadingText,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}) => {
  const [internalLoading, setInternalLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || internalLoading || externalLoading) return;

    setInternalLoading(true);
    try {
      if (onClick) {
        const result: unknown = onClick(e);
        if (result && typeof (result as Promise<unknown>).then === 'function') {
          await result;
        } else {
          // Visual feedback window for synchronous clicks
          await new Promise((resolve) => setTimeout(resolve, 400));
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    } finally {
      setInternalLoading(false);
    }
  };

  const showLoading = externalLoading || internalLoading;

  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none';

  const variantStyles = {
    primary: 'bg-[var(--color-brand-primary,#f28913)] hover:bg-[var(--color-brand-primary-hover,#d97a0e)] text-white shadow-sm focus:ring-[var(--color-brand-primary,#f28913)]',
    secondary: 'bg-slate-800 hover:bg-slate-900 text-white shadow-sm focus:ring-slate-800',
    outline: 'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-sm focus:ring-slate-400',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus:ring-rose-500',
    ghost: 'text-slate-600 hover:bg-slate-100 focus:ring-slate-400'
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5'
  };

  return (
    <button
      {...props}
      type={type}
      disabled={disabled || showLoading}
      onClick={handleClick}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {showLoading && (
        <Loader2 className="w-4 h-4 animate-spin shrink-0 ml-1.5" />
      )}
      <span className={showLoading ? 'opacity-90' : ''}>
        {showLoading && loadingText ? loadingText : children}
      </span>
    </button>
  );
};

export default Button;

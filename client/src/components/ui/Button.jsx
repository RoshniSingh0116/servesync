import React from 'react';
import Spinner from './Spinner';

const variantClasses = {
  primary:
    'bg-[#526B50] text-white hover:bg-[#40563F] border border-transparent disabled:bg-[#526B50]/50',
  secondary:
    'bg-[#EFF1EA] text-[#20251F] hover:bg-[#E6E8E1] border border-[#E6E8E1] disabled:opacity-50',
  ghost:
    'bg-transparent text-[#526B50] hover:bg-[#EFF1EA] border border-transparent disabled:opacity-50',
  danger:
    'bg-red-500 text-white hover:bg-red-600 border border-transparent disabled:opacity-50',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm rounded-md gap-1.5',
  md: 'px-4 py-2 text-sm rounded-md gap-2',
  lg: 'px-5 py-2.5 text-base rounded-md gap-2',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  onClick,
  type = 'button',
  className = '',
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center font-semibold transition-colors duration-150 cursor-pointer',
        'disabled:cursor-not-allowed select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#526B50]',
        variantClasses[variant] ?? variantClasses.primary,
        sizeClasses[size] ?? sizeClasses.md,
        className,
      ].join(' ')}
    >
      {loading && <Spinner className={variant === 'primary' ? 'text-white' : 'text-[#526B50]'} />}
      {children}
    </button>
  );
}

import React from 'react';

export default function Input({
  label,
  error,
  className = '',
  containerClassName = '',
  id,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`flex flex-col gap-1 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-semibold text-[#20251F]"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[
          'w-full bg-white border rounded-md px-3 py-2 text-sm text-[#20251F] placeholder-[#74796F]',
          'transition-colors duration-150',
          error
            ? 'border-red-400 focus:ring-2 focus:ring-red-300 focus:border-red-400 outline-none'
            : 'border-[#E6E8E1] focus:ring-2 focus:ring-[#526B50]/30 focus:border-[#526B50] outline-none',
          className,
        ].join(' ')}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
}

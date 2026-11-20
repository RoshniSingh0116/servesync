import React from 'react';

export default function PageHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-start justify-between gap-4 mb-6 ${className}`}>
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-[#20251F] leading-tight truncate">{title}</h1>
        {subtitle && (
          <p className="mt-0.5 text-sm text-[#74796F] font-medium">{subtitle}</p>
        )}
      </div>
      {action && (
        <div className="flex-shrink-0 flex items-center gap-2">
          {action}
        </div>
      )}
    </div>
  );
}

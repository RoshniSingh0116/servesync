import React from 'react';
import Button from './Button';

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-16 px-6 ${className}`}
    >
      {icon && (
        <div className="mb-4 text-[#CBD0C5] [&>svg]:w-12 [&>svg]:h-12">
          {icon}
        </div>
      )}
      <h3 className="text-base font-bold text-[#20251F] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[#74796F] font-medium max-w-xs mb-5">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

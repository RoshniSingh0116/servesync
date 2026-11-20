import React from 'react';

const statusStyles = {
  Pending:    'bg-amber-100 text-amber-700 border border-amber-200',
  Preparing:  'bg-blue-100 text-blue-700 border border-blue-200',
  Ready:      'bg-green-100 text-green-700 border border-green-200',
  Served:     'bg-[#E6E8E1] text-[#74796F] border border-[#CBD0C5]',
  Cancelled:  'bg-red-100 text-red-600 border border-red-200',
};

const dietaryDotColors = {
  veg:    'bg-green-500',
  nonveg: 'bg-red-500',
  vegan:  'bg-green-700',
};

export default function Badge({ status, variant = 'status', className = '' }) {
  if (variant === 'dietary') {
    const dotColor = dietaryDotColors[status?.toLowerCase()] ?? 'bg-gray-400';
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-[#74796F] ${className}`}>
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
        {status}
      </span>
    );
  }

  const style = statusStyles[status] ?? 'bg-gray-100 text-gray-600 border border-gray-200';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${style} ${className}`}
    >
      {status}
    </span>
  );
}

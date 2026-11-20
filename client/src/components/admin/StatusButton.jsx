import { ChefHat, Bell, CheckCheck, Check, Loader2 } from 'lucide-react';
import { STATUS_TRANSITIONS } from '../../mocks/mockOrders';

export default function StatusButton({
  status,
  onStatusChange,
  orderId,
  tableNumber,
  disabled = false,
  isLoading = false,
  className = '',
}) {
  const statusConfig = {
    Pending: {
      next: STATUS_TRANSITIONS.Pending,
      label: 'Start Preparing',
      ariaLabel: `Start preparing Order #${orderId}${tableNumber ? ` for Table ${tableNumber}` : ''}`,
      icon: ChefHat,
      classes:
        'bg-[#526B50] hover:bg-[#40563F] text-white shadow-xs',
    },
    Preparing: {
      next: STATUS_TRANSITIONS.Preparing,
      label: 'Mark as Ready',
      ariaLabel: `Mark Order #${orderId}${tableNumber ? ` for Table ${tableNumber}` : ''} as ready for pickup`,
      icon: Bell,
      classes:
        'bg-[#234D83] hover:bg-[#1D3E6A] text-white shadow-xs',
    },
    Ready: {
      next: STATUS_TRANSITIONS.Ready,
      label: 'Mark as Served',
      ariaLabel: `Mark Order #${orderId}${tableNumber ? ` for Table ${tableNumber}` : ''} as served to customer`,
      icon: CheckCheck,
      classes:
        'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs',
    },
    Served: {
      next: STATUS_TRANSITIONS.Served,
      label: 'Completed & Served',
      ariaLabel: `Order #${orderId} is completed and served`,
      icon: Check,
      classes:
        'bg-[#EFF1EA] text-[#74796F] border border-[#E6E8E1] cursor-not-allowed',
    },
  };

  const currentConfig = statusConfig[status] || {
    next: null,
    label: status,
    ariaLabel: `Status: ${status}`,
    icon: Check,
    classes: 'bg-[#EFF1EA] text-[#74796F] border border-[#E6E8E1]',
  };

  const IconComponent = currentConfig.icon;
  const isCompleted = status === 'Served' || !currentConfig.next;
  const isDisabled = disabled || isCompleted || isLoading;

  const handleClick = (e) => {
    e.stopPropagation();
    if (!isDisabled && currentConfig.next && typeof onStatusChange === 'function') {
      onStatusChange(currentConfig.next);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      aria-label={isLoading ? `Updating Order #${orderId}…` : currentConfig.ariaLabel}
      aria-busy={isLoading}
      data-testid={`status-btn-${orderId || 'order'}`}
      className={`
        inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-md
        text-xs font-semibold transition-all duration-150 cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-[#526B50]/30
        disabled:cursor-not-allowed
        ${isLoading ? 'opacity-70' : ''}
        ${currentConfig.classes}
        ${className}
      `}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
      ) : (
        <IconComponent className="w-3.5 h-3.5 shrink-0" />
      )}
      <span>{isLoading ? 'Updating…' : currentConfig.label}</span>
      {!isLoading && currentConfig.next && (
        <span className="text-[10px] opacity-75 hidden sm:inline ml-0.5">
          → {currentConfig.next}
        </span>
      )}
    </button>
  );
}

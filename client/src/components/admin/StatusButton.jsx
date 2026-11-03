import { ChefHat, Bell, CheckCheck, Check } from 'lucide-react';
import { STATUS_TRANSITIONS } from '../../mocks/mockOrders';

/**
 * StatusButton Component
 *
 * Provides a working frontend-only button to progress an order through:
 * Pending → Preparing → Ready → Served
 *
 * Enforces valid linear status transitions and provides accessible labels.
 *
 * @param {Object} props
 * @param {string} props.status - Current order status ('Pending' | 'Preparing' | 'Ready' | 'Served')
 * @param {Function} props.onStatusChange - Callback receiving the valid next status string
 * @param {string|number} [props.orderId] - Order ID for accessible aria-label
 * @param {string|number} [props.tableNumber] - Table number for accessible context
 * @param {boolean} [props.disabled] - Whether button is disabled
 * @param {string} [props.className] - Additional styling classes
 */
export default function StatusButton({
  status,
  onStatusChange,
  orderId,
  tableNumber,
  disabled = false,
  className = '',
}) {
  // Configuration mapping for each status action
  const statusConfig = {
    Pending: {
      next: STATUS_TRANSITIONS.Pending, // 'Preparing'
      label: 'Start Preparing',
      ariaLabel: `Start preparing Order #${orderId}${tableNumber ? ` for Table ${tableNumber}` : ''}`,
      icon: ChefHat,
      classes:
        'bg-[#24543A] hover:bg-[#326B4B] text-[#F5F0E6] border border-[#326B4B] shadow-sm hover:shadow active:scale-[0.98]',
    },
    Preparing: {
      next: STATUS_TRANSITIONS.Preparing, // 'Ready'
      label: 'Mark as Ready',
      ariaLabel: `Mark Order #${orderId}${tableNumber ? ` for Table ${tableNumber}` : ''} as ready for pickup`,
      icon: Bell,
      classes:
        'bg-[#234D83] hover:bg-[#2C5E9E] text-[#F5F5F0] border border-[#3C6EAF] shadow-sm hover:shadow active:scale-[0.98]',
    },
    Ready: {
      next: STATUS_TRANSITIONS.Ready, // 'Served'
      label: 'Mark as Served',
      ariaLabel: `Mark Order #${orderId}${tableNumber ? ` for Table ${tableNumber}` : ''} as served to customer`,
      icon: CheckCheck,
      classes:
        'bg-[#24543A] hover:bg-[#326B4B] text-[#F5F0E6] border border-[#326B4B] shadow-sm hover:shadow active:scale-[0.98]',
    },
    Served: {
      next: STATUS_TRANSITIONS.Served, // null
      label: 'Completed & Served',
      ariaLabel: `Order #${orderId} is completed and served`,
      icon: Check,
      classes:
        'bg-[#171A19] text-[#A8B3AA] border border-[#38443C] cursor-not-allowed opacity-80',
    },
  };

  const currentConfig = statusConfig[status] || {
    next: null,
    label: status,
    ariaLabel: `Status: ${status}`,
    icon: Check,
    classes: 'bg-[#171A19] text-[#A8B3AA] border border-[#38443C]',
  };

  const IconComponent = currentConfig.icon;
  const isCompleted = status === 'Served' || !currentConfig.next;
  const isDisabled = disabled || isCompleted;

  const handleClick = (e) => {
    e.stopPropagation();
    // Strictly prevent invalid transitions
    if (!isDisabled && currentConfig.next && typeof onStatusChange === 'function') {
      onStatusChange(currentConfig.next);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      aria-label={currentConfig.ariaLabel}
      data-testid={`status-btn-${orderId || 'order'}`}
      className={`
        inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
        text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-[#82B895] focus:ring-offset-2 focus:ring-offset-[#222825]
        disabled:cursor-not-allowed disabled:active:scale-100
        ${currentConfig.classes}
        ${className}
      `}
    >
      <IconComponent className="w-4 h-4 shrink-0" />
      <span>{currentConfig.label}</span>
      {currentConfig.next && (
        <span className="text-[10px] opacity-75 hidden sm:inline ml-0.5">
          → {currentConfig.next}
        </span>
      )}
    </button>
  );
}

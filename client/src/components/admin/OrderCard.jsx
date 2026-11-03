import { Clock, AlertCircle, CheckCircle2, Flame, Bell, CheckCheck } from 'lucide-react';
import StatusButton from './StatusButton';
import { STATUS_BADGE_STYLES } from '../../mocks/mockOrders';

/**
 * Format timestamp into readable local time (e.g., 08:35 PM)
 * and calculate elapsed minutes.
 */
function formatOrderTime(dateString) {
  if (!dateString) return { formattedTime: null, elapsedMinutes: null };
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return { formattedTime: dateString, elapsedMinutes: null };
    }
    const formattedTime = date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const elapsedMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / (1000 * 60)));
    return { formattedTime, elapsedMinutes };
  } catch {
    return { formattedTime: String(dateString), elapsedMinutes: null };
  }
}

/**
 * OrderCard Component
 * Displays a single kitchen order ticket with table number, items, special instructions,
 * time elapsed, and actionable status transition button.
 *
 * @param {Object} props
 * @param {Object} props.order - Order object
 * @param {Function} props.onStatusChange - Callback (orderId, nextStatus) => void
 */
export default function OrderCard({ order, onStatusChange }) {
  if (!order) return null;

  const { id, tableNumber, items = [], total, status = 'Pending', createdAt, specialInstructions } = order;
  const { formattedTime, elapsedMinutes } = formatOrderTime(createdAt);
  const badgeStyle = STATUS_BADGE_STYLES[status] || STATUS_BADGE_STYLES.Pending;

  // Status icon component
  const StatusIcon = {
    Pending: Flame,
    Preparing: Bell,
    Ready: CheckCircle2,
    Served: CheckCheck,
  }[status] || CheckCircle2;

  // Urgency indicator: Pending or Preparing orders waiting > 15 minutes
  const isUrgent = (status === 'Pending' || status === 'Preparing') && elapsedMinutes != null && elapsedMinutes >= 15;

  // Total quantity of items in ticket
  const totalItemCount = items.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0);

  return (
    <article
      data-testid={`order-card-${id}`}
      className={`
        flex flex-col bg-[#222825] rounded-2xl border transition-all duration-200 overflow-hidden shadow-lg
        ${
          status === 'Pending'
            ? 'border-[#E5B86A]/50 hover:border-[#E5B86A]'
            : status === 'Preparing'
            ? 'border-[#3C6EAF]/60 hover:border-[#3C6EAF]'
            : status === 'Ready'
            ? 'border-[#24543A] hover:border-[#82B895]'
            : 'border-[#38443C] opacity-85 hover:opacity-100'
        }
      `}
    >
      {/* ─────────────────────────────────────────────────────────────
          1. TICKET HEADER: Order ID, Table #, Status Badge
      ───────────────────────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 border-b border-[#38443C] bg-[#1C211F]/80">
        <div className="flex items-start justify-between gap-3 mb-2">
          {/* Order ID & Table Number */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xl sm:text-2xl font-black text-[#F5F5F0] tracking-tight">
              #{id}
            </span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#171A19] border border-[#38443C]">
              <span className="text-[10px] uppercase font-bold text-[#A8B3AA] tracking-wider">
                Table
              </span>
              <span className="text-sm font-extrabold text-[#E5B86A]">
                {tableNumber != null ? tableNumber : 'N/A'}
              </span>
            </div>
          </div>

          {/* Status Badge with design system styling */}
          <span
            style={{
              backgroundColor: badgeStyle.bg,
              color: badgeStyle.text,
              borderColor: badgeStyle.border,
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-xs shrink-0"
          >
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{badgeStyle.label}</span>
          </span>
        </div>

        {/* Time metadata & urgency warning */}
        <div className="flex items-center justify-between text-xs text-[#A8B3AA] pt-1">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#A8B3AA]" />
            {formattedTime && <span>{formattedTime}</span>}
            {elapsedMinutes != null && (
              <span className="text-[#A8B3AA]">({elapsedMinutes}m ago)</span>
            )}
          </div>

          {/* Urgency Badge for tickets waiting > 15m */}
          {isUrgent && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-600/70 text-[11px] font-semibold animate-pulse">
              <AlertCircle className="w-3 h-3 text-amber-400" />
              Priority Order
            </span>
          )}

          {status === 'Ready' && (
            <span className="text-[11px] font-semibold text-[#82B895]">
              Ready for pickup
            </span>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. ORDER ITEMS LIST
      ───────────────────────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-4">
        <div>
          <div className="flex items-center justify-between mb-3 text-[11px] uppercase tracking-wider font-semibold text-[#A8B3AA]">
            <span>Ordered Items</span>
            <span>{totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}</span>
          </div>

          <ul className="space-y-2.5">
            {items.map((item, index) => {
              const qty = Number(item.quantity) || 1;
              const itemPrice = Number(item.price);
              const hasPrice = !isNaN(itemPrice);

              return (
                <li
                  key={item.foodId ? `${item.foodId}-${index}` : `item-${index}`}
                  className="flex items-start justify-between gap-3 text-sm py-1 border-b border-[#38443C]/40 last:border-0"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    {/* Quantity Pill */}
                    <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-md bg-[#171A19] border border-[#38443C] text-xs font-black text-[#E5B86A] shrink-0">
                      {qty}×
                    </span>
                    {/* Food Name */}
                    <span className="font-semibold text-[#F5F5F0] leading-snug break-words">
                      {item.name || 'Unnamed Dish'}
                    </span>
                  </div>

                  {/* Item Price (if available) */}
                  {hasPrice && (
                    <span className="text-xs font-medium text-[#A8B3AA] shrink-0 pt-0.5">
                      ₹{itemPrice * qty}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            3. SPECIAL INSTRUCTIONS CALLOUT (Only if provided)
        ───────────────────────────────────────────────────────────── */}
        {specialInstructions && (
          <div
            role="note"
            aria-label="Chef special instructions"
            className="p-3 rounded-xl bg-amber-950/30 border border-amber-600/40 text-amber-200 text-xs"
          >
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wide text-[10px] text-amber-400 mb-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Special Kitchen Instructions</span>
            </div>
            <p className="leading-relaxed text-amber-100 font-medium">
              "{specialInstructions}"
            </p>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. FOOTER: Total Amount & Status Action Button
      ───────────────────────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 bg-[#1C211F]/90 border-t border-[#38443C] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-auto">
        {/* Total (if provided) */}
        <div className="flex items-baseline sm:flex-col justify-between sm:justify-center">
          <span className="text-[10px] uppercase tracking-wider text-[#A8B3AA] font-bold">
            Total Amount
          </span>
          <span className="text-base sm:text-lg font-black text-[#F5F5F0]">
            {total != null ? `₹${total}` : '—'}
          </span>
        </div>

        {/* Action Button: Pending -> Preparing -> Ready -> Served */}
        <div className="flex-1 sm:flex-initial">
          <StatusButton
            status={status}
            orderId={id}
            tableNumber={tableNumber}
            onStatusChange={(nextStatus) => {
              if (typeof onStatusChange === 'function') {
                onStatusChange(id, nextStatus);
              }
            }}
            className="w-full sm:w-auto min-w-[170px]"
          />
        </div>
      </div>
    </article>
  );
}

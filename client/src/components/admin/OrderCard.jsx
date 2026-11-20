import { Clock, AlertCircle, CheckCircle2, Flame, Bell, CheckCheck } from 'lucide-react';
import StatusButton from './StatusButton';

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

export default function OrderCard({ order, onStatusChange, isUpdating = false }) {
  if (!order) return null;

  const { id, tableNumber, items = [], total, status = 'Pending', createdAt, specialInstructions } = order;
  const { formattedTime, elapsedMinutes } = formatOrderTime(createdAt);

  const StatusIcon = {
    Pending: Flame,
    Preparing: Bell,
    Ready: CheckCircle2,
    Served: CheckCheck,
  }[status] || CheckCircle2;

  const isUrgent = (status === 'Pending' || status === 'Preparing') && elapsedMinutes != null && elapsedMinutes >= 15;
  const totalItemCount = items.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0);

  const statusBadgeClass = {
    Pending: 'bg-amber-50 text-amber-800 border-amber-200',
    Preparing: 'bg-blue-50 text-blue-800 border-blue-200',
    Ready: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    Served: 'bg-[#EFF1EA] text-[#74796F] border-[#E6E8E1]',
  }[status] || 'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <article
      data-testid={`order-card-${id}`}
      className={`
        flex flex-col bg-white rounded-xl border border-[#E6E8E1] transition-all duration-150 overflow-hidden shadow-xs hover:border-[#CBD0C5]
        ${isUpdating ? 'opacity-70 pointer-events-none' : ''}
      `}
    >
      <div className="p-4 border-b border-[#E6E8E1] bg-[#FAFBF8]">
        <div className="flex items-center justify-between gap-3 mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-[#20251F]">
              #{typeof id === 'string' && id.length > 10 ? id.slice(-6) : id}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#EFF1EA] border border-[#E6E8E1] text-xs font-semibold text-[#20251F]">
              Table #{tableNumber != null ? tableNumber : 'N/A'}
            </span>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadgeClass}`}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{status}</span>
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-[#74796F] pt-1">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {formattedTime && <span>{formattedTime}</span>}
            {elapsedMinutes != null && (
              <span>({elapsedMinutes}m ago)</span>
            )}
          </div>

          {isUrgent && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold">
              <AlertCircle className="w-3 h-3 text-amber-600" />
              Priority ({elapsedMinutes}m)
            </span>
          )}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <div className="flex items-center justify-between mb-2 text-[11px] uppercase tracking-wider font-semibold text-[#74796F]">
            <span>Ordered Items</span>
            <span>{totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}</span>
          </div>

          <ul className="space-y-1.5">
            {items.map((item, index) => {
              const qty = Number(item.quantity) || 1;
              const itemPrice = Number(item.price);
              const hasPrice = !isNaN(itemPrice);

              return (
                <li
                  key={item.foodId ? `${item.foodId}-${index}` : `item-${index}`}
                  className="flex items-center justify-between text-xs py-1 border-b border-[#FAFBF8] last:border-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded bg-[#EFF1EA] text-[11px] font-bold text-[#20251F]">
                      {qty}×
                    </span>
                    <span className="font-medium text-[#20251F] truncate">
                      {item.name || 'Unnamed Dish'}
                    </span>
                  </div>
                  {hasPrice && (
                    <span className="text-[#74796F] shrink-0 font-medium">
                      ₹{itemPrice * qty}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {specialInstructions && (
          <div
            role="note"
            className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800"
          >
            <span className="font-semibold text-amber-900">Note: </span>
            &quot;{specialInstructions}&quot;
          </div>
        )}
      </div>

      <div className="p-3.5 bg-[#FAFBF8] border-t border-[#E6E8E1] flex items-center justify-between gap-3 mt-auto">
        <div>
          <span className="text-[10px] uppercase font-bold text-[#74796F] block leading-none">
            Total
          </span>
          <span className="text-sm font-bold text-[#526B50] leading-tight">
            {total != null ? `₹${total}` : '—'}
          </span>
        </div>

        <StatusButton
          status={status}
          orderId={id}
          tableNumber={tableNumber}
          isLoading={isUpdating}
          onStatusChange={(nextStatus) => {
            if (typeof onStatusChange === 'function') {
              onStatusChange(id, nextStatus);
            }
          }}
        />
      </div>
    </article>
  );
}

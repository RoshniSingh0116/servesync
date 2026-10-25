/**
 * OrderConfirmationPage — ServeSync Member 2
 * Displays the confirmed order details after a successful order placement.
 * Reads orderId from the route param (:orderId) and looks it up in OrderContext.
 *
 * Shows a friendly fallback if the order is not found (e.g., on hard refresh).
 */

import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  CheckCircle2,
  UtensilsCrossed,
  Clock,
  ArrowLeft,
  Hash,
} from 'lucide-react';
import { useOrders } from '../../context/OrderContext';

/* ─── Helper ─────────────────────────────────────────────── */
function getTableFromSearch(search) {
  const params = new URLSearchParams(search);
  const t = params.get('table');
  return t && t.trim() !== '' ? t.trim() : '1';
}

function formatTime(isoString) {
  try {
    return new Date(isoString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

/* ─── Status badge ───────────────────────────────────────── */
function StatusBadge({ status }) {
  const colours = {
    Pending: 'bg-amber-900/40 text-amber-300 border-amber-700/60',
    Preparing: 'bg-blue-900/40 text-blue-300 border-blue-700/60',
    Ready: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/60',
    Served: 'bg-[#222825] text-[#A8B3AA] border-[#38443C]',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
        colours[status] ?? colours['Pending']
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {status}
    </span>
  );
}

/* ─── Veg dot ─────────────────────────────────────────────── */
function VegDot({ isVeg }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-4 h-4 rounded-sm border flex-shrink-0 mt-0.5 ${
        isVeg ? 'border-emerald-600' : 'border-rose-600'
      } bg-[#1A1E1C]`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isVeg ? 'bg-emerald-600' : 'bg-rose-600'
        }`}
      />
    </span>
  );
}

/* ─── Fallback when order not found ─────────────────────── */
function OrderNotFound({ onBackToMenu }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-[#222825] border border-[#38443C] flex items-center justify-center mb-6">
        <UtensilsCrossed className="w-9 h-9 text-[#38443C]" />
      </div>
      <h2 className="text-xl font-black text-[#F5F5F0] mb-2">
        Order Not Found
      </h2>
      <p className="text-sm text-[#A8B3AA] max-w-xs leading-relaxed mb-8">
        We couldn't locate this order. This may happen after a page refresh since
        orders are stored in session memory only.
      </p>
      <button
        type="button"
        onClick={onBackToMenu}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#24543A] hover:bg-[#326B4B] text-[#F5F0E6] text-sm font-bold border border-[#326B4B] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#82B895]"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Menu
      </button>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────── */
export default function OrderConfirmationPage() {
  const { orderId } = useParams();
  const { search } = useLocation();
  const navigate = useNavigate();
  const tableNumber = getTableFromSearch(search);

  const { getOrderById } = useOrders();
  const order = getOrderById(orderId);

  const handleBackToMenu = () => navigate(`/menu?table=${tableNumber}`);

  return (
    <div className="min-h-screen bg-[#171A19] text-[#F5F5F0] flex flex-col">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-[#171A19]/95 backdrop-blur-md border-b border-[#38443C]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <button
            type="button"
            onClick={handleBackToMenu}
            aria-label="Back to menu"
            className="p-2 rounded-xl bg-[#222825] border border-[#38443C] hover:border-[#82B895] text-[#A8B3AA] hover:text-[#F5F5F0] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#82B895]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <span className="text-base font-black text-[#F5F5F0]">
              Serve<span className="text-[#E5B86A]">Sync</span>
            </span>
            <span className="text-xs text-[#A8B3AA] block leading-none">
              Order Confirmation
            </span>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {!order ? (
          <OrderNotFound onBackToMenu={handleBackToMenu} />
        ) : (
          <>
            {/* Success hero */}
            <div className="flex flex-col items-center text-center py-6">
              <div className="relative mb-5">
                <div className="w-20 h-20 rounded-full bg-[#24543A]/20 border-2 border-[#326B4B] flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-[#82B895]" />
                </div>
                {/* Decorative rings */}
                <div className="absolute inset-0 rounded-full border-2 border-[#24543A]/30 scale-125 animate-ping opacity-30" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#F5F5F0] mb-2">
                Order Placed!
              </h1>
              <p className="text-sm text-[#A8B3AA] max-w-xs leading-relaxed">
                Your order has been received and is being prepared at the kitchen.
              </p>
            </div>

            {/* Order metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Order ID */}
              <div className="col-span-2 sm:col-span-1 bg-[#222825] border border-[#38443C] rounded-2xl p-4 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-xs text-[#A8B3AA] mb-1">
                  <Hash className="w-3.5 h-3.5" />
                  Order ID
                </div>
                <span className="text-lg font-black text-[#E5B86A]">
                  #{order.id}
                </span>
              </div>

              {/* Table */}
              <div className="bg-[#222825] border border-[#38443C] rounded-2xl p-4 flex flex-col gap-1">
                <div className="text-xs text-[#A8B3AA] mb-1">Table</div>
                <span className="text-lg font-black text-[#F5F5F0]">
                  {order.tableNumber}
                </span>
              </div>

              {/* Status */}
              <div className="bg-[#222825] border border-[#38443C] rounded-2xl p-4 flex flex-col gap-1">
                <div className="text-xs text-[#A8B3AA] mb-1">Status</div>
                <StatusBadge status={order.status} />
              </div>

              {/* Time */}
              <div className="bg-[#222825] border border-[#38443C] rounded-2xl p-4 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-xs text-[#A8B3AA] mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  Placed At
                </div>
                <span className="text-sm font-semibold text-[#F5F5F0]">
                  {formatTime(order.createdAt)}
                </span>
              </div>
            </div>

            {/* Ordered items */}
            <div className="bg-[#222825] border border-[#38443C] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#38443C]">
                <h2 className="text-sm font-bold text-[#F5F5F0]">
                  Items Ordered
                </h2>
              </div>
              <ul className="divide-y divide-[#38443C]">
                {order.items.map((item, idx) => (
                  <li
                    key={`${item.foodId}-${idx}`}
                    className="flex items-center gap-3 px-5 py-3.5"
                  >
                    <span className="flex-1 text-sm text-[#F5F5F0] leading-snug">
                      {item.name}
                    </span>
                    <span className="text-xs text-[#A8B3AA] mr-2">
                      × {item.quantity}
                    </span>
                    <span className="text-sm font-semibold text-[#E5B86A] min-w-[60px] text-right">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </li>
                ))}
              </ul>
              {/* Total row */}
              <div className="px-5 py-4 border-t border-[#326B4B] bg-[#1A1E1C] flex justify-between items-center">
                <span className="font-bold text-[#F5F5F0]">Total Paid</span>
                <span className="text-xl font-black text-[#E5B86A]">
                  ₹{order.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Info note */}
            <div className="flex items-start gap-3 p-4 bg-[#24543A]/10 border border-[#326B4B]/40 rounded-xl">
              <UtensilsCrossed className="w-4 h-4 text-[#82B895] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[#A8B3AA] leading-relaxed">
                Your food will be prepared fresh and delivered to{' '}
                <strong className="text-[#F5F5F0]">Table {order.tableNumber}</strong>. 
                No payment required at this step — settle at your convenience with the staff.
              </p>
            </div>

            {/* Back to menu */}
            <div className="pb-4">
              <button
                id="back-to-menu-btn"
                type="button"
                onClick={handleBackToMenu}
                className="
                  w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl
                  bg-[#24543A] hover:bg-[#326B4B] active:scale-[0.98]
                  text-[#F5F0E6] text-sm font-bold
                  border border-[#326B4B] transition-all duration-200 cursor-pointer
                  focus:outline-none focus:ring-2 focus:ring-[#82B895]
                "
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Menu
              </button>
            </div>
          </>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-[#38443C] bg-[#222825] py-5 text-xs text-[#A8B3AA]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            <span className="font-bold text-[#F5F5F0]">ServeSync</span> •
            Order Confirmation • Phase 1
          </span>
          <span>Table #{tableNumber} Active</span>
        </div>
      </footer>
    </div>
  );
}

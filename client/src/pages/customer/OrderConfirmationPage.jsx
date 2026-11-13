/**
 * OrderConfirmationPage — ServeSync Member 2
 * Displays the confirmed order details after a successful order placement.
 *
 * Data sources (priority order):
 *  1. location.state.confirmedOrder  — real order object returned by the backend
 *     POST /api/orders response, passed here from CheckoutPage on the happy path.
 *  2. In-memory OrderContext lookup (getOrderById)  — retains compatibility with
 *     mock-flow tests and deep-link navigation where state is unavailable.
 *  3. Live GET /api/orders/:orderId fetch  — called only if neither of the above
 *     has the order, e.g. after a hard-refresh on the confirmation URL.
 *
 * Commit 5: Connected to real backend.  Displays server-confirmed totalAmount.
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  CheckCircle2,
  UtensilsCrossed,
  Clock,
  ArrowLeft,
  Hash,
  ChefHat,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { getOrderById as fetchOrderById } from '../../api/orderApi';

/* ─── Helpers ────────────────────────────────────────────── */
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

/**
 * Normalises an order object so the page can render regardless of whether
 * it came from location.state (backend shape) or OrderContext (in-memory shape).
 *
 * Backend shape:  { _id, tableNumber, items: [{ foodId, name, price, quantity, subtotal }], totalAmount, status, createdAt }
 * Context shape:  { id, tableNumber, items: [{ foodId, name, price, quantity }], totalAmount, total, status, createdAt }
 */
function normaliseOrder(raw) {
  if (!raw) return null;
  return {
    id: String(raw._id ?? raw.id ?? ''),
    tableNumber: raw.tableNumber,
    items: (raw.items ?? []).map((item) => ({
      foodId: String(item.foodId ?? ''),
      name: item.name ?? 'Unknown Item',
      price: Number(item.price ?? 0),
      quantity: Number(item.quantity ?? 1),
      subtotal: Number(item.subtotal ?? item.price * item.quantity ?? 0),
    })),
    totalAmount: Number(raw.totalAmount ?? raw.total ?? 0),
    status: raw.status ?? 'Pending',
    createdAt: raw.createdAt ?? new Date().toISOString(),
  };
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
        We couldn't locate this order. It may have been placed before this
        session, or the server may be temporarily unavailable.
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
  const { search, state: locationState } = useLocation();
  const navigate = useNavigate();
  const tableNumber = getTableFromSearch(search);

  const { getOrderById: getFromContext } = useOrders();

  const [order, setOrder] = useState(() => {
    // Priority 1: order passed directly from CheckoutPage via location.state
    if (locationState?.confirmedOrder) {
      return normaliseOrder(locationState.confirmedOrder);
    }
    // Priority 2: in-memory OrderContext (mock flow / previous commits)
    const contextOrder = getFromContext(orderId);
    return contextOrder ? normaliseOrder(contextOrder) : null;
  });

  const [isFetching, setIsFetching] = useState(!order); // only fetch if not already resolved
  const [fetchError, setFetchError] = useState('');

  const handleBackToMenu = () => navigate(`/menu?table=${tableNumber}`);

  useEffect(() => {
    // If we already have the order (from state or context) skip the fetch
    if (order) {
      setIsFetching(false);
      return;
    }

    // Priority 3: fetch from backend (hard-refresh scenario)
    if (!orderId) {
      setIsFetching(false);
      return;
    }

    let cancelled = false;

    async function loadOrder() {
      try {
        const { order: fetched } = await fetchOrderById(orderId);
        if (!cancelled) {
          setOrder(normaliseOrder(fetched));
        }
      } catch (err) {
        if (!cancelled) {
          setFetchError(err.message || 'Failed to load order details.');
        }
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    }

    loadOrder();

    return () => {
      cancelled = true;
    };
  }, [orderId, order]);

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

        {/* Loading state */}
        {isFetching && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 text-[#82B895] animate-spin" />
            <p className="text-sm text-[#A8B3AA]">Loading your order…</p>
          </div>
        )}

        {/* Fetch error */}
        {!isFetching && fetchError && (
          <div
            role="alert"
            className="flex items-start gap-3 p-4 bg-rose-950/40 border border-rose-800/60 rounded-xl text-sm text-rose-300"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>{fetchError}</p>
          </div>
        )}

        {/* Order not found */}
        {!isFetching && !fetchError && !order && (
          <OrderNotFound onBackToMenu={handleBackToMenu} />
        )}

        {/* Order details */}
        {!isFetching && order && (
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
                <span className="text-sm font-black text-[#E5B86A] break-all leading-snug">
                  {order.id.length > 12
                    ? `…${order.id.slice(-8)}`
                    : `#${order.id}`}
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
              {/* Total row — server-confirmed amount */}
              <div className="px-5 py-4 border-t border-[#326B4B] bg-[#1A1E1C] flex justify-between items-center">
                <div>
                  <span className="font-bold text-[#F5F5F0]">Total Paid</span>
                  <span className="ml-2 text-[10px] text-[#82B895] font-medium">
                    (server-confirmed)
                  </span>
                </div>
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
                <strong className="text-[#F5F5F0]">Table {order.tableNumber}</strong>.{' '}
                No payment required at this step — settle at your convenience with the staff.
              </p>
            </div>

            {/* Navigation CTAs */}
            <div className="pb-4 space-y-3">
              <button
                id="view-in-kitchen-btn"
                type="button"
                onClick={() => navigate('/kitchen')}
                className="
                  w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl
                  bg-[#222825] hover:bg-[#2A332E] active:scale-[0.98]
                  text-[#E5B86A] text-sm font-bold
                  border border-[#38443C] hover:border-[#82B895] transition-all duration-200 cursor-pointer
                  focus:outline-none focus:ring-2 focus:ring-[#82B895]
                "
              >
                <ChefHat className="w-4 h-4 text-[#82B895]" />
                Track Order in Kitchen Display (Live KDS)
              </button>

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
            Order Confirmation • Commit 6
          </span>
          <span>Table #{tableNumber} Active</span>
        </div>
      </footer>
    </div>
  );
}

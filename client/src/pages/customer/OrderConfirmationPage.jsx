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

function StatusBadge({ status }) {
  const colours = {
    Pending: 'bg-amber-50 text-amber-800 border-amber-200',
    Preparing: 'bg-blue-50 text-blue-800 border-blue-200',
    Ready: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    Served: 'bg-[#EFF1EA] text-[#74796F] border-[#E6E8E1]',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
        colours[status] ?? colours.Pending
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {status}
    </span>
  );
}

function OrderNotFound({ onBackToMenu }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center max-w-sm mx-auto">
      <div className="w-16 h-16 rounded-xl bg-white border border-[#E6E8E1] flex items-center justify-center mb-4 shadow-xs">
        <UtensilsCrossed className="w-7 h-7 text-[#74796F]" />
      </div>
      <h2 className="text-xl font-bold text-[#20251F] mb-1.5">
        Order Not Found
      </h2>
      <p className="text-xs text-[#74796F] leading-relaxed mb-6">
        We couldn&apos;t locate this order. It may have been placed in another session.
      </p>
      <button
        type="button"
        onClick={onBackToMenu}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#526B50] hover:bg-[#40563F] text-white text-xs font-semibold transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Menu
      </button>
    </div>
  );
}

export default function OrderConfirmationPage() {
  const { orderId } = useParams();
  const { search, state: locationState } = useLocation();
  const navigate = useNavigate();
  const tableNumber = getTableFromSearch(search);

  const { getOrderById: getFromContext } = useOrders();

  const [order, setOrder] = useState(() => {
    if (locationState?.confirmedOrder) {
      return normaliseOrder(locationState.confirmedOrder);
    }
    const contextOrder = getFromContext(orderId);
    return contextOrder ? normaliseOrder(contextOrder) : null;
  });

  const [isFetching, setIsFetching] = useState(!order);
  const [fetchError, setFetchError] = useState('');

  const handleBackToMenu = () => navigate(`/menu?table=${tableNumber}`);

  useEffect(() => {
    if (order) {
      setIsFetching(false);
      return;
    }

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
    <div className="min-h-screen bg-[#F7F7F4] text-[#20251F] flex flex-col font-sans">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E6E8E1]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <button
            type="button"
            onClick={handleBackToMenu}
            aria-label="Back to menu"
            className="p-2 rounded-md bg-[#FAFBF8] border border-[#E6E8E1] hover:bg-[#EFF1EA] text-[#74796F] hover:text-[#20251F] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <span className="text-base font-bold text-[#20251F] block leading-none">
              Dinning Room
            </span>
            <span className="text-xs text-[#74796F] block leading-none mt-0.5">
              Order Confirmation
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {isFetching && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 text-[#526B50] animate-spin" />
            <p className="text-xs text-[#74796F]">Retrieving confirmed order…</p>
          </div>
        )}

        {!isFetching && fetchError && (
          <div
            role="alert"
            className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
            <p>{fetchError}</p>
          </div>
        )}

        {!isFetching && !fetchError && !order && (
          <OrderNotFound onBackToMenu={handleBackToMenu} />
        )}

        {!isFetching && order && (
          <>
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#20251F] mb-1">
                Order Received!
              </h1>
              <p className="text-xs sm:text-sm text-[#74796F] max-w-sm leading-relaxed">
                Your order is confirmed and sent directly to the kitchen for preparation.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white border border-[#E6E8E1] rounded-xl p-3.5 flex flex-col gap-1 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs text-[#74796F]">
                  <Hash className="w-3.5 h-3.5" />
                  Order ID
                </div>
                <span className="text-sm font-bold text-[#526B50] truncate">
                  #{order.id.slice(-6)}
                </span>
              </div>

              <div className="bg-white border border-[#E6E8E1] rounded-xl p-3.5 flex flex-col gap-1 shadow-xs">
                <div className="text-xs text-[#74796F]">Table</div>
                <span className="text-sm font-bold text-[#20251F]">
                  #{order.tableNumber}
                </span>
              </div>

              <div className="bg-white border border-[#E6E8E1] rounded-xl p-3.5 flex flex-col gap-1 shadow-xs">
                <div className="text-xs text-[#74796F]">Status</div>
                <StatusBadge status={order.status} />
              </div>

              <div className="bg-white border border-[#E6E8E1] rounded-xl p-3.5 flex flex-col gap-1 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs text-[#74796F]">
                  <Clock className="w-3.5 h-3.5" />
                  Placed
                </div>
                <span className="text-xs font-semibold text-[#20251F]">
                  {formatTime(order.createdAt)}
                </span>
              </div>
            </div>

            <div className="bg-white border border-[#E6E8E1] rounded-xl overflow-hidden shadow-xs">
              <div className="px-5 py-3.5 border-b border-[#E6E8E1] bg-[#FAFBF8]">
                <h2 className="text-sm font-bold text-[#20251F]">
                  Items Ordered
                </h2>
              </div>
              <ul className="divide-y divide-[#E6E8E1]">
                {order.items.map((item, idx) => (
                  <li
                    key={`${item.foodId}-${idx}`}
                    className="flex items-center justify-between px-5 py-3.5 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#20251F]">{item.name}</span>
                      <span className="text-xs text-[#74796F]">× {item.quantity}</span>
                    </div>
                    <span className="font-semibold text-[#20251F]">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="px-5 py-4 border-t border-[#E6E8E1] bg-[#FAFBF8] flex justify-between items-center">
                <div>
                  <span className="text-sm font-bold text-[#20251F]">Total Amount</span>
                  <span className="ml-2 text-[10px] text-emerald-700 font-medium">
                    (confirmed)
                  </span>
                </div>
                <span className="text-xl font-extrabold text-[#526B50]">
                  ₹{order.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-[#EFF1EA] border border-[#E6E8E1] rounded-xl">
              <UtensilsCrossed className="w-4 h-4 text-[#526B50] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[#74796F] leading-relaxed">
                Your dishes will be served fresh at <strong className="text-[#20251F]">Table #{order.tableNumber}</strong>. You can settle the payment with your host after dining.
              </p>
            </div>

            <div className="pt-2 space-y-2.5">
              <button
                type="button"
                onClick={() => navigate('/kitchen')}
                className="
                  w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md
                  bg-white hover:bg-[#EFF1EA] text-[#20251F] text-xs font-semibold
                  border border-[#E6E8E1] transition-colors cursor-pointer shadow-xs
                "
              >
                <ChefHat className="w-4 h-4 text-[#526B50]" />
                Track in Kitchen Display
              </button>

              <button
                type="button"
                onClick={handleBackToMenu}
                className="
                  w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md
                  bg-[#526B50] hover:bg-[#40563F] text-white text-xs font-semibold
                  transition-colors cursor-pointer shadow-xs
                "
              >
                <ArrowLeft className="w-4 h-4" />
                Return to Menu
              </button>
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-[#E6E8E1] bg-white py-4 text-xs text-[#74796F]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex items-center justify-center">
          <span>Dinning Room · Order Confirmation</span>
        </div>
      </footer>
    </div>
  );
}

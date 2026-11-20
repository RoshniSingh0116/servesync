import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChefHat,
  Clock,
  Flame,
  Bell,
  CheckCheck,
  CheckCircle2,
  RefreshCw,
  Search,
  LayoutGrid,
  Columns,
  Utensils,
  X,
  ArrowLeft,
  Shield,
  AlertCircle,
  Loader2,
  Check,
} from 'lucide-react';
import OrderCard from '../../components/admin/OrderCard';
import { STATUS_TRANSITIONS } from '../../mocks/mockOrders';
import {
  fetchAllKitchenOrders,
  patchKitchenOrderStatus,
} from '../../api/kitchenApi';

export default function KitchenDashboardPage() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [updatingOrders, setUpdatingOrders] = useState({});

  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [sortOrder, setSortOrder] = useState('lifo');

  const [currentTime, setCurrentTime] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, []);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await fetchAllKitchenOrders();
      setOrders(data);
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.message ||
        'Failed to load orders. Please check your connection.';
      setFetchError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const orderCounts = useMemo(() => {
    const counts = {
      total: orders.length,
      pending: orders.filter((o) => o.status === 'Pending').length,
      preparing: orders.filter((o) => o.status === 'Preparing').length,
      ready: orders.filter((o) => o.status === 'Ready').length,
      served: orders.filter((o) => o.status === 'Served').length,
    };
    counts.active = counts.pending + counts.preparing + counts.ready;
    return counts;
  }, [orders]);

  const handleStatusChange = useCallback(async (orderId, nextStatus) => {
    if (updatingOrders[orderId]) return;

    const targetOrder = orders.find((o) => String(o.id) === String(orderId));
    if (!targetOrder) return;

    const expectedNext = STATUS_TRANSITIONS[targetOrder.status];
    if (expectedNext !== nextStatus) {
      showToast(
        `Invalid status transition: ${targetOrder.status} → ${nextStatus}`,
        'error'
      );
      return;
    }

    setUpdatingOrders((prev) => ({ ...prev, [orderId]: true }));

    try {
      const updatedOrder = await patchKitchenOrderStatus(String(orderId), nextStatus);

      setOrders((prev) =>
        prev.map((o) => (String(o.id) === String(orderId) ? updatedOrder : o))
      );

      showToast(
        `Order #${typeof orderId === 'string' && orderId.length > 10 ? orderId.slice(-6) : orderId} (Table #${targetOrder.tableNumber}) → ${nextStatus}`,
        'success'
      );
    } catch (err) {
      const backendMessage =
        err?.response?.data?.error ||
        err?.message ||
        'Failed to update order status. Please try again.';
      showToast(backendMessage, 'error');
    } finally {
      setUpdatingOrders((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
    }
  }, [orders, updatingOrders, showToast]);

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (selectedStatusFilter !== 'All') {
      result = result.filter((o) => o.status === selectedStatusFilter);
    }

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((order) => {
        const shortId = typeof order.id === 'string' && order.id.length > 10
          ? order.id.slice(-6)
          : String(order.id);
        const matchesId =
          String(order.id).toLowerCase().includes(query) ||
          shortId.toLowerCase().includes(query);
        const matchesTable =
          `table ${order.tableNumber}`.toLowerCase().includes(query) ||
          String(order.tableNumber).toLowerCase() === query;
        const matchesItems = order.items?.some((item) =>
          item.name?.toLowerCase().includes(query)
        );
        return matchesId || matchesTable || matchesItems;
      });
    }

    result.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return sortOrder === 'fifo' ? timeA - timeB : timeB - timeA;
    });

    return result;
  }, [orders, selectedStatusFilter, searchQuery, sortOrder]);

  const columnsData = useMemo(() => {
    const base = searchQuery ? filteredOrders : orders;
    return {
      Pending: base.filter((o) => o.status === 'Pending'),
      Preparing: base.filter((o) => o.status === 'Preparing'),
      Ready: base.filter((o) => o.status === 'Ready'),
      Served: base.filter((o) => o.status === 'Served'),
    };
  }, [orders, filteredOrders, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F7F7F4] text-[#20251F] flex flex-col font-sans">
      <header className="sticky top-0 z-40 bg-white border-b border-[#E6E8E1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#526B50] text-white flex items-center justify-center shadow-xs">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-[#20251F] leading-none">
                    Dinning Room
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-[#EFF1EA] border border-[#E6E8E1] text-[10px] font-semibold text-[#526B50] uppercase tracking-wider">
                    Kitchen KDS
                  </span>
                </div>
                <p className="text-[11px] text-[#74796F] font-medium mt-0.5">
                  Live Ticket Display Station
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#FAFBF8] border border-[#E6E8E1] text-xs">
                <Clock className="w-3.5 h-3.5 text-[#526B50]" />
                <span className="font-mono font-bold text-[#20251F]">
                  {currentTime.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>

              <button
                type="button"
                onClick={loadOrders}
                disabled={isLoading}
                title="Refresh orders from server"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-[#E6E8E1] hover:bg-[#EFF1EA] text-xs font-semibold text-[#20251F] transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#526B50] ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/menu')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-[#E6E8E1] hover:bg-[#EFF1EA] text-xs font-semibold text-[#74796F] hover:text-[#20251F] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Menu</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/admin/dashboard')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#526B50] hover:bg-[#40563F] text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs"
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="bg-white border-b border-[#E6E8E1] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('All')}
              className={`p-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                selectedStatusFilter === 'All'
                  ? 'bg-[#EFF1EA] border-[#526B50]'
                  : 'bg-[#FAFBF8] border-[#E6E8E1] hover:bg-[#EFF1EA]'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-[#74796F] mb-1 font-semibold">
                <span>All Orders</span>
                <Utensils className="w-3.5 h-3.5 text-[#526B50]" />
              </div>
              <div className="text-2xl font-bold text-[#20251F]">
                {isLoading ? '—' : orderCounts.total}
              </div>
              <span className="text-[11px] text-[#74796F]">Total received</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatusFilter('Pending')}
              className={`p-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                selectedStatusFilter === 'Pending'
                  ? 'bg-amber-50 border-amber-400'
                  : 'bg-[#FAFBF8] border-[#E6E8E1] hover:bg-amber-50/50'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-amber-800 mb-1 font-semibold">
                <span>Pending</span>
                <Flame className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-amber-900">
                {isLoading ? '—' : orderCounts.pending}
              </div>
              <span className="text-[11px] text-amber-700">Needs prep</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatusFilter('Preparing')}
              className={`p-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                selectedStatusFilter === 'Preparing'
                  ? 'bg-blue-50 border-blue-400'
                  : 'bg-[#FAFBF8] border-[#E6E8E1] hover:bg-blue-50/50'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-blue-800 mb-1 font-semibold">
                <span>Preparing</span>
                <Bell className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {isLoading ? '—' : orderCounts.preparing}
              </div>
              <span className="text-[11px] text-blue-700">On stove</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatusFilter('Ready')}
              className={`p-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                selectedStatusFilter === 'Ready'
                  ? 'bg-emerald-50 border-emerald-400'
                  : 'bg-[#FAFBF8] border-[#E6E8E1] hover:bg-emerald-50/50'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-emerald-800 mb-1 font-semibold">
                <span>Ready</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-emerald-900">
                {isLoading ? '—' : orderCounts.ready}
              </div>
              <span className="text-[11px] text-emerald-700">Ready to serve</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatusFilter('Served')}
              className={`p-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                selectedStatusFilter === 'Served'
                  ? 'bg-[#EFF1EA] border-[#CBD0C5]'
                  : 'bg-[#FAFBF8] border-[#E6E8E1] hover:bg-[#EFF1EA]'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-[#74796F] mb-1 font-semibold">
                <span>Served</span>
                <CheckCheck className="w-3.5 h-3.5 text-[#74796F]" />
              </div>
              <div className="text-2xl font-bold text-[#20251F]">
                {isLoading ? '—' : orderCounts.served}
              </div>
              <span className="text-[11px] text-[#74796F]">Completed</span>
            </button>
          </div>
        </div>
      </section>

      <section className="sticky top-16 sm:top-18 z-30 bg-[#F7F7F4]/95 backdrop-blur-md border-b border-[#E6E8E1] py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#74796F]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticket #, table number, or dish…"
                className="w-full pl-9 pr-8 py-2 rounded-md bg-white border border-[#E6E8E1] text-xs text-[#20251F] placeholder:text-[#74796F] focus:outline-none focus:border-[#526B50] focus:ring-2 focus:ring-[#526B50]/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#74796F] hover:text-[#20251F]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-md border border-[#E6E8E1] bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-sm ${
                    viewMode === 'grid'
                      ? 'bg-[#526B50] text-white'
                      : 'text-[#74796F] hover:text-[#20251F]'
                  }`}
                  title="Grid view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('columns')}
                  className={`p-1.5 rounded-sm ${
                    viewMode === 'columns'
                      ? 'bg-[#526B50] text-white'
                      : 'text-[#74796F] hover:text-[#20251F]'
                  }`}
                  title="Pipeline column view"
                >
                  <Columns className="w-4 h-4" />
                </button>
              </div>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="px-2.5 py-1.5 rounded-md bg-white border border-[#E6E8E1] text-xs font-semibold text-[#20251F] focus:outline-none focus:border-[#526B50]"
              >
                <option value="lifo">Newest First</option>
                <option value="fifo">Oldest First (FIFO)</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-[#526B50] animate-spin mb-3" />
            <p className="text-xs text-[#74796F]">Loading active kitchen tickets…</p>
          </div>
        )}

        {!isLoading && fetchError && (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl bg-white border border-[#E6E8E1] max-w-md mx-auto shadow-xs">
            <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
            <h3 className="text-sm font-bold text-[#20251F] mb-1">Could not load tickets</h3>
            <p className="text-xs text-[#74796F] mb-4">{fetchError}</p>
            <button
              type="button"
              onClick={loadOrders}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-[#526B50] text-white hover:bg-[#40563F]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </button>
          </div>
        )}

        {!isLoading && !fetchError && (
          <>
            {viewMode === 'grid' ? (
              filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-xl bg-white border border-[#E6E8E1] border-dashed">
                  <ChefHat className="w-8 h-8 text-[#74796F] opacity-40 mb-2" />
                  <h3 className="text-sm font-bold text-[#20251F] mb-1">No Orders in this view</h3>
                  <p className="text-xs text-[#74796F]">
                    {searchQuery ? 'Try clearing your search query.' : 'New orders will appear here automatically.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filteredOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onStatusChange={handleStatusChange}
                      isUpdating={Boolean(updatingOrders[order.id])}
                    />
                  ))}
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                {['Pending', 'Preparing', 'Ready', 'Served'].map((colStatus) => {
                  const colOrders = columnsData[colStatus] || [];
                  const colHeaderColors = {
                    Pending: 'bg-amber-50 text-amber-800 border-amber-200',
                    Preparing: 'bg-blue-50 text-blue-800 border-blue-200',
                    Ready: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                    Served: 'bg-[#EFF1EA] text-[#74796F] border-[#E6E8E1]',
                  }[colStatus];

                  return (
                    <div
                      key={colStatus}
                      className="bg-white border border-[#E6E8E1] rounded-xl p-3 space-y-3"
                    >
                      <div className={`px-3 py-1.5 rounded-lg border flex items-center justify-between font-bold text-xs ${colHeaderColors}`}>
                        <span>{colStatus}</span>
                        <span className="w-5 h-5 rounded-full bg-white text-[#20251F] flex items-center justify-center text-[11px] font-bold shadow-2xs">
                          {colOrders.length}
                        </span>
                      </div>

                      <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
                        {colOrders.map((order) => (
                          <OrderCard
                            key={order.id}
                            order={order}
                            onStatusChange={handleStatusChange}
                            isUpdating={Boolean(updatingOrders[order.id])}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="mt-auto border-t border-[#E6E8E1] bg-white py-4 text-xs text-[#74796F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Dinning Room · Kitchen Display Station</span>
          <span>Pending → Preparing → Ready → Served</span>
        </div>
      </footer>

      {toast && (
        <div
          role="status"
          className={`
            fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-lg
            border shadow-md transition-all duration-200 text-xs font-semibold
            ${toast.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-white text-[#20251F] border-[#E6E8E1]'}
          `}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

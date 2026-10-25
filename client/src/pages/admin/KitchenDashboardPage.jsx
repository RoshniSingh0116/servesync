import { useState, useMemo, useEffect } from 'react';
import {
  ChefHat,
  Clock,
  Flame,
  Bell,
  CheckCheck,
  CheckCircle2,
  RotateCcw,
  Search,
  LayoutGrid,
  Columns,
  Utensils,
  X,
  Filter,
  Check,
} from 'lucide-react';
import OrderCard from '../../components/admin/OrderCard';
import {
  INITIAL_MOCK_ORDERS,
  STATUS_BADGE_STYLES,
  STATUS_TRANSITIONS,
} from '../../mocks/mockOrders';

/**
 * KitchenDashboardPage Component
 *
 * Professional Kitchen Display System (KDS) for ServeSync (Member 4).
 * Allows kitchen staff to monitor, organize, and advance order tickets
 * through the lifecycle: Pending → Preparing → Ready → Served.
 *
 * Fully decoupled: can receive `orders` and `onUpdateStatus` via props from
 * a future shared context, or default to self-contained mock data.
 *
 * @param {Object} props
 * @param {Array} [props.orders] - Optional orders array from parent / CartContext
 * @param {Function} [props.onUpdateStatus] - Optional callback (orderId, newStatus) => void
 */
export default function KitchenDashboardPage({
  orders: externalOrdersProp,
  onUpdateStatus: externalUpdateStatus,
}) {
  // 1. Orders State: Default to internal mock orders if external prop not passed
  const [localOrders, setLocalOrders] = useState(INITIAL_MOCK_ORDERS);
  const orders = externalOrdersProp || localOrders;

  // 2. Filter & View Controls State
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('Active'); // 'Active' | 'All' | 'Pending' | 'Preparing' | 'Ready' | 'Served'
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'columns'
  const [sortOrder, setSortOrder] = useState('fifo'); // 'fifo' (oldest first) | 'lifo' (newest first)

  // 3. Live Clock State for Kitchen Staff
  const [currentTime, setCurrentTime] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 4. Toast Feedback State
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 2800);
  };

  // 5. Dynamic Order Counts (Calculated dynamically, never hardcoded)
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

  // 6. Status Transition Handler (Strictly validates linear flow)
  const handleStatusChange = (orderId, nextStatus) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    // Validate valid transition: Pending -> Preparing -> Ready -> Served
    const expectedNext = STATUS_TRANSITIONS[targetOrder.status];
    if (expectedNext !== nextStatus) {
      console.warn(
        `[ServeSync KDS] Blocked invalid transition: ${targetOrder.status} -> ${nextStatus}`
      );
      return;
    }

    // Update state immediately (if using local state)
    if (!externalOrdersProp) {
      setLocalOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: nextStatus } : order
        )
      );
    }

    // Call external handler if provided (for future integrator / CartContext)
    if (typeof externalUpdateStatus === 'function') {
      externalUpdateStatus(orderId, nextStatus);
    }

    // Visual feedback toast
    showToast(
      `Order #${targetOrder.id} (Table ${targetOrder.tableNumber}) marked as ${nextStatus}!`,
      'success'
    );
  };

  // 7. Reset Mock Data (Convenient for evaluators/testers)
  const handleResetData = () => {
    setLocalOrders(INITIAL_MOCK_ORDERS);
    setSelectedStatusFilter('Active');
    setSearchQuery('');
    showToast('Mock orders reloaded to initial state', 'info');
  };

  // 8. Filter and Sort Orders
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Status filter
    if (selectedStatusFilter === 'Active') {
      result = result.filter(
        (o) => o.status === 'Pending' || o.status === 'Preparing' || o.status === 'Ready'
      );
    } else if (selectedStatusFilter !== 'All') {
      result = result.filter((o) => o.status === selectedStatusFilter);
    }

    // Search query filter (matches Order #, Table #, or dish item name)
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((order) => {
        const matchesId = String(order.id).toLowerCase().includes(query);
        const matchesTable = `table ${order.tableNumber}`.toLowerCase().includes(query) ||
          String(order.tableNumber).toLowerCase() === query;
        const matchesItems = order.items?.some((item) =>
          item.name?.toLowerCase().includes(query)
        );
        return matchesId || matchesTable || matchesItems;
      });
    }

    // Sort order: FIFO (Oldest first) is restaurant standard, LIFO is newest first
    result.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return sortOrder === 'fifo' ? timeA - timeB : timeB - timeA;
    });

    return result;
  }, [orders, selectedStatusFilter, searchQuery, sortOrder]);

  // Grouped orders for Kanban / Column view
  const columnsData = useMemo(() => {
    const baseList = searchQuery
      ? filteredOrders
      : orders; // In column view, columns categorize by status
    return {
      Pending: baseList.filter((o) => o.status === 'Pending'),
      Preparing: baseList.filter((o) => o.status === 'Preparing'),
      Ready: baseList.filter((o) => o.status === 'Ready'),
      Served: baseList.filter((o) => o.status === 'Served'),
    };
  }, [orders, filteredOrders, searchQuery]);

  return (
    <div className="min-h-screen bg-[#171A19] text-[#F5F5F0] flex flex-col font-sans selection:bg-[#24543A] selection:text-[#F5F0E6]">
      {/* ─────────────────────────────────────────────────────────────
          A. KDS NAVIGATION / HEADER
      ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#171A19]/95 backdrop-blur-md border-b border-[#38443C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Brand Logo & Station Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#24543A] to-[#171A19] border border-[#326B4B] flex items-center justify-center shadow-md">
                <ChefHat className="w-5 h-5 text-[#E5B86A]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#F5F5F0] leading-none">
                    Serve<span className="text-[#E5B86A]">Sync</span>
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-[#24543A]/40 border border-[#326B4B] text-[10px] font-bold text-[#82B895] uppercase tracking-wider">
                    Kitchen KDS
                  </span>
                </div>
                <p className="text-[11px] text-[#A8B3AA] tracking-wide font-medium mt-0.5">
                  Live Kitchen Order Display Station
                </p>
              </div>
            </div>

            {/* Live Clock & Station Pulse */}
            <div className="flex items-center gap-4">
              {/* Live Clock */}
              <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#222825] border border-[#38443C] text-xs">
                <Clock className="w-4 h-4 text-[#82B895]" />
                <span className="font-mono font-bold text-[#F5F5F0]">
                  {currentTime.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
                <span className="text-[#A8B3AA] ml-1">Live Service</span>
              </div>

              {/* Reset Mock Data Button */}
              <button
                type="button"
                onClick={handleResetData}
                title="Reset mock orders to initial state"
                aria-label="Reset mock data"
                className="
                  inline-flex items-center gap-1.5 px-3 py-2 rounded-xl
                  bg-[#222825] border border-[#38443C] hover:border-[#82B895]
                  text-xs font-semibold text-[#A8B3AA] hover:text-[#F5F5F0]
                  transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#82B895]
                "
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#E5B86A]" />
                <span className="hidden sm:inline">Reset Demo</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          B. STATS OVERVIEW CARDS (Calculated dynamically)
      ───────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-[#222825] to-[#171A19] border-b border-[#38443C] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Total Active Orders */}
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('Active')}
              className={`
                p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer
                focus:outline-none focus:ring-2 focus:ring-[#82B895]
                ${
                  selectedStatusFilter === 'Active'
                    ? 'bg-[#24543A]/30 border-[#82B895] shadow-md shadow-[#24543A]/20'
                    : 'bg-[#222825] border-[#38443C] hover:border-[#82B895]/50'
                }
              `}
            >
              <div className="flex items-center justify-between text-xs text-[#A8B3AA] mb-1 font-semibold">
                <span>Active Queue</span>
                <Utensils className="w-4 h-4 text-[#82B895]" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#F5F5F0]">
                {orderCounts.active}
              </div>
              <span className="text-[11px] text-[#A8B3AA]">Pending, Prep & Ready</span>
            </button>

            {/* Pending Orders */}
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('Pending')}
              className={`
                p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer
                focus:outline-none focus:ring-2 focus:ring-[#E5B86A]
                ${
                  selectedStatusFilter === 'Pending'
                    ? 'bg-amber-950/40 border-[#E5B86A] shadow-md shadow-amber-900/20'
                    : 'bg-[#222825] border-[#38443C] hover:border-[#E5B86A]/50'
                }
              `}
            >
              <div className="flex items-center justify-between text-xs text-[#A8B3AA] mb-1 font-semibold">
                <span>Pending</span>
                <Flame className="w-4 h-4 text-[#E5B86A]" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#E5B86A]">
                {orderCounts.pending}
              </div>
              <span className="text-[11px] text-[#A8B3AA]">Awaiting prep</span>
            </button>

            {/* Preparing Orders */}
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('Preparing')}
              className={`
                p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer
                focus:outline-none focus:ring-2 focus:ring-[#3B82F6]
                ${
                  selectedStatusFilter === 'Preparing'
                    ? 'bg-blue-950/40 border-[#3B82F6] shadow-md shadow-blue-900/20'
                    : 'bg-[#222825] border-[#38443C] hover:border-[#3B82F6]/50'
                }
              `}
            >
              <div className="flex items-center justify-between text-xs text-[#A8B3AA] mb-1 font-semibold">
                <span>Preparing</span>
                <Bell className="w-4 h-4 text-[#60A5FA]" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#93C5FD]">
                {orderCounts.preparing}
              </div>
              <span className="text-[11px] text-[#A8B3AA]">On stove / in oven</span>
            </button>

            {/* Ready Orders */}
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('Ready')}
              className={`
                p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer
                focus:outline-none focus:ring-2 focus:ring-[#82B895]
                ${
                  selectedStatusFilter === 'Ready'
                    ? 'bg-[#24543A]/40 border-[#82B895] shadow-md shadow-[#24543A]/20'
                    : 'bg-[#222825] border-[#38443C] hover:border-[#82B895]/50'
                }
              `}
            >
              <div className="flex items-center justify-between text-xs text-[#A8B3AA] mb-1 font-semibold">
                <span>Ready for Pickup</span>
                <CheckCircle2 className="w-4 h-4 text-[#82B895]" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#82B895]">
                {orderCounts.ready}
              </div>
              <span className="text-[11px] text-[#A8B3AA]">Pass to runners</span>
            </button>

            {/* Served Orders */}
            <button
              type="button"
              onClick={() => setSelectedStatusFilter('Served')}
              className={`
                p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer
                col-span-2 sm:col-span-1 focus:outline-none focus:ring-2 focus:ring-[#A8B3AA]
                ${
                  selectedStatusFilter === 'Served'
                    ? 'bg-[#222825] border-[#F5F5F0] shadow-md'
                    : 'bg-[#222825] border-[#38443C] hover:border-[#A8B3AA]'
                }
              `}
            >
              <div className="flex items-center justify-between text-xs text-[#A8B3AA] mb-1 font-semibold">
                <span>Served Today</span>
                <CheckCheck className="w-4 h-4 text-[#A8B3AA]" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#A8B3AA]">
                {orderCounts.served}
              </div>
              <span className="text-[11px] text-[#A8B3AA]">Delivered to tables</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          C. FILTER BAR & VIEW CONTROLS
      ───────────────────────────────────────────────────────────── */}
      <section className="sticky top-16 sm:top-20 z-30 bg-[#171A19]/95 backdrop-blur-md border-b border-[#38443C] py-3.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {[
                { id: 'Active', label: 'Active', count: orderCounts.active },
                { id: 'All', label: 'All', count: orderCounts.total },
                { id: 'Pending', label: 'Pending', count: orderCounts.pending },
                { id: 'Preparing', label: 'Preparing', count: orderCounts.preparing },
                { id: 'Ready', label: 'Ready', count: orderCounts.ready },
                { id: 'Served', label: 'Served', count: orderCounts.served },
              ].map((tab) => {
                const isActive = selectedStatusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedStatusFilter(tab.id)}
                    className={`
                      inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold
                      border transition-all duration-150 shrink-0 cursor-pointer
                      focus:outline-none focus:ring-2 focus:ring-[#82B895]
                      ${
                        isActive
                          ? 'bg-[#24543A] text-[#F5F0E6] border-[#326B4B] shadow-sm'
                          : 'bg-[#222825] text-[#A8B3AA] border-[#38443C] hover:text-[#F5F5F0] hover:border-[#82B895]/40'
                      }
                    `}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`
                        inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full text-[10px] font-bold
                        ${
                          isActive
                            ? 'bg-[#171A19] text-[#E5B86A]'
                            : 'bg-[#171A19] text-[#A8B3AA]'
                        }
                      `}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right Tools: Search, View Switch, Sort */}
            <div className="flex items-center gap-2.5">
              {/* Quick Search */}
              <div className="relative flex-1 sm:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A8B3AA]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Order #, Table, dish..."
                  aria-label="Filter orders by order id, table number, or food name"
                  className="
                    w-full pl-8 pr-8 py-1.5 rounded-xl bg-[#222825] border border-[#38443C]
                    text-xs text-[#F5F5F0] placeholder-[#A8B3AA] transition-colors
                    focus:outline-none focus:border-[#82B895] focus:ring-1 focus:ring-[#82B895]
                  "
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search query"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A8B3AA] hover:text-[#F5F5F0] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* FIFO / LIFO Sort Toggle */}
              <button
                type="button"
                onClick={() => setSortOrder((prev) => (prev === 'fifo' ? 'lifo' : 'fifo'))}
                title={`Sort: ${sortOrder === 'fifo' ? 'Oldest First (FIFO)' : 'Newest First'}`}
                className="
                  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                  bg-[#222825] border border-[#38443C] text-xs font-medium text-[#A8B3AA]
                  hover:text-[#F5F5F0] hover:border-[#82B895]/50 transition-colors cursor-pointer
                  focus:outline-none focus:ring-2 focus:ring-[#82B895]
                "
              >
                <Filter className="w-3.5 h-3.5 text-[#E5B86A]" />
                <span className="hidden sm:inline">
                  {sortOrder === 'fifo' ? 'FIFO (Oldest)' : 'Newest First'}
                </span>
              </button>

              {/* View Switch: Grid vs Columns */}
              <div className="flex items-center bg-[#222825] border border-[#38443C] rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  aria-label="Switch to Grid View"
                  className={`
                    p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer
                    ${
                      viewMode === 'grid'
                        ? 'bg-[#24543A] text-[#F5F0E6] shadow-sm'
                        : 'text-[#A8B3AA] hover:text-[#F5F5F0]'
                    }
                  `}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('columns')}
                  aria-label="Switch to Columns (Kanban) View"
                  className={`
                    p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer
                    ${
                      viewMode === 'columns'
                        ? 'bg-[#24543A] text-[#F5F0E6] shadow-sm'
                        : 'text-[#A8B3AA] hover:text-[#F5F5F0]'
                    }
                  `}
                >
                  <Columns className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          D. MAIN ORDER TICKET DISPLAY AREA
      ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Active Filter Pill Bar (if filtering) */}
        {(selectedStatusFilter !== 'Active' || searchQuery) && (
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4 pb-2 border-b border-[#38443C]">
            <div className="flex items-center gap-2 text-xs text-[#A8B3AA]">
              <span>Active filters:</span>
              <span className="px-2.5 py-0.5 rounded-md bg-[#222825] border border-[#38443C] text-[#F5F5F0] font-medium">
                Status: {selectedStatusFilter}
              </span>
              {searchQuery && (
                <span className="px-2.5 py-0.5 rounded-md bg-[#222825] border border-[#38443C] text-[#E5B86A] font-medium">
                  "{searchQuery}"
                </span>
              )}
              <span className="text-[#82B895]">({filteredOrders.length} orders found)</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedStatusFilter('Active');
                setSearchQuery('');
              }}
              className="text-xs text-[#E5B86A] hover:underline cursor-pointer"
            >
              Reset to Active
            </button>
          </div>
        )}

        {/* 1. GRID VIEW MODE */}
        {viewMode === 'grid' && (
          <>
            {filteredOrders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            ) : (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl bg-[#222825] border border-[#38443C] my-6">
                <div className="w-14 h-14 rounded-2xl bg-[#171A19] border border-[#38443C] flex items-center justify-center text-[#A8B3AA] mb-4">
                  <Utensils className="w-7 h-7 text-[#E5B86A] opacity-60" />
                </div>
                <h3 className="text-lg font-bold text-[#F5F5F0] mb-1">
                  No orders found
                </h3>
                <p className="text-xs text-[#A8B3AA] max-w-sm mb-5 leading-relaxed">
                  {searchQuery
                    ? `No orders match "${searchQuery}" in ${selectedStatusFilter} status.`
                    : selectedStatusFilter === 'Active'
                    ? 'All active orders are currently caught up! The kitchen is clear.'
                    : `No orders currently in "${selectedStatusFilter}" status.`}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStatusFilter('Active');
                    setSearchQuery('');
                  }}
                  className="
                    inline-flex items-center gap-2 px-4 py-2 rounded-xl
                    bg-[#24543A] hover:bg-[#326B4B] text-[#F5F0E6] text-xs font-semibold
                    border border-[#326B4B] transition-colors cursor-pointer
                  "
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Show All Active Orders</span>
                </button>
              </div>
            )}
          </>
        )}

        {/* 2. COLUMNS / KANBAN VIEW MODE */}
        {viewMode === 'columns' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
            {/* Column 1: Pending */}
            <div className="bg-[#1C211F] rounded-2xl border border-[#38443C] p-3.5 flex flex-col gap-3 min-h-[450px]">
              <div className="flex items-center justify-between pb-2 border-b border-[#38443C]">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#E5B86A]" />
                  <h3 className="text-sm font-bold text-[#F5F5F0]">Pending</h3>
                </div>
                <span
                  style={{
                    backgroundColor: STATUS_BADGE_STYLES.Pending.bg,
                    color: STATUS_BADGE_STYLES.Pending.text,
                  }}
                  className="px-2 py-0.5 rounded-full text-[11px] font-extrabold"
                >
                  {columnsData.Pending.length}
                </span>
              </div>
              <div className="space-y-3.5">
                {columnsData.Pending.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={handleStatusChange}
                  />
                ))}
                {columnsData.Pending.length === 0 && (
                  <p className="text-center text-xs text-[#A8B3AA] py-10 opacity-70">
                    No pending orders
                  </p>
                )}
              </div>
            </div>

            {/* Column 2: Preparing */}
            <div className="bg-[#1C211F] rounded-2xl border border-[#38443C] p-3.5 flex flex-col gap-3 min-h-[450px]">
              <div className="flex items-center justify-between pb-2 border-b border-[#38443C]">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#60A5FA]" />
                  <h3 className="text-sm font-bold text-[#F5F5F0]">Preparing</h3>
                </div>
                <span
                  style={{
                    backgroundColor: STATUS_BADGE_STYLES.Preparing.bg,
                    color: STATUS_BADGE_STYLES.Preparing.text,
                  }}
                  className="px-2 py-0.5 rounded-full text-[11px] font-extrabold"
                >
                  {columnsData.Preparing.length}
                </span>
              </div>
              <div className="space-y-3.5">
                {columnsData.Preparing.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={handleStatusChange}
                  />
                ))}
                {columnsData.Preparing.length === 0 && (
                  <p className="text-center text-xs text-[#A8B3AA] py-10 opacity-70">
                    No orders being prepped
                  </p>
                )}
              </div>
            </div>

            {/* Column 3: Ready */}
            <div className="bg-[#1C211F] rounded-2xl border border-[#38443C] p-3.5 flex flex-col gap-3 min-h-[450px]">
              <div className="flex items-center justify-between pb-2 border-b border-[#38443C]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#82B895]" />
                  <h3 className="text-sm font-bold text-[#F5F5F0]">Ready for Pickup</h3>
                </div>
                <span
                  style={{
                    backgroundColor: STATUS_BADGE_STYLES.Ready.bg,
                    color: STATUS_BADGE_STYLES.Ready.text,
                  }}
                  className="px-2 py-0.5 rounded-full text-[11px] font-extrabold"
                >
                  {columnsData.Ready.length}
                </span>
              </div>
              <div className="space-y-3.5">
                {columnsData.Ready.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={handleStatusChange}
                  />
                ))}
                {columnsData.Ready.length === 0 && (
                  <p className="text-center text-xs text-[#A8B3AA] py-10 opacity-70">
                    No orders ready for pickup
                  </p>
                )}
              </div>
            </div>

            {/* Column 4: Served */}
            <div className="bg-[#1C211F] rounded-2xl border border-[#38443C] p-3.5 flex flex-col gap-3 min-h-[450px]">
              <div className="flex items-center justify-between pb-2 border-b border-[#38443C]">
                <div className="flex items-center gap-2">
                  <CheckCheck className="w-4 h-4 text-[#A8B3AA]" />
                  <h3 className="text-sm font-bold text-[#F5F5F0]">Served</h3>
                </div>
                <span
                  style={{
                    backgroundColor: STATUS_BADGE_STYLES.Served.bg,
                    color: STATUS_BADGE_STYLES.Served.text,
                  }}
                  className="px-2 py-0.5 rounded-full text-[11px] font-extrabold"
                >
                  {columnsData.Served.length}
                </span>
              </div>
              <div className="space-y-3.5">
                {columnsData.Served.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={handleStatusChange}
                  />
                ))}
                {columnsData.Served.length === 0 && (
                  <p className="text-center text-xs text-[#A8B3AA] py-10 opacity-70">
                    No completed orders
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ─────────────────────────────────────────────────────────────
          E. KITCHEN DASHBOARD FOOTER
      ───────────────────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-[#38443C] bg-[#222825] py-6 text-xs text-[#A8B3AA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#F5F5F0]">ServeSync</span>
            <span>•</span>
            <span>Kitchen Display System (KDS)</span>
            <span>•</span>
            <span className="text-[#E5B86A]">Member 4 Module</span>
          </div>
          <p className="text-center sm:text-right">
            Status Flow: Pending → Preparing → Ready → Served
          </p>
        </div>
      </footer>

      {/* ─────────────────────────────────────────────────────────────
          F. FLOATING TOAST NOTIFICATION
      ───────────────────────────────────────────────────────────── */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="
            fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl
            bg-[#24543A] text-[#F5F0E6] border border-[#326B4B] shadow-2xl animate-fade-in
          "
        >
          <Check className="w-4 h-4 text-[#82B895]" />
          <p className="text-xs font-semibold leading-tight">{toast.message}</p>
        </div>
      )}
    </div>
  );
}

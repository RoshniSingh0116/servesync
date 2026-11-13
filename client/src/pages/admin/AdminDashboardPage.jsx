/**
 * AdminDashboardPage.jsx
 * ServeSync — Admin Dashboard (Member 3, Commit 5)
 *
 * Fully integrated Admin Dashboard connected to:
 *  - GET  /api/admin/dashboard  (overview summary statistics)
 *  - GET  /api/admin/foods      (menu food items)
 *  - POST /api/foods            (add food item)
 *  - PUT  /api/foods/:id        (edit food item & toggle availability)
 *  - DELETE /api/foods/:id     (remove food item)
 *  - GET  /api/admin/orders     (orders overview list)
 *
 * Implements authentication guard, loading indicators, error handling,
 * empty state management, and real-time dashboard refreshes.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Plus,
  LogOut,
  Menu as MenuIcon,
  X,
  Utensils,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Star,
  ChevronRight,
  Leaf,
  ChefHat,
  ClipboardList,
  Clock,
  CheckCheck,
  Flame,
  Bell,
  RefreshCw,
  AlertCircle,
  Search,
  SlidersHorizontal,
  ExternalLink,
} from 'lucide-react';
import FoodTable from '../../components/admin/FoodTable';
import FoodForm from '../../components/admin/FoodForm';
import {
  getAdminDashboard,
  getAdminFoods,
  getAdminOrders,
  addFoodItem,
  updateFoodItem,
  deleteFoodItem,
  getAdminUser,
  clearAdminSession,
} from '../../services/adminApi';

/* ─── Sidebar nav links ─────────────────────────────────────────────── */
const NAV_LINKS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'menu', label: 'Menu Management', icon: UtensilsCrossed },
  { id: 'orders', label: 'Orders Overview', icon: ClipboardList },
];

/* ─── Sidebar Component ─────────────────────────────────────────────── */
function Sidebar({ activeSection, setActiveSection, onClose, onLogout, navigate, adminUser }) {
  return (
    <aside className="flex flex-col h-full bg-[#171A19] border-r border-[#38443C] w-64">
      {/* Brand */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-[#38443C]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#24543A] to-[#171A19] border border-[#326B4B] flex items-center justify-center shadow">
            <Utensils className="w-5 h-5 text-[#E5B86A]" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-[#F5F5F0] block leading-none">
              Serve<span className="text-[#E5B86A]">Sync</span>
            </span>
            <span className="text-[10px] text-[#A8B3AA] uppercase tracking-widest font-medium">
              Admin Portal
            </span>
          </div>
        </div>
        {/* Close button — mobile only */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="lg:hidden text-[#A8B3AA] hover:text-[#F5F5F0] p-1 rounded cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Admin User Badge */}
      {adminUser && (
        <div className="px-4 py-3 mx-3 mt-3 rounded-xl bg-[#222825] border border-[#38443C] flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#24543A] text-[#82B895] flex items-center justify-center text-xs font-bold uppercase">
            {adminUser.username?.[0] || 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[#F5F5F0] truncate leading-tight">
              {adminUser.username || 'Admin'}
            </p>
            <p className="text-[10px] text-[#82B895] capitalize font-medium leading-tight">
              {adminUser.role || 'Administrator'}
            </p>
          </div>
        </div>
      )}

      {/* Nav Links */}
      <nav aria-label="Admin navigation" className="flex-1 px-3 py-4 space-y-1">
        {NAV_LINKS.map(({ id, label, icon: Icon }) => {
          const isActive = activeSection === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                setActiveSection(id);
                onClose?.();
              }}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-150 cursor-pointer text-left
                focus:outline-none focus:ring-2 focus:ring-[#82B895]
                ${
                  isActive
                    ? 'bg-[#24543A] text-[#F5F5F0] border border-[#326B4B] shadow-md'
                    : 'text-[#A8B3AA] hover:text-[#F5F5F0] hover:bg-[#222825]'
                }
              `}
            >
              <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-[#E5B86A]' : ''}`} />
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#82B895]" />}
            </button>
          );
        })}

        {/* Demo Jump Links */}
        <div className="pt-4 mt-4 border-t border-[#38443C]/60 space-y-1">
          <p className="px-3 text-[10px] uppercase font-bold text-[#68736A] tracking-wider mb-2">
            Quick Views
          </p>
          <button
            type="button"
            onClick={() => navigate('/menu')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#A8B3AA] hover:text-[#F5F5F0] hover:bg-[#222825] cursor-pointer"
          >
            <Utensils className="w-4 h-4 text-[#E5B86A]" />
            Customer Menu
          </button>
          <button
            type="button"
            onClick={() => navigate('/kitchen')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-[#A8B3AA] hover:text-[#F5F5F0] hover:bg-[#222825] cursor-pointer"
          >
            <ChefHat className="w-4 h-4 text-[#82B895]" />
            Kitchen KDS
          </button>
        </div>
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5 border-t border-[#38443C] pt-4">
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#A8B3AA] hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-700/40 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500"
        >
          <LogOut className="w-4.5 h-4.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

/* ─── Main Admin Dashboard Page ─────────────────────────────────────── */
export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const adminUser = getAdminUser();

  // Navigation state
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Backend state: Dashboard Statistics
  const [stats, setStats] = useState({
    totalFoods: 0,
    totalFoodItems: 0,
    availableFoods: 0,
    unavailableFoods: 0,
    totalOrders: 0,
    pendingOrders: 0,
    preparingOrders: 0,
    readyOrders: 0,
    completedOrders: 0,
    servedOrders: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState(null);

  // Backend state: Foods List
  const [foods, setFoods] = useState([]);
  const [loadingFoods, setLoadingFoods] = useState(true);
  const [foodsError, setFoodsError] = useState(null);

  // Backend state: Orders List
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState(null);

  // UI action feedback
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text: string }

  // Food Form Modal state
  const [formMode, setFormMode] = useState(null); // 'add' | 'edit' | null
  const [editTarget, setEditTarget] = useState(null);
  const [formError, setFormError] = useState('');

  /* ─── Data Fetching ─────────────────────────────────────────────────── */

  // 1. Fetch dashboard statistics from GET /api/admin/dashboard
  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      setStatsError(null);
      const data = await getAdminDashboard();
      if (data) {
        setStats({
          totalFoods: data.totalFoods ?? data.totalFoodItems ?? 0,
          totalFoodItems: data.totalFoodItems ?? data.totalFoods ?? 0,
          availableFoods: data.availableFoods ?? 0,
          unavailableFoods: data.unavailableFoods ?? 0,
          totalOrders: data.totalOrders ?? 0,
          pendingOrders: data.pendingOrders ?? 0,
          preparingOrders: data.preparingOrders ?? 0,
          readyOrders: data.readyOrders ?? 0,
          completedOrders: data.completedOrders ?? data.servedOrders ?? 0,
          servedOrders: data.servedOrders ?? data.completedOrders ?? 0,
        });
      }
    } catch (err) {
      setStatsError(err.message || 'Failed to load dashboard statistics.');
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // 2. Fetch all food items from GET /api/admin/foods
  const fetchFoodsList = useCallback(async () => {
    try {
      setLoadingFoods(true);
      setFoodsError(null);
      const data = await getAdminFoods();
      const rawList = Array.isArray(data?.foods) ? data.foods : [];
      // Normalise each item with id = _id for FoodTable compatibility
      const normalised = rawList.map((item) => ({
        ...item,
        id: String(item._id || item.id),
        price: Number(item.price),
        isAvailable: item.isAvailable !== false,
      }));
      setFoods(normalised);
    } catch (err) {
      setFoodsError(err.message || 'Failed to load food items from server.');
    } finally {
      setLoadingFoods(false);
    }
  }, []);

  // 3. Fetch all orders from GET /api/admin/orders
  const fetchOrdersList = useCallback(async () => {
    try {
      setLoadingOrders(true);
      setOrdersError(null);
      const data = await getAdminOrders();
      const rawList = Array.isArray(data?.orders) ? data.orders : [];
      setOrders(rawList);
    } catch (err) {
      setOrdersError(err.message || 'Failed to load orders from server.');
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  // Refresh all sections
  const refreshAll = useCallback(async () => {
    await Promise.all([fetchDashboardStats(), fetchFoodsList(), fetchOrdersList()]);
  }, [fetchDashboardStats, fetchFoodsList, fetchOrdersList]);

  // Initial load on mount
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Auto-clear feedback after 4 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  /* ─── CRUD Action Handlers ─────────────────────────────────────────── */

  // Add new food item via POST /api/foods
  async function handleAdd(formData) {
    setFormError('');
    try {
      await addFoodItem(formData);
      setFeedback({ type: 'success', text: `"${formData.name}" added successfully.` });
      setFormMode(null);
      setEditTarget(null);
      // Refresh food list and dashboard statistics
      fetchFoodsList();
      fetchDashboardStats();
    } catch (err) {
      setFormError(err.message || 'Failed to add food item. Please try again.');
      throw err;
    }
  }

  // Edit food item via PUT /api/foods/:id
  async function handleEdit(formData) {
    setFormError('');
    const targetId = editTarget?._id || editTarget?.id;
    if (!targetId) return;

    try {
      await updateFoodItem(targetId, formData);
      setFeedback({ type: 'success', text: `"${formData.name}" updated successfully.` });
      setFormMode(null);
      setEditTarget(null);
      // Refresh food list and dashboard statistics
      fetchFoodsList();
      fetchDashboardStats();
    } catch (err) {
      setFormError(err.message || 'Failed to update food item. Please try again.');
      throw err;
    }
  }

  // Delete food item via DELETE /api/foods/:id
  async function handleDelete(id) {
    try {
      await deleteFoodItem(id);
      setFeedback({ type: 'success', text: 'Food item deleted successfully.' });
      // Refresh food list and dashboard statistics
      fetchFoodsList();
      fetchDashboardStats();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.message || 'Failed to delete food item.',
      });
    }
  }

  // Toggle food availability via PUT /api/foods/:id
  async function handleToggleAvail(id) {
    const item = foods.find((f) => String(f._id || f.id) === String(id));
    if (!item) return;

    const nextAvail = !item.isAvailable;
    try {
      await updateFoodItem(id, { isAvailable: nextAvail });
      // Optimistic or fresh update
      setFoods((prev) =>
        prev.map((f) =>
          String(f._id || f.id) === String(id) ? { ...f, isAvailable: nextAvail } : f
        )
      );
      // Refresh stats
      fetchDashboardStats();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.message || 'Failed to update availability status.',
      });
      // Rollback to server state
      fetchFoodsList();
    }
  }

  function openAdd() {
    setEditTarget(null);
    setFormError('');
    setFormMode('add');
  }

  function openEdit(item) {
    setEditTarget(item);
    setFormError('');
    setFormMode('edit');
  }

  function closeForm() {
    setFormMode(null);
    setEditTarget(null);
    setFormError('');
  }

  function handleLogout() {
    clearAdminSession();
    navigate('/admin/login', { replace: true });
  }

  const isRefreshing = loadingStats || loadingFoods || loadingOrders;

  return (
    <div className="min-h-screen bg-[#171A19] text-[#F5F5F0] flex selection:bg-[#24543A] selection:text-[#F5F0E6]">
      {/* ── Desktop Sidebar (fixed) ────────────────────────────────── */}
      <div className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-64">
        <Sidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          onClose={null}
          onLogout={handleLogout}
          navigate={navigate}
          adminUser={adminUser}
        />
      </div>

      {/* ── Mobile Sidebar Overlay ─────────────────────────────────── */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-50 flex flex-col lg:hidden w-64">
            <Sidebar
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              onClose={() => setSidebarOpen(false)}
              onLogout={handleLogout}
              navigate={navigate}
              adminUser={adminUser}
            />
          </div>
        </>
      )}

      {/* ── Main Content Area ───────────────────────────────────────── */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-[#171A19]/95 backdrop-blur-md border-b border-[#38443C] px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar menu"
            className="lg:hidden p-2 rounded-lg text-[#A8B3AA] hover:text-[#F5F5F0] hover:bg-[#222825] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#82B895]"
          >
            <MenuIcon className="w-5 h-5" />
          </button>

          <div className="flex-1">
            <h1 className="text-base font-bold text-[#F5F5F0]">
              {NAV_LINKS.find((l) => l.id === activeSection)?.label || 'Dashboard'}
            </h1>
          </div>

          {/* Action buttons in header */}
          <div className="flex items-center gap-2.5">
            {/* Refresh Data button */}
            <button
              type="button"
              onClick={refreshAll}
              disabled={isRefreshing}
              title="Refresh all data from server"
              className="p-2 rounded-xl text-[#A8B3AA] hover:text-[#F5F5F0] bg-[#222825] border border-[#38443C] hover:border-[#82B895]/50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#82B895] disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#82B895]' : ''}`} />
            </button>

            {/* Add Item shortcut in top bar */}
            <button
              type="button"
              onClick={openAdd}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#24543A] hover:bg-[#326B4B] text-[#F5F0E6] border border-[#326B4B] transition-colors cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-[#82B895]"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Food Item</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </header>

        {/* Global Toast Feedback */}
        {feedback && (
          <div className="px-4 sm:px-6 pt-4">
            <div
              role="status"
              className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-medium ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-700/60 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{feedback.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="text-[#A8B3AA] hover:text-[#F5F5F0] p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Page body */}
        <main className="flex-1 px-4 sm:px-6 py-6 max-w-7xl w-full mx-auto">
          {activeSection === 'overview' && (
            <OverviewSection
              stats={stats}
              loadingStats={loadingStats}
              statsError={statsError}
              onRetryStats={fetchDashboardStats}
              onNavigateToMenu={() => setActiveSection('menu')}
              onNavigateToOrders={() => setActiveSection('orders')}
            />
          )}

          {activeSection === 'menu' && (
            <MenuSection
              items={foods}
              loadingFoods={loadingFoods}
              foodsError={foodsError}
              onRetryFoods={fetchFoodsList}
              onAdd={openAdd}
              onEdit={openEdit}
              onDelete={handleDelete}
              onToggleAvail={handleToggleAvail}
            />
          )}

          {activeSection === 'orders' && (
            <OrdersSection
              orders={orders}
              loadingOrders={loadingOrders}
              ordersError={ordersError}
              onRetryOrders={fetchOrdersList}
              onGoToKitchen={() => navigate('/kitchen')}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-[#38443C] bg-[#222825] py-4 px-6 text-xs text-[#A8B3AA] flex items-center justify-between">
          <span>
            <span className="font-semibold text-[#F5F5F0]">ServeSync</span> · Admin Dashboard · Member 3
          </span>
          <span className="text-[#82B895]">Backend Connected</span>
        </footer>
      </div>

      {/* ── Food Form Modal ───────────────────────────────────────── */}
      {formMode && (
        <FoodForm
          key={editTarget?._id || editTarget?.id || formMode}
          initialData={formMode === 'edit' ? editTarget : null}
          onSave={formMode === 'edit' ? handleEdit : handleAdd}
          onCancel={closeForm}
          isModal={true}
          title={formMode === 'edit' ? `Edit: ${editTarget?.name}` : 'Add New Food Item'}
          serverError={formError}
        />
      )}
    </div>
  );
}

/* ─── Overview Section ────────────────────────────────────────────────── */
function OverviewSection({
  stats,
  loadingStats,
  statsError,
  onRetryStats,
  onNavigateToMenu,
  onNavigateToOrders,
}) {
  const foodCards = [
    {
      label: 'Total Food Items',
      value: stats.totalFoodItems ?? stats.totalFoods ?? 0,
      icon: UtensilsCrossed,
      color: 'text-[#E5B86A]',
      bg: 'bg-[#E5B86A]/10',
      border: 'border-[#E5B86A]/20',
    },
    {
      label: 'Available Foods',
      value: stats.availableFoods ?? 0,
      icon: CheckCircle2,
      color: 'text-[#82B895]',
      bg: 'bg-[#82B895]/10',
      border: 'border-[#82B895]/20',
    },
    {
      label: 'Unavailable Foods',
      value: stats.unavailableFoods ?? 0,
      icon: XCircle,
      color: 'text-rose-400',
      bg: 'bg-rose-400/10',
      border: 'border-rose-400/20',
    },
  ];

  const orderCards = [
    {
      label: 'Total Orders',
      value: stats.totalOrders ?? 0,
      icon: ClipboardList,
      color: 'text-[#E5B86A]',
      bg: 'bg-[#E5B86A]/10',
      border: 'border-[#E5B86A]/20',
    },
    {
      label: 'Pending Orders',
      value: stats.pendingOrders ?? 0,
      icon: Flame,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
      border: 'border-amber-400/20',
    },
    {
      label: 'Preparing Orders',
      value: stats.preparingOrders ?? 0,
      icon: Bell,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      border: 'border-blue-400/20',
    },
    {
      label: 'Ready Orders',
      value: stats.readyOrders ?? 0,
      icon: CheckCircle2,
      color: 'text-[#82B895]',
      bg: 'bg-[#82B895]/10',
      border: 'border-[#82B895]/20',
    },
    {
      label: 'Completed Orders',
      value: stats.completedOrders ?? stats.servedOrders ?? 0,
      icon: CheckCheck,
      color: 'text-slate-400',
      bg: 'bg-slate-400/10',
      border: 'border-slate-400/20',
    },
  ];

  return (
    <div>
      {/* Section heading */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#F5F5F0] mb-1">Dashboard Overview</h2>
          <p className="text-sm text-[#A8B3AA]">
            Real-time restaurant metrics live from MongoDB via GET /api/admin/dashboard.
          </p>
        </div>
        {loadingStats && (
          <span className="flex items-center gap-2 text-xs text-[#82B895]">
            <span className="w-3.5 h-3.5 border-2 border-[#82B895] border-t-transparent rounded-full animate-spin" />
            Loading statistics…
          </span>
        )}
      </div>

      {/* Error state */}
      {statsError && (
        <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-700/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <p className="text-sm text-rose-300">{statsError}</p>
          </div>
          <button
            type="button"
            onClick={onRetryStats}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-900/60 hover:bg-rose-800 text-rose-100 border border-rose-600 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Food Stats Cards ─── */}
      <div className="mb-4">
        <h3 className="text-xs font-bold text-[#A8B3AA] uppercase tracking-widest mb-3 flex items-center gap-2">
          <UtensilsCrossed className="w-3.5 h-3.5 text-[#E5B86A]" />
          Food Items Summary
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {foodCards.map(({ label, value, icon: Icon, color, bg, border }) => (
            <div
              key={label}
              className={`bg-[#222825] border ${border} rounded-2xl p-5 flex flex-col gap-3 hover:scale-[1.01] transition-transform duration-200`}
            >
              <div className={`w-10 h-10 rounded-xl ${bg} border ${border} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-[#F5F5F0]">
                  {loadingStats ? '—' : value}
                </p>
                <p className="text-xs text-[#A8B3AA] font-medium mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Order Stats Cards ─── */}
      <div className="mb-8">
        <h3 className="text-xs font-bold text-[#A8B3AA] uppercase tracking-widest mb-3 flex items-center gap-2">
          <ClipboardList className="w-3.5 h-3.5 text-[#82B895]" />
          Order Status Summary
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {orderCards.map(({ label, value, icon: Icon, color, bg, border }) => (
            <div
              key={label}
              className={`bg-[#222825] border ${border} rounded-2xl p-5 flex flex-col gap-3 hover:scale-[1.01] transition-transform duration-200`}
            >
              <div className={`w-10 h-10 rounded-xl ${bg} border ${border} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-[#F5F5F0]">
                  {loadingStats ? '—' : value}
                </p>
                <p className="text-xs text-[#A8B3AA] font-medium mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="bg-[#222825] border border-[#38443C] rounded-2xl p-6">
        <h3 className="text-base font-bold text-[#F5F5F0] mb-4">Quick Navigation</h3>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onNavigateToMenu}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[#24543A] hover:bg-[#326B4B] text-[#F5F0E6] border border-[#326B4B] transition-colors cursor-pointer shadow-md focus:outline-none focus:ring-2 focus:ring-[#82B895]"
          >
            <UtensilsCrossed className="w-4 h-4" />
            Manage Menu
          </button>
          <button
            type="button"
            onClick={onNavigateToOrders}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[#222825] hover:bg-[#2A332E] text-[#F5F5F0] border border-[#38443C] hover:border-[#82B895]/50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#82B895]"
          >
            <ClipboardList className="w-4 h-4 text-[#82B895]" />
            View Orders
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Menu Management Section ─────────────────────────────────────────── */
function MenuSection({
  items,
  loadingFoods,
  foodsError,
  onRetryFoods,
  onAdd,
  onEdit,
  onDelete,
  onToggleAvail,
}) {
  return (
    <div>
      {/* Section heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-[#F5F5F0] mb-1">Menu Management</h2>
          <p className="text-sm text-[#A8B3AA]">
            Add, update, remove, or toggle availability of dishes stored in the database.
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[#24543A] hover:bg-[#326B4B] active:scale-[0.98] text-[#F5F0E6] border border-[#326B4B] transition-all duration-150 cursor-pointer shadow-md hover:shadow-lg shadow-[#24543A]/20 focus:outline-none focus:ring-2 focus:ring-[#82B895] shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Food Item
        </button>
      </div>

      {/* Foods Error Alert */}
      {foodsError && (
        <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-700/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <p className="text-sm text-rose-300">{foodsError}</p>
          </div>
          <button
            type="button"
            onClick={onRetryFoods}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-900/60 hover:bg-rose-800 text-rose-100 border border-rose-600 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Food Table */}
      <FoodTable
        items={items}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleAvail={onToggleAvail}
        isLoading={loadingFoods}
      />
    </div>
  );
}

/* ─── Orders Overview Section (Member 3 Task 4) ───────────────────────── */
function OrdersSection({ orders, loadingOrders, ordersError, onRetryOrders, onGoToKitchen }) {
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Format order timestamp
  function formatTime(timestamp) {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return String(timestamp);
      return date.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(timestamp);
    }
  }

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const q = search.trim().toLowerCase();
      const orderIdStr = String(order._id || order.id || '').toLowerCase();
      const tableStr = String(order.tableNumber ?? '');
      const itemsStr = Array.isArray(order.items)
        ? order.items.map((i) => i.name).join(' ').toLowerCase()
        : '';

      const matchesSearch =
        !q ||
        orderIdStr.includes(q) ||
        tableStr.includes(q) ||
        itemsStr.includes(q);

      const matchesStatus =
        statusFilter === 'All' ||
        order.status?.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [orders, statusFilter, search]);

  const STATUS_TABS = ['All', 'Pending', 'Preparing', 'Ready', 'Served'];

  return (
    <div>
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-[#F5F5F0] mb-1">Orders Overview</h2>
          <p className="text-sm text-[#A8B3AA]">
            Monitor all customer orders placed across tables via GET /api/admin/orders.
          </p>
        </div>
        <button
          type="button"
          onClick={onGoToKitchen}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#222825] hover:bg-[#2A332E] text-[#82B895] border border-[#38443C] hover:border-[#82B895]/50 transition-colors cursor-pointer shrink-0"
        >
          <ChefHat className="w-4 h-4" />
          <span>Open Kitchen Display</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Orders Error Alert */}
      {ordersError && (
        <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-700/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <p className="text-sm text-rose-300">{ordersError}</p>
          </div>
          <button
            type="button"
            onClick={onRetryOrders}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-900/60 hover:bg-rose-800 text-rose-100 border border-rose-600 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8B3AA]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID, table number, or dish…"
            aria-label="Search orders"
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#171A19] border border-[#38443C] text-sm text-[#F5F5F0] placeholder-[#A8B3AA] focus:outline-none focus:border-[#82B895] focus:ring-2 focus:ring-[#82B895]/30 transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8B3AA] hover:text-[#F5F5F0] p-0.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter.toLowerCase() === tab.toLowerCase();
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`
                  px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer
                  ${
                    isActive
                      ? 'bg-[#24543A] text-[#F5F0E6] border border-[#326B4B]'
                      : 'bg-[#171A19] text-[#A8B3AA] border border-[#38443C] hover:text-[#F5F5F0]'
                  }
                `}
              >
                {tab === 'Served' ? 'Completed' : tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Count & Loading */}
      <div className="flex items-center justify-between mb-4 text-xs text-[#A8B3AA]">
        <p>
          Showing <span className="font-bold text-[#F5F5F0]">{filteredOrders.length}</span> of{' '}
          <span className="font-bold text-[#F5F5F0]">{orders.length}</span> orders
        </p>
        {loadingOrders && (
          <span className="flex items-center gap-1.5 text-[#82B895]">
            <span className="w-3 h-3 border-2 border-[#82B895] border-t-transparent rounded-full animate-spin" />
            Loading orders…
          </span>
        )}
      </div>

      {/* Orders List / Empty State */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl bg-[#222825] border border-[#38443C] border-dashed">
          <div className="w-14 h-14 rounded-2xl bg-[#171A19] border border-[#38443C] flex items-center justify-center mb-4">
            <ClipboardList className="w-7 h-7 text-[#A8B3AA] opacity-50" />
          </div>
          <h3 className="text-lg font-bold text-[#F5F5F0] mb-2">
            {search || statusFilter !== 'All' ? 'No orders match your filter' : 'No orders recorded yet'}
          </h3>
          <p className="text-sm text-[#A8B3AA] max-w-sm mb-4">
            {search || statusFilter !== 'All'
              ? 'Try clearing the search or status filter to see all orders.'
              : 'When customers place orders from the table menu, they will appear here in real time.'}
          </p>
          {(search || statusFilter !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('All');
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#24543A] text-[#F5F0E6] hover:bg-[#326B4B] cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const orderId = order._id ? String(order._id) : String(order.id);
            const shortId = orderId.length > 8 ? orderId.slice(-6).toUpperCase() : orderId;
            const items = Array.isArray(order.items) ? order.items : [];
            const total = order.totalAmount ?? order.total ?? 0;
            const status = order.status || 'Pending';

            return (
              <div
                key={orderId}
                className="bg-[#222825] border border-[#38443C] rounded-2xl p-5 hover:border-[#82B895]/40 transition-colors shadow-md"
              >
                {/* Order Top Meta */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#38443C]/60 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-base sm:text-lg font-black text-[#F5F5F0]">
                      #{shortId}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#171A19] border border-[#38443C] text-xs font-bold text-[#E5B86A]">
                      Table {order.tableNumber != null ? order.tableNumber : 'N/A'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Timestamp */}
                    <div className="flex items-center gap-1.5 text-xs text-[#A8B3AA]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatTime(order.createdAt)}</span>
                    </div>

                    {/* Status Badge */}
                    <OrderStatusBadge status={status} />
                  </div>
                </div>

                {/* Ordered Items List */}
                <div className="mb-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#A8B3AA] mb-2">
                    Ordered Items ({items.reduce((acc, i) => acc + (Number(i.quantity) || 1), 0)})
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#171A19] border border-[#38443C]/60 text-xs"
                      >
                        <span className="font-medium text-[#F5F5F0] truncate mr-2">
                          <span className="font-bold text-[#E5B86A] mr-1.5">{item.quantity}×</span>
                          {item.name || 'Unnamed Dish'}
                        </span>
                        {item.price != null && (
                          <span className="text-[#A8B3AA] shrink-0 font-medium">
                            ₹{Number(item.price) * (Number(item.quantity) || 1)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Special instructions if any */}
                {order.specialInstructions && (
                  <p className="text-xs text-amber-200/90 bg-amber-950/30 border border-amber-600/30 px-3 py-1.5 rounded-lg mb-3">
                    <span className="font-semibold text-amber-400">Note: </span>
                    "{order.specialInstructions}"
                  </p>
                )}

                {/* Footer Total */}
                <div className="flex items-center justify-between pt-2 border-t border-[#38443C]/40 text-xs">
                  <span className="text-[#A8B3AA] font-medium">
                    Order ID: <span className="font-mono text-[#F5F5F0]">{orderId}</span>
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[11px] uppercase tracking-wider text-[#A8B3AA] font-bold">
                      Total:
                    </span>
                    <span className="text-base font-black text-[#E5B86A]">
                      ₹{total}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* Status Badge Helper */
function OrderStatusBadge({ status }) {
  const norm = status ? status.toLowerCase() : 'pending';

  let badgeCls = 'bg-amber-950/40 border-amber-600/60 text-amber-300';
  let label = status;

  if (norm === 'pending') {
    badgeCls = 'bg-amber-950/40 border-amber-600/60 text-amber-300';
    label = 'Pending';
  } else if (norm === 'preparing') {
    badgeCls = 'bg-blue-950/40 border-blue-600/60 text-blue-300';
    label = 'Preparing';
  } else if (norm === 'ready') {
    badgeCls = 'bg-emerald-950/40 border-emerald-600/60 text-emerald-300';
    label = 'Ready for Pickup';
  } else if (norm === 'served' || norm === 'completed') {
    badgeCls = 'bg-slate-900 border-slate-700 text-slate-300';
    label = 'Completed';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeCls}`}>
      {label}
    </span>
  );
}

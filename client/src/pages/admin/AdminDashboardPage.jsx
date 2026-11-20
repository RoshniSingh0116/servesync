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
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChefHat,
  ClipboardList,
  Clock,
  CheckCheck,
  Flame,
  Bell,
  RefreshCw,
  AlertCircle,
  Search,
  ExternalLink,
  QrCode,
} from 'lucide-react';
import FoodTable from '../../components/admin/FoodTable';
import FoodForm from '../../components/admin/FoodForm';
import TableQRSection from '../../components/admin/TableQRSection';
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

const NAV_LINKS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'menu', label: 'Menu Management', icon: UtensilsCrossed },
  { id: 'orders', label: 'Orders Overview', icon: ClipboardList },
  { id: 'tables', label: 'Table QR Codes', icon: QrCode },
];

function Sidebar({ activeSection, setActiveSection, onClose, onLogout, navigate, adminUser }) {
  return (
    <aside className="flex flex-col h-full bg-white border-r border-[#E6E8E1] w-64">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E6E8E1]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#526B50] flex items-center justify-center text-white shadow-xs">
            <Utensils className="w-4 h-4" />
          </div>
          <div>
            <span className="text-base font-bold text-[#20251F] block leading-none">
              Dinning Room
            </span>
            <span className="text-[10px] text-[#74796F] uppercase tracking-wider font-semibold block mt-0.5">
              Admin Portal
            </span>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="lg:hidden text-[#74796F] hover:text-[#20251F] p-1 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {adminUser && (
        <div className="px-4 py-2.5 mx-3 mt-3 rounded-lg bg-[#FAFBF8] border border-[#E6E8E1] flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-[#EFF1EA] text-[#526B50] flex items-center justify-center text-xs font-bold uppercase">
            {adminUser.username?.[0] || 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#20251F] truncate leading-tight">
              {adminUser.username || 'Admin'}
            </p>
            <p className="text-[10px] text-[#74796F] capitalize font-medium leading-tight">
              {adminUser.role || 'Administrator'}
            </p>
          </div>
        </div>
      )}

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
                w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold
                transition-all duration-150 cursor-pointer text-left
                ${
                  isActive
                    ? 'bg-[#526B50] text-white shadow-xs'
                    : 'text-[#74796F] hover:text-[#20251F] hover:bg-[#EFF1EA]'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
            </button>
          );
        })}

        <div className="pt-4 mt-4 border-t border-[#E6E8E1] space-y-1">
          <p className="px-3 text-[10px] uppercase font-bold text-[#74796F] tracking-wider mb-1.5">
            Quick Links
          </p>
          <button
            type="button"
            onClick={() => navigate('/menu')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-[#74796F] hover:text-[#20251F] hover:bg-[#EFF1EA] cursor-pointer"
          >
            <Utensils className="w-4 h-4 text-[#526B50]" />
            Customer Menu
          </button>
          <button
            type="button"
            onClick={() => navigate('/kitchen')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-[#74796F] hover:text-[#20251F] hover:bg-[#EFF1EA] cursor-pointer"
          >
            <ChefHat className="w-4 h-4 text-[#526B50]" />
            Kitchen Display
          </button>
        </div>
      </nav>

      <div className="px-3 pb-4 border-t border-[#E6E8E1] pt-3">
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-[#74796F] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const adminUser = getAdminUser();

  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const [foods, setFoods] = useState([]);
  const [loadingFoods, setLoadingFoods] = useState(true);
  const [foodsError, setFoodsError] = useState(null);

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState(null);

  const [feedback, setFeedback] = useState(null);

  const [formMode, setFormMode] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [formError, setFormError] = useState('');

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

  const fetchFoodsList = useCallback(async () => {
    try {
      setLoadingFoods(true);
      setFoodsError(null);
      const data = await getAdminFoods();
      const rawList = Array.isArray(data?.foods) ? data.foods : [];
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

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchDashboardStats(), fetchFoodsList(), fetchOrdersList()]);
  }, [fetchDashboardStats, fetchFoodsList, fetchOrdersList]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  async function handleAdd(formData) {
    setFormError('');
    try {
      await addFoodItem(formData);
      setFeedback({ type: 'success', text: `"${formData.name}" added successfully.` });
      setFormMode(null);
      setEditTarget(null);
      fetchFoodsList();
      fetchDashboardStats();
    } catch (err) {
      setFormError(err.message || 'Failed to add food item. Please try again.');
      throw err;
    }
  }

  async function handleEdit(formData) {
    setFormError('');
    const targetId = editTarget?._id || editTarget?.id;
    if (!targetId) return;

    try {
      await updateFoodItem(targetId, formData);
      setFeedback({ type: 'success', text: `"${formData.name}" updated successfully.` });
      setFormMode(null);
      setEditTarget(null);
      fetchFoodsList();
      fetchDashboardStats();
    } catch (err) {
      setFormError(err.message || 'Failed to update food item. Please try again.');
      throw err;
    }
  }

  async function handleDelete(id) {
    try {
      await deleteFoodItem(id);
      setFeedback({ type: 'success', text: 'Food item deleted successfully.' });
      fetchFoodsList();
      fetchDashboardStats();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.message || 'Failed to delete food item.',
      });
    }
  }

  async function handleToggleAvail(id) {
    const item = foods.find((f) => String(f._id || f.id) === String(id));
    if (!item) return;

    const nextAvail = !item.isAvailable;
    try {
      await updateFoodItem(id, { isAvailable: nextAvail });
      setFoods((prev) =>
        prev.map((f) =>
          String(f._id || f.id) === String(id) ? { ...f, isAvailable: nextAvail } : f
        )
      );
      fetchDashboardStats();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.message || 'Failed to update availability status.',
      });
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
    <div className="min-h-screen bg-[#F7F7F4] text-[#20251F] flex font-sans">
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

      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-[#20251F]/40 backdrop-blur-xs lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-50 flex flex-col lg:hidden w-64 shadow-xl">
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

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 bg-white border-b border-[#E6E8E1] px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar menu"
              className="lg:hidden p-1.5 rounded-md text-[#74796F] hover:text-[#20251F] hover:bg-[#EFF1EA] cursor-pointer"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <h1 className="text-base font-bold text-[#20251F]">
              {NAV_LINKS.find((l) => l.id === activeSection)?.label || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={refreshAll}
              disabled={isRefreshing}
              title="Refresh all data"
              className="p-2 rounded-md text-[#74796F] hover:text-[#20251F] bg-[#FAFBF8] border border-[#E6E8E1] hover:bg-[#EFF1EA] transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#526B50]' : ''}`} />
            </button>

            <button
              type="button"
              onClick={openAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-[#526B50] hover:bg-[#40563F] text-white transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Dish</span>
            </button>
          </div>
        </header>

        {feedback && (
          <div className="px-4 sm:px-6 pt-4">
            <div
              role="status"
              className={`flex items-center justify-between p-3 rounded-md border text-xs font-medium ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{feedback.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="text-[#74796F] hover:text-[#20251F] p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

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

          {activeSection === 'tables' && (
            <TableQRSection />
          )}
        </main>

        <footer className="border-t border-[#E6E8E1] bg-white py-4 px-6 text-xs text-[#74796F] flex items-center justify-between">
          <span>Dinning Room · Admin Dashboard</span>
          <span>Live Kitchen Sync</span>
        </footer>
      </div>

      {formMode && (
        <FoodForm
          key={editTarget?._id || editTarget?.id || formMode}
          initialData={formMode === 'edit' ? editTarget : null}
          onSave={formMode === 'edit' ? handleEdit : handleAdd}
          onCancel={closeForm}
          isModal={true}
          title={formMode === 'edit' ? `Edit Dish: ${editTarget?.name}` : 'Add New Food Item'}
          serverError={formError}
        />
      )}
    </div>
  );
}

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
      label: 'Total Dishes',
      value: stats.totalFoodItems ?? stats.totalFoods ?? 0,
      icon: UtensilsCrossed,
    },
    {
      label: 'Available on Menu',
      value: stats.availableFoods ?? 0,
      icon: CheckCircle2,
    },
    {
      label: 'Hidden / Sold Out',
      value: stats.unavailableFoods ?? 0,
      icon: XCircle,
    },
  ];

  const orderCards = [
    {
      label: 'Total Orders',
      value: stats.totalOrders ?? 0,
      icon: ClipboardList,
    },
    {
      label: 'Pending',
      value: stats.pendingOrders ?? 0,
      icon: Flame,
    },
    {
      label: 'Preparing',
      value: stats.preparingOrders ?? 0,
      icon: Bell,
    },
    {
      label: 'Ready for Service',
      value: stats.readyOrders ?? 0,
      icon: CheckCircle2,
    },
    {
      label: 'Served & Closed',
      value: stats.completedOrders ?? stats.servedOrders ?? 0,
      icon: CheckCheck,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#20251F]">Restaurant Overview</h2>
          <p className="text-xs text-[#74796F] mt-0.5">
            Real-time metrics from live tabletop ordering.
          </p>
        </div>
      </div>

      {statsError && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-rose-700">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <p>{statsError}</p>
          </div>
          <button
            type="button"
            onClick={onRetryStats}
            className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white border border-rose-300 text-rose-700 hover:bg-rose-50"
          >
            Retry
          </button>
        </div>
      )}

      <div>
        <h3 className="text-xs font-bold text-[#74796F] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <UtensilsCrossed className="w-3.5 h-3.5 text-[#526B50]" />
          Menu Status
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {foodCards.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="bg-white border border-[#E6E8E1] rounded-xl p-4 flex items-center gap-3.5 shadow-xs"
            >
              <div className="w-10 h-10 rounded-lg bg-[#EFF1EA] text-[#526B50] flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#20251F] leading-tight">
                  {loadingStats ? '—' : value}
                </p>
                <p className="text-xs text-[#74796F] mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-[#74796F] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <ClipboardList className="w-3.5 h-3.5 text-[#526B50]" />
          Order Pipeline
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {orderCards.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="bg-white border border-[#E6E8E1] rounded-xl p-4 flex flex-col gap-2 shadow-xs"
            >
              <div className="w-8 h-8 rounded-md bg-[#EFF1EA] text-[#526B50] flex items-center justify-center">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xl font-bold text-[#20251F] leading-tight">
                  {loadingStats ? '—' : value}
                </p>
                <p className="text-[11px] text-[#74796F] font-medium mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-[#E6E8E1] rounded-xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-[#20251F] mb-3">Quick Navigation</h3>
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={onNavigateToMenu}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold bg-[#526B50] hover:bg-[#40563F] text-white transition-colors cursor-pointer shadow-xs"
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            Manage Menu Dishes
          </button>
          <button
            type="button"
            onClick={onNavigateToOrders}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold bg-white border border-[#E6E8E1] hover:bg-[#EFF1EA] text-[#20251F] transition-colors cursor-pointer"
          >
            <ClipboardList className="w-3.5 h-3.5 text-[#526B50]" />
            View Active Orders
          </button>
        </div>
      </div>
    </div>
  );
}

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
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#20251F]">Menu Management</h2>
          <p className="text-xs text-[#74796F] mt-0.5">
            Configure dishes, categories, pricing, and availability.
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold bg-[#526B50] hover:bg-[#40563F] text-white transition-colors cursor-pointer shadow-xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Food Item
        </button>
      </div>

      {foodsError && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-rose-700">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <p>{foodsError}</p>
          </div>
          <button
            type="button"
            onClick={onRetryFoods}
            className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white border border-rose-300 text-rose-700 hover:bg-rose-50"
          >
            Retry
          </button>
        </div>
      )}

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

function OrdersSection({ orders, loadingOrders, ordersError, onRetryOrders, onGoToKitchen }) {
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  function formatTime(timestamp) {
    if (!timestamp) return '—';
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

      const orderStatusNorm = order.status ? order.status.toLowerCase() : '';
      const filterNorm = statusFilter.toLowerCase();
      const matchesStatus =
        statusFilter === 'All' ||
        orderStatusNorm === filterNorm ||
        ((filterNorm === 'served' || filterNorm === 'completed') &&
          (orderStatusNorm === 'served' || orderStatusNorm === 'completed'));

      return matchesSearch && matchesStatus;
    });
  }, [orders, statusFilter, search]);

  const STATUS_TABS = ['All', 'Pending', 'Preparing', 'Ready', 'Served'];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#20251F]">Orders Overview</h2>
          <p className="text-xs text-[#74796F] mt-0.5">
            Monitor orders placed across all tables.
          </p>
        </div>
        <button
          type="button"
          onClick={onGoToKitchen}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-white border border-[#E6E8E1] hover:bg-[#EFF1EA] text-[#20251F] transition-colors cursor-pointer shrink-0"
        >
          <ChefHat className="w-3.5 h-3.5 text-[#526B50]" />
          <span>Open Kitchen Display</span>
          <ExternalLink className="w-3 h-3 text-[#74796F]" />
        </button>
      </div>

      {ordersError && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-rose-700">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <p>{ordersError}</p>
          </div>
          <button
            type="button"
            onClick={onRetryOrders}
            className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white border border-rose-300 text-rose-700 hover:bg-rose-50"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#74796F]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID, table number, or dish…"
            aria-label="Search orders"
            className="w-full pl-9 pr-8 py-2 rounded-md bg-white border border-[#E6E8E1] text-xs text-[#20251F] placeholder:text-[#74796F] focus:outline-none focus:border-[#526B50] focus:ring-2 focus:ring-[#526B50]/20"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#74796F] hover:text-[#20251F] p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter.toLowerCase() === tab.toLowerCase();
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`
                  px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer
                  ${
                    isActive
                      ? 'bg-[#526B50] text-white shadow-xs'
                      : 'bg-white text-[#74796F] border border-[#E6E8E1] hover:bg-[#EFF1EA]'
                  }
                `}
              >
                {tab === 'Served' ? 'Completed' : tab}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-[#74796F]">
        <p>
          Showing <span className="font-bold text-[#20251F]">{filteredOrders.length}</span> of{' '}
          <span className="font-bold text-[#20251F]">{orders.length}</span> orders
        </p>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl bg-white border border-[#E6E8E1] border-dashed">
          <ClipboardList className="w-8 h-8 text-[#74796F] opacity-40 mb-3" />
          <h3 className="text-sm font-bold text-[#20251F] mb-1">
            {search || statusFilter !== 'All' ? 'No matching orders' : 'No orders yet'}
          </h3>
          <p className="text-xs text-[#74796F] max-w-xs">
            {search || statusFilter !== 'All'
              ? 'Try clearing your filters.'
              : 'Orders placed by table customers will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const orderId = order._id ? String(order._id) : String(order.id);
            const shortId = orderId.length > 8 ? orderId.slice(-6).toUpperCase() : orderId;
            const items = Array.isArray(order.items) ? order.items : [];
            const total = order.totalAmount ?? order.total ?? 0;
            const status = order.status || 'Pending';

            const statusCls = {
              pending: 'bg-amber-50 text-amber-800 border-amber-200',
              preparing: 'bg-blue-50 text-blue-800 border-blue-200',
              ready: 'bg-emerald-50 text-emerald-800 border-emerald-200',
              served: 'bg-[#EFF1EA] text-[#74796F] border-[#E6E8E1]',
              completed: 'bg-[#EFF1EA] text-[#74796F] border-[#E6E8E1]',
            }[status.toLowerCase()] || 'bg-gray-50 text-gray-700 border-gray-200';

            return (
              <div
                key={orderId}
                className="bg-white border border-[#E6E8E1] rounded-xl p-4 hover:border-[#CBD0C5] transition-colors shadow-xs space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-[#E6E8E1]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-[#20251F]">
                      #{shortId}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-[#EFF1EA] text-xs font-semibold text-[#20251F]">
                      Table #{order.tableNumber != null ? order.tableNumber : 'N/A'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-[#74796F] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(order.createdAt)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${statusCls}`}>
                      {status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-[#FAFBF8] border border-[#E6E8E1] text-xs"
                    >
                      <span className="font-medium text-[#20251F] truncate mr-2">
                        <span className="font-bold text-[#526B50] mr-1">{item.quantity}×</span>
                        {item.name || 'Dish'}
                      </span>
                      {item.price != null && (
                        <span className="text-[#74796F] shrink-0">
                          ₹{Number(item.price) * (Number(item.quantity) || 1)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {order.specialInstructions && (
                  <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 p-2 rounded-md">
                    <span className="font-semibold">Note: </span>
                    &quot;{order.specialInstructions}&quot;
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-[#E6E8E1] text-xs">
                  <span className="text-[#74796F]">
                    ID: <span className="font-mono">{orderId}</span>
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[#74796F]">Total:</span>
                    <span className="text-sm font-bold text-[#526B50]">
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

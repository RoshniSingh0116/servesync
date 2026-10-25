/**
 * AdminDashboardPage.jsx
 * ServeSync — Admin Dashboard (Member 3)
 *
 * Main admin screen with:
 *  - Collapsible sidebar navigation (desktop fixed | mobile overlay)
 *  - Overview stat cards
 *  - Food management section (FoodTable + FoodForm modal)
 */

import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { MENU_ITEMS } from '../../mocks/mockData';
import FoodTable from '../../components/admin/FoodTable';
import FoodForm from '../../components/admin/FoodForm';

/* ───────────────────────────────────────────────────────────────────────
   Seed the admin state from mockData.
   We add `isAvailable: true` to every imported item since the customer
   menu schema does not include that field yet — this is additive and safe.
─────────────────────────────────────────────────────────────────────── */
const seedItems = MENU_ITEMS.map((item) => ({
  ...item,
  isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
}));

let nextIdCounter = seedItems.length + 1;
function generateId() {
  return `admin-${nextIdCounter++}`;
}

/* ─── Sidebar nav links ─────────────────────────────────────────────── */
const NAV_LINKS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'menu', label: 'Menu Management', icon: UtensilsCrossed },
];

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  // Food items state (seeded from mockData)
  const [items, setItems] = useState(seedItems);

  // UI state
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Form modal state
  const [formMode, setFormMode] = useState(null); // 'add' | 'edit'
  const [editTarget, setEditTarget] = useState(null);

  // Computed stats
  const stats = useMemo(() => {
    const total = items.length;
    const available = items.filter((i) => i.isAvailable).length;
    const unavailable = total - available;
    const popular = items.filter((i) => i.isPopular).length;
    const vegCount = items.filter((i) => i.isVeg).length;
    return { total, available, unavailable, popular, vegCount };
  }, [items]);

  /* ─── CRUD handlers ─── */
  function handleAdd(formData) {
    const newItem = { ...formData, id: generateId() };
    setItems((prev) => [newItem, ...prev]);
    setFormMode(null);
    setEditTarget(null);
  }

  function handleEdit(formData) {
    setItems((prev) =>
      prev.map((item) => (item.id === editTarget.id ? { ...item, ...formData } : item))
    );
    setFormMode(null);
    setEditTarget(null);
  }

  function handleDelete(id) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function handleToggleAvail(id) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isAvailable: !item.isAvailable } : item
      )
    );
  }

  function openAdd() {
    setEditTarget(null);
    setFormMode('add');
  }

  function openEdit(item) {
    setEditTarget(item);
    setFormMode('edit');
  }

  function closeForm() {
    setFormMode(null);
    setEditTarget(null);
  }

  function handleLogout() {
    navigate('/admin/login');
  }

  /* ─── Sidebar ─────────────────────────────────────────────────────── */
  const Sidebar = ({ onClose }) => (
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
              Admin
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
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5 border-t border-[#38443C] pt-4">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#A8B3AA] hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-700/40 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500"
        >
          <LogOut className="w-4.5 h-4.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#171A19] text-[#F5F5F0] flex selection:bg-[#24543A] selection:text-[#F5F0E6]">
      {/* ── Desktop Sidebar (fixed) ────────────────────────────────── */}
      <div className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-64">
        <Sidebar onClose={null} />
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
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* ── Main Content ──────────────────────────────────────────── */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
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

          {/* Add Item shortcut in top bar */}
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#24543A] hover:bg-[#326B4B] text-[#F5F0E6] border border-[#326B4B] transition-colors cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-[#82B895]"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Food Item</span>
            <span className="sm:hidden">Add</span>
          </button>
        </header>

        {/* Page body */}
        <main className="flex-1 px-4 sm:px-6 py-6 max-w-7xl w-full mx-auto">
          {activeSection === 'overview' && (
            <OverviewSection stats={stats} onNavigateToMenu={() => setActiveSection('menu')} />
          )}
          {activeSection === 'menu' && (
            <MenuSection
              items={items}
              onAdd={openAdd}
              onEdit={openEdit}
              onDelete={handleDelete}
              onToggleAvail={handleToggleAvail}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-[#38443C] bg-[#222825] py-4 px-6 text-xs text-[#A8B3AA] flex items-center justify-between">
          <span>
            <span className="font-semibold text-[#F5F5F0]">ServeSync</span> · Admin Dashboard · Member 3
          </span>
          <span className="text-[#E5B86A]">Frontend Demo</span>
        </footer>
      </div>

      {/* ── Food Form Modal ───────────────────────────────────────── */}
      {formMode && (
        <FoodForm
          initialData={formMode === 'edit' ? editTarget : null}
          onSave={formMode === 'edit' ? handleEdit : handleAdd}
          onCancel={closeForm}
          isModal={true}
          title={formMode === 'edit' ? `Edit: ${editTarget?.name}` : 'Add New Food Item'}
        />
      )}
    </div>
  );
}

/* ─── Overview Section ────────────────────────────────────────────────── */
function OverviewSection({ stats, onNavigateToMenu }) {
  const cards = [
    {
      label: 'Total Menu Items',
      value: stats.total,
      icon: UtensilsCrossed,
      color: 'text-[#E5B86A]',
      bg: 'bg-[#E5B86A]/10',
      border: 'border-[#E5B86A]/20',
    },
    {
      label: 'Available Items',
      value: stats.available,
      icon: CheckCircle2,
      color: 'text-[#82B895]',
      bg: 'bg-[#82B895]/10',
      border: 'border-[#82B895]/20',
    },
    {
      label: 'Unavailable Items',
      value: stats.unavailable,
      icon: XCircle,
      color: 'text-rose-400',
      bg: 'bg-rose-400/10',
      border: 'border-rose-400/20',
    },
    {
      label: 'Popular / Bestsellers',
      value: stats.popular,
      icon: Star,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
      border: 'border-amber-400/20',
    },
    {
      label: 'Vegetarian Items',
      value: stats.vegCount,
      icon: Leaf,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      border: 'border-emerald-400/20',
    },
    {
      label: 'Non-Vegetarian Items',
      value: stats.total - stats.vegCount,
      icon: TrendingUp,
      color: 'text-orange-400',
      bg: 'bg-orange-400/10',
      border: 'border-orange-400/20',
    },
  ];

  return (
    <div>
      {/* Section heading */}
      <div className="mb-6">
        <h2 className="text-2xl font-black text-[#F5F5F0] mb-1">Dashboard Overview</h2>
        <p className="text-sm text-[#A8B3AA]">
          A snapshot of your restaurant menu at a glance.
        </p>
      </div>

      {/* Stat cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color, bg, border }) => (
          <div
            key={label}
            className={`bg-[#222825] border ${border} rounded-2xl p-5 flex flex-col gap-3 hover:scale-[1.02] transition-transform duration-200`}
          >
            <div className={`w-10 h-10 rounded-xl ${bg} border ${border} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-[#F5F5F0]">{value}</p>
              <p className="text-xs text-[#A8B3AA] font-medium mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-[#222825] border border-[#38443C] rounded-2xl p-6">
        <h3 className="text-base font-bold text-[#F5F5F0] mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onNavigateToMenu}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[#24543A] hover:bg-[#326B4B] text-[#F5F0E6] border border-[#326B4B] transition-colors cursor-pointer shadow-md focus:outline-none focus:ring-2 focus:ring-[#82B895]"
          >
            <UtensilsCrossed className="w-4 h-4" />
            Manage Menu
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Menu Management Section ─────────────────────────────────────────── */
function MenuSection({ items, onAdd, onEdit, onDelete, onToggleAvail }) {
  return (
    <div>
      {/* Section heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-[#F5F5F0] mb-1">Menu Management</h2>
          <p className="text-sm text-[#A8B3AA]">
            Add, edit, delete, or toggle availability of food items.
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

      <FoodTable
        items={items}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleAvail={onToggleAvail}
      />
    </div>
  );
}

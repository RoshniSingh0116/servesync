/**
 * FoodTable.jsx
 * ServeSync — Admin Dashboard (Member 3)
 *
 * Responsive table / card list displaying all food items with
 * search, category filter, availability filter, toggle, edit, and delete actions.
 */

import { useState } from 'react';
import {
  Search,
  X,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  UtensilsCrossed,
  SlidersHorizontal,
} from 'lucide-react';
import { CATEGORIES } from '../../mocks/mockData';

const FOOD_CATEGORIES = CATEGORIES.filter((c) => c !== 'All');
const AVAIL_FILTER_OPTIONS = ['All', 'Available', 'Unavailable'];

/**
 * FoodTable Component
 *
 * @param {Object}   props
 * @param {Array}    props.items          - All food items (with isAvailable field)
 * @param {Function} props.onEdit         - Called with item when edit is clicked
 * @param {Function} props.onDelete       - Called with item.id when delete is confirmed
 * @param {Function} props.onToggleAvail  - Called with item.id to toggle availability
 */
export default function FoodTable({ items = [], onEdit, onDelete, onToggleAvail }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [availFilter, setAvailFilter] = useState('All');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Derived filtered list
  const filtered = items.filter((item) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q);
    const matchesCategory =
      categoryFilter === 'All' || item.category === categoryFilter;
    const matchesAvail =
      availFilter === 'All' ||
      (availFilter === 'Available' ? item.isAvailable : !item.isAvailable);
    return matchesSearch && matchesCategory && matchesAvail;
  });

  function confirmDelete(id) {
    setDeleteConfirmId(id);
  }

  function handleDeleteConfirmed() {
    if (deleteConfirmId) {
      onDelete(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  }

  function clearFilters() {
    setSearch('');
    setCategoryFilter('All');
    setAvailFilter('All');
  }

  const hasActiveFilter =
    search.trim() !== '' || categoryFilter !== 'All' || availFilter !== 'All';

  return (
    <div>
      {/* ─── Filters Bar ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8B3AA]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search food items…"
            aria-label="Search food items"
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

        {/* Category Filter */}
        <div className="relative">
          <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8B3AA]" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
            className="pl-9 pr-8 py-2.5 rounded-xl bg-[#171A19] border border-[#38443C] text-sm text-[#F5F5F0] focus:outline-none focus:border-[#82B895] focus:ring-2 focus:ring-[#82B895]/30 transition-colors appearance-none cursor-pointer"
          >
            <option value="All" className="bg-[#171A19]">All Categories</option>
            {FOOD_CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-[#171A19]">{c}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A8B3AA] pointer-events-none" />
        </div>

        {/* Availability Filter */}
        <div className="relative">
          <select
            value={availFilter}
            onChange={(e) => setAvailFilter(e.target.value)}
            aria-label="Filter by availability"
            className="pl-3 pr-8 py-2.5 rounded-xl bg-[#171A19] border border-[#38443C] text-sm text-[#F5F5F0] focus:outline-none focus:border-[#82B895] focus:ring-2 focus:ring-[#82B895]/30 transition-colors appearance-none cursor-pointer"
          >
            {AVAIL_FILTER_OPTIONS.map((o) => (
              <option key={o} value={o} className="bg-[#171A19]">{o}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A8B3AA] pointer-events-none" />
        </div>

        {/* Clear filters */}
        {hasActiveFilter && (
          <button
            type="button"
            onClick={clearFilters}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-[#E5B86A] bg-[#171A19] border border-[#38443C] hover:border-[#E5B86A]/50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#82B895] whitespace-nowrap"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ─── Results summary ─────────────────────────────────────── */}
      <p className="text-xs text-[#A8B3AA] mb-3">
        Showing{' '}
        <span className="font-bold text-[#F5F5F0]">{filtered.length}</span>{' '}
        of{' '}
        <span className="font-bold text-[#F5F5F0]">{items.length}</span>{' '}
        items
      </p>

      {/* ─── Table (desktop) / Cards (mobile) ────────────────────── */}
      {filtered.length === 0 ? (
        <EmptyState hasFilter={hasActiveFilter} onClear={clearFilters} />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-[#38443C]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#171A19] text-[#A8B3AA] text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-semibold">Item</th>
                  <th className="text-left px-4 py-3 font-semibold">Category</th>
                  <th className="text-right px-4 py-3 font-semibold">Price</th>
                  <th className="text-center px-4 py-3 font-semibold">Diet</th>
                  <th className="text-center px-4 py-3 font-semibold">Status</th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#38443C]">
                {filtered.map((item) => (
                  <TableRow
                    key={item.id}
                    item={item}
                    onEdit={onEdit}
                    onDeleteClick={confirmDelete}
                    onToggleAvail={onToggleAvail}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden space-y-3">
            {filtered.map((item) => (
              <MobileCard
                key={item.id}
                item={item}
                onEdit={onEdit}
                onDeleteClick={confirmDelete}
                onToggleAvail={onToggleAvail}
              />
            ))}
          </div>
        </>
      )}

      {/* ─── Delete Confirmation Dialog ───────────────────────────── */}
      {deleteConfirmId && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
        >
          <div className="bg-[#222825] border border-[#38443C] rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-rose-950/50 border border-rose-700/50 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-rose-400" />
            </div>
            <h3 id="delete-confirm-title" className="text-lg font-bold text-[#F5F5F0] text-center mb-2">
              Delete Food Item?
            </h3>
            <p className="text-sm text-[#A8B3AA] text-center mb-6">
              This item will be removed from the menu. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-[#F5F5F0] bg-[#171A19] border border-[#38443C] hover:border-[#82B895]/50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#82B895]"
              >
                Keep Item
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirmed}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-rose-700 hover:bg-rose-600 active:scale-[0.98] transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── TableRow (desktop) ──────────────────────────────────────────────── */
function TableRow({ item, onEdit, onDeleteClick, onToggleAvail }) {
  return (
    <tr className="bg-[#222825] hover:bg-[#2A332E] transition-colors">
      {/* Item Name + Description */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#38443C] shrink-0">
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <UtensilsCrossed className="w-4 h-4 text-[#A8B3AA]" />
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold text-[#F5F5F0] line-clamp-1">{item.name}</p>
            <p className="text-xs text-[#A8B3AA] line-clamp-1">{item.description}</p>
          </div>
        </div>
      </td>

      {/* Category */}
      <td className="px-4 py-3">
        <span className="px-2.5 py-1 rounded-lg bg-[#171A19] border border-[#38443C] text-xs text-[#A8B3AA] font-medium">
          {item.category}
        </span>
      </td>

      {/* Price */}
      <td className="px-4 py-3 text-right font-bold text-[#E5B86A] whitespace-nowrap">
        ₹{item.price}
      </td>

      {/* Diet */}
      <td className="px-4 py-3 text-center">
        <VegBadge isVeg={item.isVeg} />
      </td>

      {/* Availability Toggle */}
      <td className="px-4 py-3 text-center">
        <button
          type="button"
          onClick={() => onToggleAvail(item.id)}
          aria-label={`${item.isAvailable ? 'Mark unavailable' : 'Mark available'}: ${item.name}`}
          title={item.isAvailable ? 'Click to mark unavailable' : 'Click to mark available'}
          className="inline-flex items-center gap-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#82B895] rounded"
        >
          {item.isAvailable ? (
            <ToggleRight className="w-6 h-6 text-[#82B895]" />
          ) : (
            <ToggleLeft className="w-6 h-6 text-[#A8B3AA]" />
          )}
          <span
            className={`text-xs font-semibold ${
              item.isAvailable ? 'text-[#82B895]' : 'text-[#A8B3AA]'
            }`}
          >
            {item.isAvailable ? 'Available' : 'Unavailable'}
          </span>
        </button>
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onEdit(item)}
            aria-label={`Edit ${item.name}`}
            className="p-2 rounded-lg text-[#A8B3AA] hover:text-[#F5F5F0] hover:bg-[#171A19] border border-transparent hover:border-[#38443C] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#82B895]"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteClick(item.id)}
            aria-label={`Delete ${item.name}`}
            className="p-2 rounded-lg text-[#A8B3AA] hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-700/50 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ─── MobileCard ──────────────────────────────────────────────────────── */
function MobileCard({ item, onEdit, onDeleteClick, onToggleAvail }) {
  return (
    <div className="bg-[#222825] border border-[#38443C] rounded-xl p-4">
      <div className="flex items-start gap-3 mb-3">
        {/* Thumbnail */}
        <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#38443C] shrink-0">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-[#A8B3AA]" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <h4 className="text-sm font-bold text-[#F5F5F0] line-clamp-1">{item.name}</h4>
            <span className="text-sm font-bold text-[#E5B86A] shrink-0">₹{item.price}</span>
          </div>
          <p className="text-xs text-[#A8B3AA] line-clamp-2 mb-2">{item.description}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded-md bg-[#171A19] border border-[#38443C] text-xs text-[#A8B3AA]">
              {item.category}
            </span>
            <VegBadge isVeg={item.isVeg} />
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="flex items-center justify-between pt-3 border-t border-[#38443C]">
        <button
          type="button"
          onClick={() => onToggleAvail(item.id)}
          aria-label={`${item.isAvailable ? 'Mark unavailable' : 'Mark available'}: ${item.name}`}
          className="inline-flex items-center gap-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#82B895] rounded"
        >
          {item.isAvailable ? (
            <ToggleRight className="w-5 h-5 text-[#82B895]" />
          ) : (
            <ToggleLeft className="w-5 h-5 text-[#A8B3AA]" />
          )}
          <span className={`text-xs font-semibold ${item.isAvailable ? 'text-[#82B895]' : 'text-[#A8B3AA]'}`}>
            {item.isAvailable ? 'Available' : 'Unavailable'}
          </span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(item)}
            aria-label={`Edit ${item.name}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#A8B3AA] hover:text-[#F5F5F0] bg-[#171A19] border border-[#38443C] hover:border-[#82B895]/50 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#82B895]"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDeleteClick(item.id)}
            aria-label={`Delete ${item.name}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-950/40 border border-rose-700/50 hover:bg-rose-950/60 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Shared sub-components ───────────────────────────────────────────── */

function VegBadge({ isVeg }) {
  return (
    <span
      title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
      aria-label={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${
        isVeg
          ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-400'
          : 'bg-rose-950/40 border-rose-700/60 text-rose-400'
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
      {isVeg ? 'Veg' : 'Non-Veg'}
    </span>
  );
}

function EmptyState({ hasFilter, onClear }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl bg-[#222825] border border-[#38443C] border-dashed">
      <div className="w-14 h-14 rounded-2xl bg-[#171A19] border border-[#38443C] flex items-center justify-center mb-4">
        <UtensilsCrossed className="w-7 h-7 text-[#A8B3AA] opacity-50" />
      </div>
      <h3 className="text-lg font-bold text-[#F5F5F0] mb-2">
        {hasFilter ? 'No items match your filters' : 'No food items yet'}
      </h3>
      <p className="text-sm text-[#A8B3AA] max-w-xs mb-5">
        {hasFilter
          ? 'Try adjusting your search or filter criteria.'
          : 'Click "Add Food Item" to add your first dish.'}
      </p>
      {hasFilter && (
        <button
          type="button"
          onClick={onClear}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#24543A] hover:bg-[#326B4B] text-[#F5F0E6] border border-[#326B4B] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#82B895]"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}

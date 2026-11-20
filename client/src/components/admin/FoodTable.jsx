import { useState } from 'react';
import {
  Search,
  X,
  Pencil,
  Trash2,
  ChevronDown,
  UtensilsCrossed,
  SlidersHorizontal,
} from 'lucide-react';
import { FOOD_CATEGORIES } from './FoodForm';

const AVAIL_FILTER_OPTIONS = ['All', 'Available', 'Unavailable'];

export default function FoodTable({
  items = [],
  onEdit,
  onDelete,
  onToggleAvail,
  isLoading = false,
}) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [availFilter, setAvailFilter] = useState('All');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filtered = items.filter((item) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.name?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q);
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

  async function handleDeleteConfirmed() {
    if (deleteConfirmId) {
      try {
        setIsDeleting(true);
        await onDelete(deleteConfirmId);
      } finally {
        setIsDeleting(false);
        setDeleteConfirmId(null);
      }
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
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#74796F]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search food items…"
            aria-label="Search food items"
            className="w-full pl-10 pr-10 py-2 rounded-md bg-white border border-[#E6E8E1] text-sm text-[#20251F] placeholder:text-[#74796F] focus:outline-none focus:border-[#526B50] focus:ring-2 focus:ring-[#526B50]/20 transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#74796F] hover:text-[#20251F] p-0.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="relative">
          <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#74796F]" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
            className="pl-9 pr-8 py-2 rounded-md bg-white border border-[#E6E8E1] text-sm text-[#20251F] focus:outline-none focus:border-[#526B50] focus:ring-2 focus:ring-[#526B50]/20 transition-colors appearance-none cursor-pointer"
          >
            <option value="All">All Categories</option>
            {FOOD_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#74796F] pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={availFilter}
            onChange={(e) => setAvailFilter(e.target.value)}
            aria-label="Filter by availability"
            className="pl-3 pr-8 py-2 rounded-md bg-white border border-[#E6E8E1] text-sm text-[#20251F] focus:outline-none focus:border-[#526B50] focus:ring-2 focus:ring-[#526B50]/20 transition-colors appearance-none cursor-pointer"
          >
            {AVAIL_FILTER_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#74796F] pointer-events-none" />
        </div>

        {hasActiveFilter && (
          <button
            type="button"
            onClick={clearFilters}
            className="px-3.5 py-2 rounded-md text-xs font-semibold text-[#526B50] hover:bg-[#EFF1EA] border border-[#E6E8E1] transition-colors cursor-pointer whitespace-nowrap"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="flex items-center justify-between mb-3 text-xs text-[#74796F]">
        <p>
          Showing <span className="font-bold text-[#20251F]">{filtered.length}</span> of{' '}
          <span className="font-bold text-[#20251F]">{items.length}</span> dishes
        </p>
        {isLoading && (
          <span className="flex items-center gap-1.5 text-[#526B50]">
            <span className="w-3 h-3 border-2 border-[#526B50] border-t-transparent rounded-full animate-spin" />
            Updating menu…
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl bg-white border border-[#E6E8E1] border-dashed">
          <UtensilsCrossed className="w-8 h-8 text-[#74796F] opacity-40 mb-3" />
          <h3 className="text-sm font-bold text-[#20251F] mb-1">
            {hasActiveFilter ? 'No matching dishes' : 'No food items in menu'}
          </h3>
          <p className="text-xs text-[#74796F] max-w-sm">
            {hasActiveFilter ? 'Try clearing your filters to see all items.' : 'Click "Add Food Item" above to add your first dish.'}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto rounded-xl border border-[#E6E8E1] bg-white shadow-xs">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-[#FAFBF8] border-b border-[#E6E8E1] text-[#74796F] text-xs font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3">Dish</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-center">Dietary</th>
                  <th className="px-4 py-3 text-center">Availability</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E8E1]">
                {filtered.map((item) => {
                  const itemId = item._id || item.id;
                  return (
                    <tr key={itemId} className="hover:bg-[#FAFBF8] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-md overflow-hidden bg-[#EFF1EA] border border-[#E6E8E1] shrink-0">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <UtensilsCrossed className="w-4 h-4 text-[#74796F]" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-[#20251F] line-clamp-1">{item.name}</p>
                            <p className="text-xs text-[#74796F] line-clamp-1">{item.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-md bg-[#EFF1EA] text-[#20251F] text-xs font-medium border border-[#E6E8E1]">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-[#526B50]">
                        ₹{item.price}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1.5 text-xs text-[#74796F]">
                          <span
                            className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'}`}
                          />
                          {item.isVeg ? 'Veg' : 'Non-Veg'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => onToggleAvail(itemId)}
                          title="Click to toggle availability"
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer border ${
                            item.isAvailable
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {item.isAvailable ? 'Available' : 'Unavailable'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onEdit(item)}
                            title="Edit dish"
                            className="p-1.5 rounded-md text-[#74796F] hover:text-[#20251F] hover:bg-[#EFF1EA] cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmDelete(itemId)}
                            title="Delete dish"
                            className="p-1.5 rounded-md text-[#74796F] hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {filtered.map((item) => {
              const itemId = item._id || item.id;
              return (
                <div key={itemId} className="bg-white border border-[#E6E8E1] rounded-xl p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#EFF1EA] text-[#20251F]">
                      {item.category}
                    </span>
                    <span className="text-base font-bold text-[#526B50]">₹{item.price}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-[#EFF1EA] border border-[#E6E8E1] overflow-hidden shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <UtensilsCrossed className="w-5 h-5 m-auto text-[#74796F]" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#20251F]">{item.name}</h4>
                      <p className="text-xs text-[#74796F] line-clamp-2 mt-0.5">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[#E6E8E1] text-xs">
                    <button
                      type="button"
                      onClick={() => onToggleAvail(itemId)}
                      className={`px-2 py-0.5 rounded-full font-semibold border ${
                        item.isAvailable
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      {item.isAvailable ? 'Available' : 'Unavailable'}
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="px-2.5 py-1 rounded-md text-xs font-medium border border-[#E6E8E1] hover:bg-[#EFF1EA]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => confirmDelete(itemId)}
                        className="p-1 rounded-md text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {deleteConfirmId && (
        <div
          role="alertdialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#20251F]/40 backdrop-blur-xs"
        >
          <div className="bg-white border border-[#E6E8E1] rounded-xl w-full max-w-sm p-6 shadow-xl">
            <h3 className="text-base font-bold text-[#20251F] mb-1.5">
              Delete Food Item?
            </h3>
            <p className="text-xs text-[#74796F] mb-5 leading-relaxed">
              This item will be permanently removed from your live menu catalog.
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 rounded-md text-xs font-semibold text-[#74796F] hover:text-[#20251F] hover:bg-[#EFF1EA] border border-[#E6E8E1] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirmed}
                className="flex-1 py-2 rounded-md text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

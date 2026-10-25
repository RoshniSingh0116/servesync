import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  X,
  Sparkles,
  Clock,
  Star,
  MapPin,
  Utensils,
  Leaf,
  RotateCcw,
  CheckCircle2,
  ChefHat,
  Shield,
} from 'lucide-react';
import CategoryTabs from '../../components/customer/CategoryTabs';
import MenuItemCard from '../../components/customer/MenuItemCard';
import { useCart } from '../../context/CartContext';
import {
  MENU_ITEMS,
  CATEGORIES,
  RESTAURANT_INFO,
} from '../../mocks/mockData';

/**
 * Helper to safely extract table number from URL query parameter (?table=X)
 * Works reliably both inside and outside a React Router context.
 */
function getTableNumberFromUrl() {
  if (typeof window !== 'undefined' && window.location?.search) {
    const params = new URLSearchParams(window.location.search);
    const table = params.get('table');
    if (table && table.trim() !== '') {
      return table.trim();
    }
  }
  return '1'; // Sensible demo default
}

/**
 * MenuPage Component
 * Primary customer menu view for table ordering (Member 1).
 *
 * @param {Object} props
 * @param {Function} [props.onAddToCart] - Optional external callback from shared CartContext (for Member 2)
 */
export default function MenuPage({ onAddToCart: externalAddToCart }) {
  const navigate = useNavigate();
  const { addToCart, cartCount } = useCart();

  // 1. Table Number State (from URL ?table=X or default)
  const [tableNumber, setTableNumber] = useState(getTableNumberFromUrl);

  // 2. Search & Category Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [vegOnly, setVegOnly] = useState(false);

  // 3. Local Feedback State
  const [toastMessage, setToastMessage] = useState(null);

  // Listen for query changes if URL changes dynamically
  useEffect(() => {
    const handleLocationChange = () => {
      setTableNumber(getTableNumberFromUrl());
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const totalCartCount = cartCount;

  // Compute dynamic category counts from the full menu (never hardcoded, never inaccurate)
  const categoryCounts = useMemo(() => {
    const counts = { All: MENU_ITEMS.length };
    CATEGORIES.forEach((cat) => {
      if (cat !== 'All') {
        counts[cat] = MENU_ITEMS.filter((item) => item.category === cat).length;
      }
    });
    return counts;
  }, []);

  // Filtered menu items based on Search, Category, and Veg-only toggle
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return MENU_ITEMS.filter((item) => {
      // Category match
      const matchesCategory =
        selectedCategory === 'All' || item.category === selectedCategory;

      // Search match (name or description)
      const matchesSearch =
        query === '' ||
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query);

      // Vegetarian filter
      const matchesVeg = !vegOnly || item.isVeg === true;

      return matchesCategory && matchesSearch && matchesVeg;
    });
  }, [searchQuery, selectedCategory, vegOnly]);

  // Handle Add to Cart action
  const handleAddToCart = (item) => {
    // 1. Add to shared CartContext
    if (typeof addToCart === 'function') {
      addToCart(item);
    }

    // 2. Show brief toast notification
    setToastMessage({
      title: 'Added to Cart',
      message: `${item.name} (₹${item.price})`,
    });
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);

    // 3. Forward to external callback if supplied
    if (typeof externalAddToCart === 'function') {
      externalAddToCart(item);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setVegOnly(false);
  };

  return (
    <div className="min-h-screen bg-[#171A19] text-[#F5F5F0] selection:bg-[#24543A] selection:text-[#F5F0E6] flex flex-col font-sans">
      {/* ─────────────────────────────────────────────────────────────
          A. NAVIGATION / HEADER
          Sticky navbar with brand logo, table status, and cart button
      ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#171A19]/95 backdrop-blur-md border-b border-[#38443C] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-[#24543A] to-[#171A19] border border-[#326B4B] flex items-center justify-center shadow-md">
                <Utensils className="w-5 h-5 text-[#E5B86A]" />
              </div>
              <div>
                <span className="text-xl md:text-2xl font-black tracking-tight text-[#F5F5F0] block leading-none">
                  Serve<span className="text-[#E5B86A]">Sync</span>
                </span>
                <span className="text-[10px] md:text-xs text-[#A8B3AA] tracking-wider uppercase font-medium">
                  Digital Dining
                </span>
              </div>
            </div>

            {/* Center Table Indicator (Tablet/Desktop) */}
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#222825] border border-[#38443C] text-xs">
              <span className="w-2 h-2 rounded-full bg-[#82B895] animate-pulse" />
              <span className="text-[#A8B3AA]">Dining at</span>
              <span className="font-bold text-[#E5B86A]">
                Table {tableNumber}
              </span>
            </div>

            {/* Right Action: Cart & Quick Switchers */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Kitchen KDS Link */}
              <button
                type="button"
                onClick={() => navigate('/kitchen')}
                title="Open Kitchen Display Station"
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#222825] border border-[#38443C] hover:border-[#82B895] text-xs font-semibold text-[#A8B3AA] hover:text-[#F5F5F0] transition-colors cursor-pointer"
              >
                <ChefHat className="w-4 h-4 text-[#82B895]" />
                <span>Kitchen</span>
              </button>

              {/* Admin Portal Link */}
              <button
                type="button"
                onClick={() => navigate('/admin/dashboard')}
                title="Open Admin Dashboard"
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#222825] border border-[#38443C] hover:border-[#82B895] text-xs font-semibold text-[#A8B3AA] hover:text-[#F5F5F0] transition-colors cursor-pointer"
              >
                <Shield className="w-4 h-4 text-[#E5B86A]" />
                <span>Admin</span>
              </button>

              {/* Cart Button */}
              <button
                type="button"
                onClick={() => navigate(`/cart?table=${tableNumber}`)}
                aria-label={`View cart with ${totalCartCount} items`}
                className="
                  relative flex items-center gap-2 px-3.5 py-2 md:px-4 md:py-2.5 rounded-xl
                  bg-[#222825] border border-[#38443C] hover:border-[#82B895] text-[#F5F5F0]
                  hover:bg-[#2A332E] transition-all duration-200 cursor-pointer
                  focus:outline-none focus:ring-2 focus:ring-[#82B895]
                "
              >
                <ShoppingBag className="w-5 h-5 text-[#E5B86A]" />
                <span className="hidden sm:inline text-xs font-semibold">
                  Cart
                </span>
                {totalCartCount > 0 ? (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#24543A] text-[#F5F0E6] text-xs font-bold border border-[#326B4B] shadow-sm animate-scale-in">
                    {totalCartCount}
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#171A19] text-[#A8B3AA] text-xs font-medium border border-[#38443C]">
                    0
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile-Only Table Strip */}
        <div className="sm:hidden px-4 py-2 bg-[#222825]/90 border-t border-[#38443C] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-[#E5B86A]" />
            <span className="text-[#A8B3AA]">Ordering for</span>
            <span className="font-bold text-[#F5F5F0]">Table {tableNumber}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/kitchen')}
              className="text-[#82B895] font-semibold text-[11px] underline"
            >
              Kitchen
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/dashboard')}
              className="text-[#E5B86A] font-semibold text-[11px] underline"
            >
              Admin
            </button>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          B. RESTAURANT INTRODUCTION & HERO
      ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#222825] to-[#171A19] border-b border-[#38443C] pt-8 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#24543A]/30 border border-[#326B4B] text-xs text-[#82B895] font-medium mb-3">
                <Sparkles className="w-3.5 h-3.5 text-[#E5B86A]" />
                <span>{RESTAURANT_INFO.tagline}</span>
              </div>

              {/* Restaurant Name Heading */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#F5F5F0] tracking-tight leading-tight mb-2">
                {RESTAURANT_INFO.name}
              </h1>

              {/* Description */}
              <p className="text-sm sm:text-base text-[#A8B3AA] leading-relaxed mb-4">
                {RESTAURANT_INFO.description}
              </p>

              {/* Meta pills: Rating, Prep Time, Service */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#A8B3AA]">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#171A19] border border-[#38443C]">
                  <Star className="w-3.5 h-3.5 fill-[#E5B86A] text-[#E5B86A]" />
                  <span className="font-bold text-[#F5F5F0]">
                    {RESTAURANT_INFO.rating}
                  </span>
                  <span className="text-[#A8B3AA]">
                    ({RESTAURANT_INFO.reviewsCount})
                  </span>
                </div>

                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#171A19] border border-[#38443C]">
                  <Clock className="w-3.5 h-3.5 text-[#82B895]" />
                  <span>Prep: {RESTAURANT_INFO.prepTime}</span>
                </div>

                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#171A19] border border-[#38443C]">
                  <MapPin className="w-3.5 h-3.5 text-[#E5B86A]" />
                  <span>Direct Table Service</span>
                </div>
              </div>
            </div>

            {/* Quick Summary Pill for Table */}
            <div className="bg-[#222825] border border-[#38443C] p-4 rounded-2xl flex items-center gap-4 self-start md:self-auto min-w-[200px]">
              <div className="w-12 h-12 rounded-xl bg-[#24543A] border border-[#326B4B] flex flex-col items-center justify-center text-[#F5F0E6]">
                <span className="text-[10px] uppercase font-bold leading-none">
                  Table
                </span>
                <span className="text-xl font-black leading-tight text-[#E5B86A]">
                  {tableNumber}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#F5F5F0]">
                  QR Order Active
                </p>
                <p className="text-[11px] text-[#A8B3AA]">
                  Items will be delivered here
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          C & D. SEARCH & CATEGORY CONTROLS SECTION
      ───────────────────────────────────────────────────────────── */}
      <section className="sticky top-16 md:top-20 z-30 bg-[#171A19]/95 backdrop-blur-md border-b border-[#38443C] py-4 shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          {/* Top Bar: Search Input & Veg Filter Toggle */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8B3AA]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dishes, ingredients, or flavors..."
                aria-label="Search menu items"
                className="
                  w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#222825] border border-[#38443C]
                  text-sm text-[#F5F5F0] placeholder-[#A8B3AA] transition-colors
                  focus:outline-none focus:border-[#82B895] focus:ring-2 focus:ring-[#82B895]/30
                "
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search input"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8B3AA] hover:text-[#F5F5F0] p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Dietary Toggle: Veg Only */}
            <div className="flex items-center justify-between sm:justify-end gap-2">
              <button
                type="button"
                onClick={() => setVegOnly((prev) => !prev)}
                aria-pressed={vegOnly}
                className={`
                  inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold
                  border transition-all duration-200 cursor-pointer
                  focus:outline-none focus:ring-2 focus:ring-[#82B895]
                  ${
                    vegOnly
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600 shadow-sm'
                      : 'bg-[#222825] text-[#A8B3AA] border-[#38443C] hover:text-[#F5F5F0] hover:border-[#82B895]/50'
                  }
                `}
              >
                <Leaf
                  className={`w-3.5 h-3.5 ${
                    vegOnly ? 'text-emerald-400' : 'text-[#A8B3AA]'
                  }`}
                />
                <span>Pure Veg</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    vegOnly ? 'bg-emerald-400' : 'bg-transparent border border-[#A8B3AA]'
                  }`}
                />
              </button>

              {/* Results Count indicator */}
              <div className="text-xs text-[#A8B3AA] px-2 py-1">
                <span className="font-bold text-[#F5F5F0]">
                  {filteredItems.length}
                </span>{' '}
                {filteredItems.length === 1 ? 'dish' : 'dishes'}
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <CategoryTabs
            categories={CATEGORIES}
            activeCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            itemCounts={categoryCounts}
          />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          E. MAIN FOOD GRID & EMPTY STATES
      ───────────────────────────────────────────────────────────── */}
      <main
        id="menu-items-grid"
        className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8"
      >
        {/* Active Filters Summary (if any filter is applied) */}
        {(searchQuery || selectedCategory !== 'All' || vegOnly) && (
          <div className="flex items-center justify-between flex-wrap gap-2 mb-6 pb-3 border-b border-[#38443C]">
            <div className="flex items-center gap-2 text-xs text-[#A8B3AA]">
              <span>Active filters:</span>
              {selectedCategory !== 'All' && (
                <span className="px-2.5 py-1 rounded-md bg-[#222825] border border-[#38443C] text-[#F5F5F0] font-medium">
                  {selectedCategory}
                </span>
              )}
              {vegOnly && (
                <span className="px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 font-medium">
                  Veg Only
                </span>
              )}
              {searchQuery && (
                <span className="px-2.5 py-1 rounded-md bg-[#222825] border border-[#38443C] text-[#E5B86A] font-medium">
                  "{searchQuery}"
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 text-xs text-[#E5B86A] hover:underline cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#82B895] rounded px-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset all filters
            </button>
          </div>
        )}

        {/* Items Grid */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        ) : (
          /* Empty Search / Filter State */
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl bg-[#222825] border border-[#38443C] my-8">
            <div className="w-16 h-16 rounded-2xl bg-[#171A19] border border-[#38443C] flex items-center justify-center text-[#A8B3AA] mb-4">
              <Search className="w-8 h-8 opacity-40 text-[#E5B86A]" />
            </div>
            <h3 className="text-xl font-bold text-[#F5F5F0] mb-2">
              No culinary matches found
            </h3>
            <p className="text-sm text-[#A8B3AA] max-w-md mb-6 leading-relaxed">
              We couldn't find any dishes matching your current selection{' '}
              {searchQuery && (
                <span className="text-[#E5B86A]">"{searchQuery}"</span>
              )}
              . Try adjusting your search term or exploring another category.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="
                inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                bg-[#24543A] hover:bg-[#326B4B] text-[#F5F0E6] text-sm font-semibold
                border border-[#326B4B] transition-colors cursor-pointer
                focus:outline-none focus:ring-2 focus:ring-[#82B895]
              "
            >
              <RotateCcw className="w-4 h-4" />
              View Full Menu
            </button>
          </div>
        )}
      </main>

      {/* ─────────────────────────────────────────────────────────────
          FOOTER
          Subtle restaurant branding & Member 1 responsibility note
      ───────────────────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-[#38443C] bg-[#222825] py-8 text-xs text-[#A8B3AA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#F5F5F0]">ServeSync</span>
            <span>•</span>
            <span>Customer Menu Module</span>
            <span>•</span>
            <span className="text-[#E5B86A]">Phase 1</span>
          </div>
          <p className="text-center sm:text-right">
            QR Ordering System • Table #{tableNumber} Active
          </p>
        </div>
      </footer>

      {/* ─────────────────────────────────────────────────────────────
          FLOATING TOAST NOTIFICATION
          Visible feedback when customer adds an item to cart
      ───────────────────────────────────────────────────────────── */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="
            fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl
            bg-[#24543A] text-[#F5F0E6] border border-[#326B4B] shadow-2xl
            animate-bounce-subtle
          "
        >
          <CheckCircle2 className="w-5 h-5 text-[#82B895]" />
          <div>
            <p className="text-xs font-bold leading-tight">
              {toastMessage.title}
            </p>
            <p className="text-[11px] text-[#A8B3AA] leading-tight">
              {toastMessage.message}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

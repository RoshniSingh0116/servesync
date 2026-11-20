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
  Loader2,
  AlertTriangle,
  UtensilsCrossed,
} from 'lucide-react';
import CategoryTabs from '../../components/customer/CategoryTabs';
import MenuItemCard from '../../components/customer/MenuItemCard';
import { useCart } from '../../context/CartContext';
import { RESTAURANT_INFO } from '../../mocks/mockData';
import { useFoods } from '../../hooks/useFoods';

function getTableNumberFromUrl() {
  if (typeof window !== 'undefined' && window.location?.search) {
    const params = new URLSearchParams(window.location.search);
    const table = params.get('table');
    if (table && table.trim() !== '') {
      return table.trim();
    }
  }
  return '1';
}

export default function MenuPage({ onAddToCart: externalAddToCart }) {
  const navigate = useNavigate();
  const { addToCart, cartCount } = useCart();

  const { foods, loading, error, refetch } = useFoods();

  const [tableNumber, setTableNumber] = useState(getTableNumberFromUrl);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [vegOnly, setVegOnly] = useState(false);

  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    const handleLocationChange = () => {
      setTableNumber(getTableNumberFromUrl());
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  useEffect(() => {
    setSelectedCategory('All');
  }, [foods]);

  const totalCartCount = cartCount;

  const categories = useMemo(() => {
    if (foods.length === 0) return ['All'];
    const unique = [...new Set(foods.map((item) => item.category))].sort();
    return ['All', ...unique];
  }, [foods]);

  const categoryCounts = useMemo(() => {
    const counts = { All: foods.length };
    categories.forEach((cat) => {
      if (cat !== 'All') {
        counts[cat] = foods.filter((item) => item.category === cat).length;
      }
    });
    return counts;
  }, [foods, categories]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return foods.filter((item) => {
      const matchesCategory =
        selectedCategory === 'All' || item.category === selectedCategory;

      const matchesSearch =
        query === '' ||
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query);

      const matchesVeg = !vegOnly || item.isVeg === true;

      return matchesCategory && matchesSearch && matchesVeg;
    });
  }, [foods, searchQuery, selectedCategory, vegOnly]);

  const handleAddToCart = (item) => {
    if (item.isAvailable === false) return;

    if (typeof addToCart === 'function') {
      addToCart(item);
    }

    setToastMessage({
      title: 'Added to Order',
      message: `${item.name} · ₹${item.price}`,
    });
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);

    if (typeof externalAddToCart === 'function') {
      externalAddToCart(item);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setVegOnly(false);
  };

  return (
    <div className="min-h-screen bg-[#F7F7F4] text-[#20251F] flex flex-col font-sans">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E6E8E1] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-18">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#526B50] flex items-center justify-center text-white shadow-xs">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl md:text-2xl font-bold tracking-tight text-[#20251F] block leading-none">
                  Dinning Room
                </span>
                <span className="text-[10px] md:text-xs text-[#74796F] tracking-wider uppercase font-medium">
                  Artisanal Dining
                </span>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFF1EA] border border-[#E6E8E1] text-xs">
              <span className="w-2 h-2 rounded-full bg-[#526B50] animate-pulse" />
              <span className="text-[#74796F]">Table</span>
              <span className="font-bold text-[#20251F]">#{tableNumber}</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => navigate('/kitchen')}
                title="Kitchen Display"
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-[#74796F] hover:text-[#20251F] hover:bg-[#EFF1EA] border border-transparent hover:border-[#E6E8E1] transition-colors cursor-pointer"
              >
                <ChefHat className="w-4 h-4 text-[#526B50]" />
                <span>Kitchen</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/admin/dashboard')}
                title="Admin Dashboard"
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-[#74796F] hover:text-[#20251F] hover:bg-[#EFF1EA] border border-transparent hover:border-[#E6E8E1] transition-colors cursor-pointer"
              >
                <Shield className="w-4 h-4 text-[#526B50]" />
                <span>Admin</span>
              </button>

              <button
                type="button"
                onClick={() => navigate(`/cart?table=${tableNumber}`)}
                aria-label={`View order cart with ${totalCartCount} items`}
                className="
                  relative flex items-center gap-2 px-3.5 py-2 md:px-4 md:py-2 rounded-md
                  bg-[#526B50] text-white hover:bg-[#40563F] shadow-xs
                  transition-all duration-150 cursor-pointer
                  focus:outline-none focus:ring-2 focus:ring-[#526B50]/30
                "
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline text-xs font-semibold">
                  Cart
                </span>
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-white text-[#526B50] text-xs font-bold">
                  {totalCartCount}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="sm:hidden px-4 py-2 bg-[#EFF1EA] border-t border-[#E6E8E1] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-[#526B50]" />
            <span className="text-[#74796F]">Dining at</span>
            <span className="font-bold text-[#20251F]">Table {tableNumber}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/kitchen')}
              className="text-[#526B50] font-semibold text-xs hover:underline cursor-pointer"
            >
              Kitchen
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/dashboard')}
              className="text-[#526B50] font-semibold text-xs hover:underline cursor-pointer"
            >
              Admin
            </button>
          </div>
        </div>
      </header>

      <section className="bg-white border-b border-[#E6E8E1] pt-8 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EFF1EA] border border-[#E6E8E1] text-xs text-[#526B50] font-medium mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{RESTAURANT_INFO.tagline}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#20251F] tracking-tight leading-tight mb-2">
                Dinning Room
              </h1>

              <p className="text-sm sm:text-base text-[#74796F] leading-relaxed mb-4">
                {RESTAURANT_INFO.description}
              </p>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-[#74796F]">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#F7F7F4] border border-[#E6E8E1]">
                  <Star className="w-3.5 h-3.5 fill-[#526B50] text-[#526B50]" />
                  <span className="font-bold text-[#20251F]">{RESTAURANT_INFO.rating}</span>
                  <span>({RESTAURANT_INFO.reviewsCount})</span>
                </div>

                <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#F7F7F4] border border-[#E6E8E1]">
                  <Clock className="w-3.5 h-3.5 text-[#526B50]" />
                  <span>Prep: {RESTAURANT_INFO.prepTime}</span>
                </div>

                <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#F7F7F4] border border-[#E6E8E1]">
                  <MapPin className="w-3.5 h-3.5 text-[#526B50]" />
                  <span>Tabletop QR Ordering</span>
                </div>
              </div>
            </div>

            <div className="bg-[#FAFBF8] border border-[#E6E8E1] p-4 rounded-xl flex items-center gap-3.5 self-start md:self-auto min-w-[200px]">
              <div className="w-12 h-12 rounded-lg bg-[#EFF1EA] border border-[#E6E8E1] flex flex-col items-center justify-center text-[#20251F]">
                <span className="text-[10px] uppercase font-bold text-[#74796F] leading-none">Table</span>
                <span className="text-xl font-bold leading-tight text-[#526B50]">#{tableNumber}</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#20251F]">Direct Table Service</p>
                <p className="text-[11px] text-[#74796F]">Orders served fresh here</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sticky top-16 md:top-18 z-30 bg-[#F7F7F4]/95 backdrop-blur-md border-b border-[#E6E8E1] py-3.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#74796F]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search food, ingredients, or flavors..."
                aria-label="Search menu items"
                className="
                  w-full pl-10 pr-10 py-2 rounded-md bg-white border border-[#E6E8E1]
                  text-sm text-[#20251F] placeholder:text-[#74796F] transition-colors
                  focus:outline-none focus:border-[#526B50] focus:ring-2 focus:ring-[#526B50]/20
                "
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search input"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#74796F] hover:text-[#20251F] p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setVegOnly((prev) => !prev)}
                aria-pressed={vegOnly}
                className={`
                  inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold
                  border transition-all duration-150 cursor-pointer
                  focus:outline-none focus:ring-2 focus:ring-[#526B50]/30
                  ${
                    vegOnly
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-white text-[#74796F] border-[#E6E8E1] hover:text-[#20251F] hover:bg-[#EFF1EA]'
                  }
                `}
              >
                <Leaf className={`w-3.5 h-3.5 ${vegOnly ? 'text-emerald-600' : 'text-[#74796F]'}`} />
                <span>Vegetarian Only</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    vegOnly ? 'bg-emerald-600' : 'border border-[#74796F]'
                  }`}
                />
              </button>

              <div className="text-xs text-[#74796F] px-1">
                <span className="font-bold text-[#20251F]">
                  {loading ? '—' : filteredItems.length}
                </span>{' '}
                {filteredItems.length === 1 ? 'dish' : 'dishes'}
              </div>
            </div>
          </div>

          <CategoryTabs
            categories={categories}
            activeCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            itemCounts={categoryCounts}
          />
        </div>
      </section>

      <main id="menu-items-grid" className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Loader2 className="w-8 h-8 text-[#526B50] animate-spin mb-3" />
            <p className="text-sm text-[#74796F] font-medium">Preparing fresh menu…</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl bg-white border border-[#E6E8E1] my-8 shadow-xs max-w-md mx-auto">
            <div className="w-12 h-12 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>
            <h3 className="text-base font-bold text-[#20251F] mb-1">Unable to Load Menu</h3>
            <p className="text-xs text-[#74796F] mb-5 leading-relaxed">{error}</p>
            <button
              type="button"
              onClick={refetch}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#526B50] hover:bg-[#40563F] text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {(searchQuery || selectedCategory !== 'All' || vegOnly) && (
              <div className="flex items-center justify-between flex-wrap gap-2 mb-6 pb-3 border-b border-[#E6E8E1]">
                <div className="flex items-center gap-2 text-xs text-[#74796F]">
                  <span>Active filters:</span>
                  {selectedCategory !== 'All' && (
                    <span className="px-2 py-0.5 rounded-md bg-white border border-[#E6E8E1] text-[#20251F] font-medium">
                      {selectedCategory}
                    </span>
                  )}
                  {vegOnly && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
                      Veg Only
                    </span>
                  )}
                  {searchQuery && (
                    <span className="px-2 py-0.5 rounded-md bg-white border border-[#E6E8E1] text-[#20251F] font-medium">
                      &quot;{searchQuery}&quot;
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 text-xs text-[#526B50] font-medium hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset all
                </button>
              </div>
            )}

            {foods.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-xl bg-white border border-[#E6E8E1] my-8 shadow-xs max-w-md mx-auto">
                <div className="w-12 h-12 rounded-lg bg-[#EFF1EA] border border-[#E6E8E1] flex items-center justify-center text-[#74796F] mb-3">
                  <UtensilsCrossed className="w-6 h-6 text-[#526B50]" />
                </div>
                <h3 className="text-base font-bold text-[#20251F] mb-1">Menu is currently updating</h3>
                <p className="text-xs text-[#74796F] mb-5 leading-relaxed">
                  Our culinary team is updating today&apos;s selections. Please check back in a few moments.
                </p>
                <button
                  type="button"
                  onClick={refetch}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#526B50] hover:bg-[#40563F] text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Refresh
                </button>
              </div>
            )}

            {foods.length > 0 && filteredItems.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredItems.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            )}

            {foods.length > 0 && filteredItems.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-xl bg-white border border-[#E6E8E1] my-8 shadow-xs max-w-md mx-auto">
                <div className="w-12 h-12 rounded-lg bg-[#EFF1EA] border border-[#E6E8E1] flex items-center justify-center text-[#74796F] mb-3">
                  <Search className="w-6 h-6 text-[#526B50]" />
                </div>
                <h3 className="text-base font-bold text-[#20251F] mb-1">No matching dishes</h3>
                <p className="text-xs text-[#74796F] mb-5 leading-relaxed">
                  We couldn&apos;t find any items matching your selection. Try clearing your search or switching categories.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#526B50] hover:bg-[#40563F] text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  View All Dishes
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="mt-auto border-t border-[#E6E8E1] bg-white py-6 text-xs text-[#74796F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#20251F]">Dinning Room</span>
            <span>·</span>
            <span>Artisanal Hospitality &amp; Dining</span>
          </div>
          <p className="text-center sm:text-right">
            Tabletop QR Ordering · Table #{tableNumber} Active
          </p>
        </div>
      </footer>

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="
            fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-lg
            bg-[#20251F] text-white shadow-md border border-[#20251F]
            animate-in fade-in slide-in-from-bottom-2 duration-150
          "
        >
          <CheckCircle2 className="w-4 h-4 text-[#82B895]" />
          <div>
            <p className="text-xs font-semibold leading-tight">{toastMessage.title}</p>
            <p className="text-[11px] text-[#CBD0C5] leading-tight">{toastMessage.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}

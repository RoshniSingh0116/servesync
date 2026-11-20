export default function CategoryTabs({
  categories = [],
  activeCategory = 'All',
  onSelectCategory,
  itemCounts = {},
  selectedCategory,
  onSelect,
  categoryCounts,
}) {
  const resolvedActive = activeCategory ?? selectedCategory ?? 'All';
  const resolvedOnSelect = onSelectCategory ?? onSelect;
  const resolvedCounts = (itemCounts && Object.keys(itemCounts).length > 0) ? itemCounts : (categoryCounts ?? {});

  return (
    <nav aria-label="Food Categories" className="w-full">
      <div
        role="tablist"
        aria-orientation="horizontal"
        className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map((category) => {
          const isActive = resolvedActive === category;
          const count = resolvedCounts[category];

          return (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls="menu-items-grid"
              onClick={() => resolvedOnSelect?.(category)}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium
                whitespace-nowrap transition-all duration-150 cursor-pointer
                focus:outline-none focus:ring-2 focus:ring-[#526B50]/40
                ${
                  isActive
                    ? 'bg-[#526B50] text-white shadow-sm'
                    : 'text-[#74796F] hover:text-[#20251F] hover:bg-[#EFF1EA]'
                }
              `}
            >
              <span>{category}</span>
              {typeof count === 'number' && (
                <span
                  className={`
                    text-xs px-1.5 py-0.5 rounded-full font-semibold transition-colors
                    ${isActive ? 'bg-white/20 text-white' : 'bg-[#E6E8E1] text-[#74796F]'}
                  `}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

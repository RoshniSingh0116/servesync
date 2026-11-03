/**
 * CategoryTabs Component
 * Horizontal scrolling navigation for filtering food items by category.
 *
 * @param {Object} props
 * @param {string[]} props.categories - List of category names
 * @param {string} props.activeCategory - Currently selected category
 * @param {Function} props.onSelectCategory - Callback when a category is clicked
 * @param {Object<string, number>} [props.itemCounts] - Optional dynamic count of items per category
 */
export default function CategoryTabs({
  categories = [],
  activeCategory = 'All',
  onSelectCategory,
  itemCounts = {},
}) {
  return (
    <nav
      aria-label="Food Categories"
      className="w-full"
    >
      <div
        role="tablist"
        aria-orientation="horizontal"
        className="flex items-center gap-2 md:gap-3 overflow-x-auto pb-2 pt-1 px-1 scroll-smooth no-scrollbar"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {categories.map((category) => {
          const isActive = activeCategory === category;
          const count = itemCounts[category];

          return (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls="menu-items-grid"
              onClick={() => onSelectCategory?.(category)}
              className={`
                group relative inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium
                whitespace-nowrap transition-all duration-200 cursor-pointer
                focus:outline-none focus:ring-2 focus:ring-[#82B895] focus:ring-offset-2 focus:ring-offset-[#171A19]
                ${
                  isActive
                    ? 'bg-[#24543A] text-[#F5F5F0] border border-[#326B4B] shadow-md shadow-[#24543A]/20'
                    : 'bg-[#222825] text-[#A8B3AA] border border-[#38443C] hover:text-[#F5F5F0] hover:bg-[#2A332E] hover:border-[#82B895]/50'
                }
              `}
            >
              <span>{category}</span>

              {typeof count === 'number' && (
                <span
                  className={`
                    text-xs px-2 py-0.5 rounded-full font-semibold transition-colors
                    ${
                      isActive
                        ? 'bg-[#171A19]/50 text-[#E5B86A]'
                        : 'bg-[#171A19]/60 text-[#A8B3AA] group-hover:text-[#F5F5F0]'
                    }
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

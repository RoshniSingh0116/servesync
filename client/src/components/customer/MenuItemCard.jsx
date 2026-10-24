import { useState } from 'react';
import { Plus, Check, Star, UtensilsCrossed } from 'lucide-react';

/**
 * MenuItemCard Component
 * Displays a single food item with image, dietary badge, price, and Add to Cart action.
 *
 * @param {Object} props
 * @param {Object} props.item - The food item data
 * @param {string|number} props.item.id - Unique ID
 * @param {string} props.item.name - Dish name
 * @param {string} props.item.description - Short description
 * @param {number} props.item.price - Price in INR
 * @param {string} props.item.category - Category name
 * @param {string} [props.item.image] - Image URL
 * @param {boolean} [props.item.isVeg] - Whether the item is vegetarian
 * @param {boolean} [props.item.isPopular] - Whether marked as popular/bestseller
 * @param {Function} [props.onAddToCart] - Callback when item is added to cart
 */
export default function MenuItemCard({ item, onAddToCart }) {
  const [imgError, setImgError] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  if (!item) return null;

  const handleAdd = () => {
    // Trigger visual feedback
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1200);

    // Trigger parent callback
    if (typeof onAddToCart === 'function') {
      onAddToCart(item);
    }
  };

  return (
    <article
      data-testid={`menu-card-${item.id}`}
      className="
        group relative flex flex-col h-full bg-[#F5F0E6] text-[#202722]
        rounded-2xl border border-[#DDD8CC] overflow-hidden
        shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1
      "
    >
      {/* Image Container with Consistent Aspect Ratio */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#EAE4D6]">
        {!imgError && item.image ? (
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="h-full w-full flex flex-col items-center justify-center p-4 text-[#68736A] bg-[#EAE4D6]"
            aria-label={`${item.name} image placeholder`}
          >
            <UtensilsCrossed className="w-10 h-10 mb-2 opacity-60 text-[#24543A]" />
            <span className="text-xs font-medium text-center text-[#68736A]">
              {item.name}
            </span>
          </div>
        )}

        {/* Top Badges Overlay */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
          {/* Veg / Non-Veg Indicator */}
          <div
            className="flex items-center justify-center w-6 h-6 rounded-md bg-[#F5F0E6]/95 shadow-sm backdrop-blur-sm pointer-events-auto"
            title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
            aria-label={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
          >
            <span
              className={`
                w-4 h-4 border flex items-center justify-center rounded-[3px]
                ${item.isVeg ? 'border-emerald-600' : 'border-rose-600'}
              `}
            >
              <span
                className={`
                  w-2 h-2 rounded-full
                  ${item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'}
                `}
              />
            </span>
          </div>

          {/* Popular / Bestseller Badge */}
          {item.isPopular && (
            <span
              className="
                inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold
                bg-[#E5B86A] text-[#171A19] shadow-md pointer-events-auto
              "
            >
              <Star className="w-3 h-3 fill-[#171A19]" />
              Bestseller
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="flex flex-col flex-1 p-5">
        {/* Category Pill & ID Tag */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#68736A]">
            {item.category}
          </span>
        </div>

        {/* Food Item Name */}
        <h3 className="text-lg font-bold text-[#202722] leading-snug line-clamp-1 mb-1.5 group-hover:text-[#24543A] transition-colors">
          {item.name}
        </h3>

        {/* Short Description */}
        <p className="text-xs text-[#68736A] leading-relaxed line-clamp-2 mb-4">
          {item.description}
        </p>

        {/* Price and Add to Cart Section (Pinned to Bottom) */}
        <div className="mt-auto pt-3 border-t border-[#DDD8CC]/70 flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] uppercase tracking-wider block text-[#68736A] font-medium leading-none mb-0.5">
              Price
            </span>
            <span className="text-lg font-bold text-[#202722] tracking-tight">
              ₹{item.price}
            </span>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            aria-label={`Add ${item.name} to cart for ₹${item.price}`}
            className={`
              relative inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl
              text-xs font-semibold transition-all duration-200 cursor-pointer
              focus:outline-none focus:ring-2 focus:ring-[#82B895] focus:ring-offset-2 focus:ring-offset-[#F5F0E6]
              ${
                isAdded
                  ? 'bg-emerald-700 text-white scale-95 shadow-inner'
                  : 'bg-[#24543A] hover:bg-[#326B4B] text-[#F5F0E6] shadow-sm hover:shadow-md active:scale-95'
              }
            `}
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Added</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

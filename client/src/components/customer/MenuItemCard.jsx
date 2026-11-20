import { useState } from 'react';
import { Plus, Check, Star, UtensilsCrossed } from 'lucide-react';

export default function MenuItemCard({ item, onAddToCart }) {
  const [imgError, setImgError] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  if (!item) return null;

  const isAvailable = item.isAvailable !== false;

  const handleAdd = () => {
    if (!isAvailable) return;

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1200);

    if (typeof onAddToCart === 'function') {
      onAddToCart(item);
    }
  };

  return (
    <article
      data-testid={`menu-card-${item.id}`}
      aria-disabled={!isAvailable}
      className={`
        group relative flex flex-col h-full bg-white
        rounded-lg border border-[#E6E8E1] overflow-hidden
        shadow-sm transition-all duration-200
        ${isAvailable
          ? 'hover:shadow-md hover:-translate-y-0.5'
          : 'opacity-60 cursor-not-allowed'}
      `}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#EFF1EA]">
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
            className="h-full w-full flex flex-col items-center justify-center p-4 text-[#74796F]"
            aria-label={`${item.name} image placeholder`}
          >
            <UtensilsCrossed className="w-10 h-10 mb-2 opacity-40 text-[#526B50]" />
            <span className="text-xs font-medium text-center text-[#74796F]">
              {item.name}
            </span>
          </div>
        )}

        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-2 pointer-events-none">
          <div
            className="flex items-center justify-center w-6 h-6 rounded bg-white/90 shadow-sm pointer-events-auto"
            title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
            aria-label={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
          >
            <span
              className={`w-3 h-3 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`}
            />
          </div>

          {item.isPopular && isAvailable && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#526B50] text-white shadow-sm pointer-events-auto">
              <Star className="w-3 h-3 fill-white" />
              Popular
            </span>
          )}

          {!isAvailable && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#E6E8E1] text-[#74796F] pointer-events-auto">
              Unavailable
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col flex-1 p-4">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#74796F] mb-1">
          {item.category}
        </span>

        <h3 className="text-base font-semibold text-[#20251F] leading-snug line-clamp-1 mb-1">
          {item.name}
        </h3>

        <p className="text-xs text-[#74796F] leading-relaxed line-clamp-2 mb-4 flex-1">
          {item.description}
        </p>

        <div className="mt-auto pt-3 border-t border-[#E6E8E1] flex items-center justify-between gap-3">
          <span className="text-base font-bold text-[#526B50]">
            ₹{item.price}
          </span>

          <button
            type="button"
            onClick={handleAdd}
            disabled={!isAvailable}
            aria-label={
              isAvailable
                ? `Add ${item.name} to cart for ₹${item.price}`
                : `${item.name} is currently unavailable`
            }
            className={`
              inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md
              text-xs font-semibold transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-[#526B50]/40
              ${!isAvailable
                ? 'bg-[#E6E8E1] text-[#74796F] cursor-not-allowed'
                : isAdded
                  ? 'bg-emerald-600 text-white scale-95 cursor-pointer'
                  : 'bg-[#526B50] hover:bg-[#40563F] text-white active:scale-95 cursor-pointer'
              }
            `}
          >
            {!isAvailable ? (
              <span>Unavailable</span>
            ) : isAdded ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Added</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

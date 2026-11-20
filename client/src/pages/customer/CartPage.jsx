import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  Minus,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Utensils,
  ShoppingCart,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';

function getTableFromSearch(search) {
  const params = new URLSearchParams(search);
  const t = params.get('table');
  return t && t.trim() !== '' ? t.trim() : '1';
}

function VegDot({ isVeg }) {
  return (
    <span
      title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
      className="inline-flex items-center justify-center w-4 h-4 rounded-sm border border-[#E6E8E1] bg-white flex-shrink-0 mt-0.5"
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isVeg ? 'bg-emerald-600' : 'bg-rose-600'
        }`}
      />
    </span>
  );
}

function CartRow({ item, onIncrease, onDecrease, onRemove }) {
  const lineTotal = item.price * item.quantity;
  const [imgError, setImgError] = useState(false);

  return (
    <li className="flex gap-4 p-4 sm:p-5 bg-white border border-[#E6E8E1] rounded-xl hover:border-[#CBD0C5] transition-colors shadow-xs">
      <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-lg overflow-hidden bg-[#EFF1EA] flex-shrink-0 border border-[#E6E8E1]">
        {item.image && !imgError ? (
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#74796F]">
            <Utensils className="w-6 h-6 text-[#526B50] opacity-40" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
        <div className="flex items-start gap-2">
          <VegDot isVeg={item.isVeg} />
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-[#20251F] leading-snug line-clamp-1">
              {item.name}
            </h3>
            <p className="text-xs text-[#74796F] mt-0.5">
              ₹{item.price.toLocaleString('en-IN')} each
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap mt-1">
          <div className="flex items-center rounded-md border border-[#E6E8E1] bg-[#FAFBF8] overflow-hidden">
            <button
              type="button"
              onClick={onDecrease}
              aria-label={`Decrease quantity of ${item.name}`}
              className="w-8 h-8 flex items-center justify-center text-[#74796F] hover:text-[#20251F] hover:bg-[#EFF1EA] transition-colors cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center text-xs font-bold text-[#20251F]">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={onIncrease}
              aria-label={`Increase quantity of ${item.name}`}
              className="w-8 h-8 flex items-center justify-center text-[#74796F] hover:text-[#20251F] hover:bg-[#EFF1EA] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-base font-bold text-[#20251F]">
              ₹{lineTotal.toLocaleString('en-IN')}
            </span>
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${item.name} from cart`}
              className="p-1.5 rounded-md text-[#74796F] hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

function OrderSummary({ subtotal, total, tableNumber, onCheckout, cartCount }) {
  return (
    <div className="bg-white border border-[#E6E8E1] rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
      <h2 className="text-base font-bold text-[#20251F]">Order Summary</h2>

      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#EFF1EA] border border-[#E6E8E1] text-xs">
        <span className="w-2 h-2 rounded-full bg-[#526B50] animate-pulse flex-shrink-0" />
        <span className="text-[#74796F]">Serving Table</span>
        <span className="font-bold text-[#20251F]">#{tableNumber}</span>
      </div>

      <div className="space-y-2 pt-1">
        <div className="flex justify-between text-sm text-[#74796F]">
          <span>
            Subtotal ({cartCount} {cartCount === 1 ? 'dish' : 'dishes'})
          </span>
          <span className="text-[#20251F] font-medium">
            ₹{subtotal.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="flex justify-between text-xs text-[#74796F]">
          <span>Taxes &amp; service</span>
          <span>Included</span>
        </div>
      </div>

      <div className="border-t border-[#E6E8E1]" />

      <div className="flex justify-between items-center">
        <span className="text-base font-bold text-[#20251F]">Estimated Total</span>
        <span className="text-xl font-extrabold text-[#526B50]">
          ₹{total.toLocaleString('en-IN')}
        </span>
      </div>

      <button
        type="button"
        onClick={onCheckout}
        disabled={cartCount === 0}
        className="
          w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md
          bg-[#526B50] hover:bg-[#40563F] text-white text-sm font-semibold
          transition-colors duration-150 cursor-pointer shadow-xs
          disabled:opacity-50 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-[#526B50]/30
        "
      >
        <span>Proceed to Checkout</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function EmptyCart({ onBrowse }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center max-w-sm mx-auto">
      <div className="w-16 h-16 rounded-xl bg-white border border-[#E6E8E1] flex items-center justify-center mb-4 shadow-xs">
        <ShoppingCart className="w-7 h-7 text-[#526B50]" />
      </div>
      <h2 className="text-xl font-bold text-[#20251F] mb-1.5">
        Your order is empty
      </h2>
      <p className="text-xs text-[#74796F] leading-relaxed mb-6">
        Select artisanal dishes from our menu to begin your dining experience.
      </p>
      <button
        type="button"
        onClick={onBrowse}
        className="
          inline-flex items-center gap-2 px-5 py-2.5 rounded-md
          bg-[#526B50] hover:bg-[#40563F] text-white text-xs font-semibold
          transition-colors cursor-pointer shadow-xs
          focus:outline-none focus:ring-2 focus:ring-[#526B50]/30
        "
      >
        <ArrowLeft className="w-4 h-4" />
        Browse Menu
      </button>
    </div>
  );
}

export default function CartPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const tableNumber = getTableFromSearch(search);

  const { cartItems, cartCount, subtotal, total, removeFromCart, updateQuantity } =
    useCart();

  const handleBrowse = () => navigate(`/menu?table=${tableNumber}`);
  const handleCheckout = () => navigate(`/checkout?table=${tableNumber}`);

  return (
    <div className="min-h-screen bg-[#F7F7F4] text-[#20251F] flex flex-col font-sans">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E6E8E1]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <button
            type="button"
            onClick={handleBrowse}
            aria-label="Back to menu"
            className="p-2 rounded-md bg-[#FAFBF8] border border-[#E6E8E1] hover:bg-[#EFF1EA] text-[#74796F] hover:text-[#20251F] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5 flex-1">
            <div className="w-8 h-8 rounded-md bg-[#526B50] flex items-center justify-center text-white">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-bold text-[#20251F] block leading-none">
                Dinning Room
              </span>
              <span className="text-xs text-[#74796F] block leading-none mt-0.5">
                Current Order
              </span>
            </div>
          </div>

          {cartCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-[#EFF1EA] text-[#526B50] text-xs font-bold border border-[#E6E8E1]">
              {cartCount}
            </span>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        {cartItems.length === 0 ? (
          <EmptyCart onBrowse={handleBrowse} />
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <section className="flex-1 min-w-0 w-full" aria-label="Cart items">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-lg font-bold text-[#20251F]">
                  Order Items
                  <span className="ml-2 text-xs font-normal text-[#74796F]">
                    ({cartCount} {cartCount === 1 ? 'item' : 'items'})
                  </span>
                </h1>
                <button
                  type="button"
                  onClick={handleBrowse}
                  className="text-xs font-semibold text-[#526B50] hover:text-[#40563F] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add more items
                </button>
              </div>

              <ul className="space-y-3" role="list">
                {cartItems.map((item) => (
                  <CartRow
                    key={item.id}
                    item={item}
                    onIncrease={() => updateQuantity(item.id, +1)}
                    onDecrease={() => updateQuantity(item.id, -1)}
                    onRemove={() => removeFromCart(item.id)}
                  />
                ))}
              </ul>
            </section>

            <aside className="w-full lg:w-80 lg:sticky lg:top-24">
              <OrderSummary
                subtotal={subtotal}
                total={total}
                tableNumber={tableNumber}
                cartCount={cartCount}
                onCheckout={handleCheckout}
              />
              <button
                type="button"
                onClick={handleBrowse}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-md border border-[#E6E8E1] bg-white text-[#74796F] hover:text-[#20251F] hover:bg-[#EFF1EA] text-xs font-medium transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Return to Menu
              </button>
            </aside>
          </div>
        )}
      </main>

      <footer className="mt-auto border-t border-[#E6E8E1] bg-white py-5 text-xs text-[#74796F]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            <span className="font-bold text-[#20251F]">Dinning Room</span> · Tabletop Dining Experience
          </span>
          <span>Table #{tableNumber} Active</span>
        </div>
      </footer>
    </div>
  );
}

/**
 * CartPage — ServeSync Member 2
 * Displays all items in the cart with quantity controls, remove action,
 * per-item subtotals, order totals, and navigation to checkout.
 */

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

/* ─── Helper ─────────────────────────────────────────────── */
function getTableFromSearch(search) {
  const params = new URLSearchParams(search);
  const t = params.get('table');
  return t && t.trim() !== '' ? t.trim() : '1';
}

/* ─── Veg / Non-Veg dot (matches MenuItemCard style) ────── */
function VegDot({ isVeg }) {
  return (
    <span
      title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
      className={`inline-flex items-center justify-center w-5 h-5 rounded-sm border ${
        isVeg ? 'border-emerald-600' : 'border-rose-600'
      } bg-[#F5F0E6] flex-shrink-0`}
    >
      <span
        className={`w-2.5 h-2.5 rounded-full ${
          isVeg ? 'bg-emerald-600' : 'bg-rose-600'
        }`}
      />
    </span>
  );
}

/* ─── Single cart row ────────────────────────────────────── */
function CartRow({ item, onIncrease, onDecrease, onRemove }) {
  const lineTotal = item.price * item.quantity;
  const [imgError, setImgError] = useState(false);

  return (
    <li className="flex gap-4 p-4 sm:p-5 bg-[#222825] border border-[#38443C] rounded-2xl hover:border-[#326B4B] transition-colors">
      {/* Image */}
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-[#1A1E1C] flex-shrink-0 border border-[#38443C]">
        {item.image && !imgError ? (
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#38443C]">
            <Utensils className="w-8 h-8" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
        {/* Name + veg dot */}
        <div className="flex items-start gap-2">
          <VegDot isVeg={item.isVeg} />
          <h3 className="text-sm sm:text-base font-semibold text-[#F5F5F0] leading-snug line-clamp-2">
            {item.name}
          </h3>
        </div>

        {/* Unit price */}
        <p className="text-xs text-[#A8B3AA]">
          ₹{item.price.toLocaleString('en-IN')} each
        </p>

        {/* Controls row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Qty stepper */}
          <div className="flex items-center rounded-xl border border-[#38443C] overflow-hidden bg-[#171A19]">
            <button
              type="button"
              onClick={onDecrease}
              aria-label={`Decrease quantity of ${item.name}`}
              className="w-8 h-8 flex items-center justify-center text-[#A8B3AA] hover:text-[#F5F5F0] hover:bg-[#222825] transition-colors cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center text-sm font-bold text-[#F5F5F0]">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={onIncrease}
              aria-label={`Increase quantity of ${item.name}`}
              className="w-8 h-8 flex items-center justify-center text-[#A8B3AA] hover:text-[#F5F5F0] hover:bg-[#222825] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Line total + remove */}
          <div className="flex items-center gap-3">
            <span className="text-base font-bold text-[#E5B86A]">
              ₹{lineTotal.toLocaleString('en-IN')}
            </span>
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${item.name} from cart`}
              className="p-1.5 rounded-lg text-[#68736A] hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/50 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

/* ─── Order summary panel ────────────────────────────────── */
function OrderSummary({ subtotal, total, tableNumber, onCheckout, cartCount }) {
  return (
    <div className="bg-[#222825] border border-[#38443C] rounded-2xl p-5 sm:p-6 space-y-4">
      <h2 className="text-base font-bold text-[#F5F5F0]">Order Summary</h2>

      {/* Table indicator */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#171A19] border border-[#38443C] text-xs">
        <span className="w-2 h-2 rounded-full bg-[#82B895] animate-pulse flex-shrink-0" />
        <span className="text-[#A8B3AA]">Dining at</span>
        <span className="font-bold text-[#E5B86A]">Table {tableNumber}</span>
      </div>

      {/* Subtotal row */}
      <div className="space-y-2 pt-1">
        <div className="flex justify-between text-sm text-[#A8B3AA]">
          <span>
            Subtotal ({cartCount} {cartCount === 1 ? 'item' : 'items'})
          </span>
          <span className="text-[#F5F5F0] font-medium">
            ₹{subtotal.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="flex justify-between text-xs text-[#68736A]">
          <span>Taxes & charges</span>
          <span>Included</span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#38443C]" />

      {/* Total */}
      <div className="flex justify-between items-center">
        <span className="text-base font-bold text-[#F5F5F0]">Total</span>
        <span className="text-xl font-black text-[#E5B86A]">
          ₹{total.toLocaleString('en-IN')}
        </span>
      </div>

      {/* Checkout CTA */}
      <button
        type="button"
        onClick={onCheckout}
        disabled={cartCount === 0}
        className="
          w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl
          bg-[#24543A] hover:bg-[#326B4B] active:scale-[0.98]
          text-[#F5F0E6] text-sm font-bold
          border border-[#326B4B] transition-all duration-200 cursor-pointer
          disabled:opacity-40 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-[#82B895]
        "
      >
        <span>Proceed to Checkout</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ─── Empty cart state ───────────────────────────────────── */
function EmptyCart({ onBrowse }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="w-24 h-24 rounded-3xl bg-[#222825] border border-[#38443C] flex items-center justify-center mb-6">
        <ShoppingCart className="w-10 h-10 text-[#38443C]" />
      </div>
      <h2 className="text-2xl font-black text-[#F5F5F0] mb-2">
        Your cart is empty
      </h2>
      <p className="text-sm text-[#A8B3AA] max-w-xs leading-relaxed mb-8">
        Looks like you haven't added anything yet. Browse our menu and discover
        something delicious!
      </p>
      <button
        type="button"
        onClick={onBrowse}
        className="
          inline-flex items-center gap-2 px-6 py-3 rounded-xl
          bg-[#24543A] hover:bg-[#326B4B] text-[#F5F0E6] text-sm font-bold
          border border-[#326B4B] transition-colors cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-[#82B895]
        "
      >
        <ArrowLeft className="w-4 h-4" />
        Browse Menu
      </button>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────── */
export default function CartPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const tableNumber = getTableFromSearch(search);

  const { cartItems, cartCount, subtotal, total, removeFromCart, updateQuantity } =
    useCart();

  const handleBrowse = () => navigate(`/menu?table=${tableNumber}`);
  const handleCheckout = () => navigate(`/checkout?table=${tableNumber}`);

  return (
    <div className="min-h-screen bg-[#171A19] text-[#F5F5F0] flex flex-col">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-[#171A19]/95 backdrop-blur-md border-b border-[#38443C]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <button
            type="button"
            onClick={handleBrowse}
            aria-label="Back to menu"
            className="p-2 rounded-xl bg-[#222825] border border-[#38443C] hover:border-[#82B895] text-[#A8B3AA] hover:text-[#F5F5F0] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#82B895]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 flex-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#24543A] to-[#171A19] border border-[#326B4B] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-[#E5B86A]" />
            </div>
            <div>
              <span className="text-base font-black text-[#F5F5F0]">
                Serve<span className="text-[#E5B86A]">Sync</span>
              </span>
              <span className="text-xs text-[#A8B3AA] block leading-none">
                Your Cart
              </span>
            </div>
          </div>

          {cartCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full bg-[#24543A] text-[#F5F0E6] text-xs font-bold border border-[#326B4B]">
              {cartCount}
            </span>
          )}
        </div>
      </header>

      {/* ── Body ── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        {cartItems.length === 0 ? (
          <EmptyCart onBrowse={handleBrowse} />
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Left — item list */}
            <section className="flex-1 min-w-0" aria-label="Cart items">
              <div className="flex items-center justify-between mb-5">
                <h1 className="text-xl font-black text-[#F5F5F0]">
                  Cart
                  <span className="ml-2 text-sm font-normal text-[#A8B3AA]">
                    ({cartCount} {cartCount === 1 ? 'item' : 'items'})
                  </span>
                </h1>
                <button
                  type="button"
                  onClick={handleBrowse}
                  className="text-xs text-[#82B895] hover:text-[#E5B86A] transition-colors cursor-pointer flex items-center gap-1 focus:outline-none"
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

            {/* Right — summary (sticky on desktop) */}
            <aside className="w-full lg:w-80 lg:sticky lg:top-24">
              <OrderSummary
                subtotal={subtotal}
                total={total}
                tableNumber={tableNumber}
                cartCount={cartCount}
                onCheckout={handleCheckout}
              />
              {/* Continue shopping link */}
              <button
                type="button"
                onClick={handleBrowse}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#38443C] bg-transparent text-[#A8B3AA] hover:text-[#F5F5F0] hover:border-[#326B4B] text-xs font-medium transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#82B895]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Continue Shopping
              </button>
            </aside>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="mt-auto border-t border-[#38443C] bg-[#222825] py-5 text-xs text-[#A8B3AA]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            <span className="font-bold text-[#F5F5F0]">ServeSync</span> • Cart
            Module • Phase 1
          </span>
          <span>Table #{tableNumber} Active</span>
        </div>
      </footer>
    </div>
  );
}

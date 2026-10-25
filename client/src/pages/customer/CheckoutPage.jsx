/**
 * CheckoutPage — ServeSync Member 2
 * Displays the order summary for the current cart, reads the table number from
 * the URL (?table=X), and places a mock order on confirmation.
 *
 * Flow: CartPage → CheckoutPage → OrderConfirmationPage
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  ShoppingBag,
  Utensils,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useOrders } from '../../context/OrderContext';

/* ─── Helper ─────────────────────────────────────────────── */
function getTableFromSearch(search) {
  const params = new URLSearchParams(search);
  const t = params.get('table');
  return t && t.trim() !== '' ? t.trim() : '1';
}

/* ─── Veg dot ─────────────────────────────────────────────── */
function VegDot({ isVeg }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-4 h-4 rounded-sm border flex-shrink-0 mt-0.5 ${
        isVeg ? 'border-emerald-600' : 'border-rose-600'
      } bg-[#1A1E1C]`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isVeg ? 'bg-emerald-600' : 'bg-rose-600'
        }`}
      />
    </span>
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const tableNumber = getTableFromSearch(search);

  const { cartItems, total, subtotal, clearCart, cartCount } = useCart();
  const { addOrder } = useOrders();

  const [isPlacing, setIsPlacing] = useState(false);
  const [error, setError] = useState('');

  /* ── Place Order ── */
  const handlePlaceOrder = () => {
    setError('');

    // Validate: cart must not be empty
    if (cartItems.length === 0) {
      setError('Your cart is empty. Please add items before placing an order.');
      return;
    }

    setIsPlacing(true);

    // Simulate a brief "processing" delay for realistic UX (no actual network call)
    setTimeout(() => {
      const order = addOrder({
        tableNumber,
        items: cartItems,
        totalAmount: total,
      });

      clearCart();
      navigate(`/order-confirmation/${order.id}?table=${tableNumber}`);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#171A19] text-[#F5F5F0] flex flex-col">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-[#171A19]/95 backdrop-blur-md border-b border-[#38443C]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(`/cart?table=${tableNumber}`)}
            aria-label="Back to cart"
            className="p-2 rounded-xl bg-[#222825] border border-[#38443C] hover:border-[#82B895] text-[#A8B3AA] hover:text-[#F5F5F0] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#82B895]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 flex-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#24543A] to-[#171A19] border border-[#326B4B] flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-[#E5B86A]" />
            </div>
            <div>
              <span className="text-base font-black text-[#F5F5F0]">
                Serve<span className="text-[#E5B86A]">Sync</span>
              </span>
              <span className="text-xs text-[#A8B3AA] block leading-none">
                Checkout
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {/* Page title */}
        <div>
          <h1 className="text-2xl font-black text-[#F5F5F0] mb-1">
            Review Your Order
          </h1>
          <p className="text-sm text-[#A8B3AA]">
            Confirm your items and place your order for the table.
          </p>
        </div>

        {/* Table info card */}
        <div className="flex items-center gap-4 p-4 bg-[#222825] border border-[#38443C] rounded-2xl">
          <div className="w-14 h-14 rounded-xl bg-[#24543A] border border-[#326B4B] flex flex-col items-center justify-center text-[#F5F0E6] flex-shrink-0">
            <span className="text-[9px] uppercase font-bold leading-none text-[#A8B3AA]">
              Table
            </span>
            <span className="text-2xl font-black leading-tight text-[#E5B86A]">
              {tableNumber}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#F5F5F0]">
              QR Order — Table {tableNumber}
            </p>
            <p className="text-xs text-[#A8B3AA] mt-0.5">
              Your order will be served directly at this table.
            </p>
          </div>
        </div>

        {/* Order items */}
        <div className="bg-[#222825] border border-[#38443C] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#38443C] flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#E5B86A]" />
            <h2 className="text-sm font-bold text-[#F5F5F0]">
              Order Items
              <span className="ml-1.5 text-[#A8B3AA] font-normal">
                ({cartCount} {cartCount === 1 ? 'item' : 'items'})
              </span>
            </h2>
          </div>

          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center px-6">
              <Utensils className="w-10 h-10 text-[#38443C] mb-3" />
              <p className="text-sm text-[#A8B3AA]">
                No items in cart. Go back and add items to proceed.
              </p>
              <button
                type="button"
                onClick={() => navigate(`/menu?table=${tableNumber}`)}
                className="mt-4 px-5 py-2 rounded-xl bg-[#24543A] hover:bg-[#326B4B] text-[#F5F0E6] text-xs font-semibold border border-[#326B4B] transition-colors cursor-pointer"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-[#38443C]">
              {cartItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 px-5 py-3.5"
                >
                  <VegDot isVeg={item.isVeg} />
                  <span className="flex-1 text-sm text-[#F5F5F0] leading-snug">
                    {item.name}
                  </span>
                  <span className="text-xs text-[#A8B3AA] mr-2">
                    × {item.quantity}
                  </span>
                  <span className="text-sm font-semibold text-[#E5B86A] min-w-[60px] text-right">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Price breakdown */}
        <div className="bg-[#222825] border border-[#38443C] rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-[#F5F5F0] mb-1">
            Price Breakdown
          </h2>
          <div className="flex justify-between text-sm text-[#A8B3AA]">
            <span>Subtotal</span>
            <span className="text-[#F5F5F0] font-medium">
              ₹{subtotal.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between text-xs text-[#68736A]">
            <span>Service charges & taxes</span>
            <span>Included</span>
          </div>
          <div className="border-t border-[#38443C] pt-3 flex justify-between items-center">
            <span className="font-bold text-[#F5F5F0]">Total Amount</span>
            <span className="text-2xl font-black text-[#E5B86A]">
              ₹{total.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 p-4 bg-rose-950/40 border border-rose-800/60 rounded-xl text-sm text-rose-300"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* Place Order CTA */}
        <div className="pb-6">
          <button
            id="place-order-btn"
            type="button"
            onClick={handlePlaceOrder}
            disabled={isPlacing || cartItems.length === 0}
            className="
              w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl
              bg-[#24543A] hover:bg-[#326B4B] active:scale-[0.98]
              text-[#F5F0E6] text-base font-bold
              border border-[#326B4B] transition-all duration-200 cursor-pointer
              disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
              focus:outline-none focus:ring-2 focus:ring-[#82B895]
              shadow-lg shadow-[#24543A]/20
            "
          >
            {isPlacing ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-[#F5F0E6]/40 border-t-[#F5F0E6] animate-spin" />
                <span>Placing Order…</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Place Order — ₹{total.toLocaleString('en-IN')}</span>
              </>
            )}
          </button>

          <p className="text-center text-xs text-[#68736A] mt-3">
            Your order will be prepared fresh and served at Table {tableNumber}.
          </p>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-[#38443C] bg-[#222825] py-5 text-xs text-[#A8B3AA]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            <span className="font-bold text-[#F5F5F0]">ServeSync</span> •
            Checkout Module • Phase 1
          </span>
          <span>Table #{tableNumber} Active</span>
        </div>
      </footer>
    </div>
  );
}

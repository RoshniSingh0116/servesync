/**
 * CheckoutPage — ServeSync Member 2
 * Displays the order summary for the current cart, reads the table number from
 * the URL (?table=X), and places a real order via POST /api/orders.
 *
 * Integration notes (Commit 5):
 *  - Fetches the food catalog from GET /api/foods to resolve cart item names
 *    to real MongoDB ObjectIds (foodId).  The menu currently reads from mock
 *    data whose `id` values are not ObjectIds, so a name-based lookup is used
 *    as a bridge until Member 1 wires the menu to the backend Food API.
 *  - Prices are NEVER sent to the backend.  Only foodId + quantity are submitted
 *    so the server always prices from MongoDB (server-side price authority).
 *  - After a successful POST the returned order object is passed to the
 *    OrderConfirmationPage via React Router location.state so it survives the
 *    navigation without depending on the in-memory OrderContext.
 *  - The cart is cleared only after the backend confirms success (201).
 *  - isPlacing is set to true the moment the button is clicked and only reset
 *    on error — navigation away naturally unmounts the spinner.
 *
 * Flow: CartPage → CheckoutPage → OrderConfirmationPage
 */

import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  ShoppingBag,
  Utensils,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { placeOrder, getAllFoods } from '../../api/orderApi';

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

  const [isPlacing, setIsPlacing] = useState(false);
  const [error, setError] = useState('');

  /* ── Place Order ── */
  const handlePlaceOrder = useCallback(async () => {
    // Guard: prevent duplicate submissions (button is also disabled while placing)
    if (isPlacing) return;

    setError('');

    // Validate: cart must not be empty
    if (cartItems.length === 0) {
      setError('Your cart is empty. Please add items before placing an order.');
      return;
    }

    // Validate: table number must be a positive integer
    const parsedTable = Number(tableNumber);
    if (!Number.isInteger(parsedTable) || parsedTable < 1) {
      setError('Invalid table number. Please scan your table QR code again.');
      return;
    }

    setIsPlacing(true);

    try {
      /* ── Step 1: Fetch the food catalog to resolve foodIds ── */
      // The customer menu is currently served from mockData.js which uses
      // non-ObjectId ids (e.g. 'item-1').  We bridge this by looking up each
      // cart item by name in the backend food catalog to find its MongoDB _id.
      // Once Member 1 feeds the menu from the backend API this lookup becomes
      // a direct id pass-through (the _id will already be in the cart item).
      let foodsById = {};
      try {
        const { foods } = await getAllFoods();
        // Build a map keyed by name (lowercase, trimmed) → food document
        const foodsByName = {};
        foods.forEach((f) => {
          const key = (f.name || '').toLowerCase().trim();
          foodsByName[key] = f;
        });
        // Also key by _id string for items that already carry a MongoDB id
        foods.forEach((f) => {
          foodsById[String(f._id)] = f;
        });

        // Resolve each cart item to a real foodId
        const unresolvedItems = [];
        cartItems.forEach((ci) => {
          const nameKey = (ci.name || '').toLowerCase().trim();
          if (!foodsByName[nameKey] && !foodsById[ci.id]) {
            unresolvedItems.push(ci.name);
          }
        });

        if (unresolvedItems.length > 0) {
          setError(
            `The following item(s) are no longer on the menu: ${unresolvedItems.join(', ')}. ` +
              'Please remove them from your cart and try again.'
          );
          setIsPlacing(false);
          return;
        }

        /* ── Step 2: Build the order payload ── */
        // foodId: use the food's MongoDB _id resolved from the catalog.
        // quantity: taken from the cart.
        // No price — backend fetches prices from MongoDB.
        const resolvedItems = cartItems.map((ci) => {
          // Prefer name-based lookup; fall back to id-based if cart already has _id
          const nameKey = (ci.name || '').toLowerCase().trim();
          const food = foodsByName[nameKey] || foodsById[ci.id];
          return {
            foodId: String(food._id),
            quantity: ci.quantity,
          };
        });

        /* ── Step 3: POST to /api/orders ── */
        const result = await placeOrder({
          tableNumber: parsedTable,
          items: resolvedItems,
        });

        // Clear cart only after confirmed success
        clearCart();

        // Navigate to confirmation page, passing the full order in state so
        // the page works even if the user hard-refreshes (it also saves an
        // extra GET /api/orders/:id round-trip on the happy path).
        navigate(`/order-confirmation/${String(result.order._id)}?table=${tableNumber}`, {
          state: { confirmedOrder: result.order },
          replace: false,
        });
      } catch (foodErr) {
        // If the food catalog is unavailable we still try to place the order
        // using the cart item IDs directly (they may already be ObjectIds in
        // future iterations), but surface a warning if that also fails.
        throw foodErr;
      }
    } catch (err) {
      setError(err.message || 'Failed to place order. Please try again.');
      setIsPlacing(false);
    }
  }, [isPlacing, cartItems, tableNumber, clearCart, navigate]);

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
            <span>Service charges &amp; taxes</span>
            <span>Included</span>
          </div>
          <div className="border-t border-[#38443C] pt-3 flex justify-between items-center">
            <span className="font-bold text-[#F5F5F0]">Estimated Total</span>
            <span className="text-2xl font-black text-[#E5B86A]">
              ₹{total.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[10px] text-[#68736A] leading-relaxed">
            Final total is confirmed by the server after order placement.
          </p>
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
                <Loader2 className="w-5 h-5 animate-spin" />
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
            Checkout Module • Commit 5
          </span>
          <span>Table #{tableNumber} Active</span>
        </div>
      </footer>
    </div>
  );
}

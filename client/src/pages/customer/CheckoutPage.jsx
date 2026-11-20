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
import { useOrders } from '../../context/OrderContext';
import { placeOrder, getAllFoods } from '../../api/orderApi';

function getTableFromSearch(search) {
  const params = new URLSearchParams(search);
  const t = params.get('table');
  return t && t.trim() !== '' ? t.trim() : '1';
}

function VegDot({ isVeg }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-4 h-4 rounded-sm border flex-shrink-0 mt-0.5 ${
        isVeg ? 'border-emerald-600' : 'border-rose-600'
      } bg-white`}
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


  const handlePlaceOrder = useCallback(async () => {

    if (isPlacing) return;

    setError('');
    if (cartItems.length === 0) {
      setError('Your cart is empty. Please add items before placing an order.');
      return;
    }

    const parsedTable = Number(tableNumber);
    if (!Number.isInteger(parsedTable) || parsedTable < 1) {
      setError('Invalid table number. Please scan your table QR code again.');
      return;
    }

    setIsPlacing(true);

    try {
      
      let foodsById = {};
      try {
        const { foods } = await getAllFoods();
        const foodsByName = {};
        foods.forEach((f) => {
          const key = (f.name || '').toLowerCase().trim();
          foodsByName[key] = f;
        });
        foods.forEach((f) => {
          foodsById[String(f._id)] = f;
        });

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

        const resolvedItems = cartItems.map((ci) => {
          const nameKey = (ci.name || '').toLowerCase().trim();
          const food = foodsByName[nameKey] || foodsById[ci.id];
          return {
            foodId: String(food._id),
            quantity: ci.quantity,
          };
        });

        const result = await placeOrder({
          tableNumber: parsedTable,
          items: resolvedItems,
        });

        try {
          addOrder({
            tableNumber: result.order.tableNumber,
            items: (result.order.items ?? []).map((item) => ({
              id: String(item.foodId),
              name: item.name,
              price: item.price,
              quantity: item.quantity,
            })),
            totalAmount: result.order.totalAmount,
            specialInstructions: result.order.specialInstructions ?? null,
          });
        } catch {
        }

        clearCart();

        navigate(`/order-confirmation/${String(result.order._id)}?table=${tableNumber}`, {
          state: { confirmedOrder: result.order },
          replace: false,
        });
      } catch (foodErr) {
        throw foodErr;
      }
    } catch (err) {
      setError(err.message || 'Failed to place order. Please try again.');
      setIsPlacing(false);
    }
  }, [isPlacing, cartItems, tableNumber, clearCart, navigate, addOrder]);

  return (
    <div className="min-h-screen bg-[#F7F7F4] flex flex-col">
      <header className="sticky top-0 z-40 bg-white border-b border-[#E6E8E1]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(`/cart?table=${tableNumber}`)}
            aria-label="Back to cart"
            className="p-2 rounded-lg border border-[#E6E8E1] hover:border-[#526B50] text-[#74796F] hover:text-[#20251F] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#526B50]/30"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 flex-1">
            <div className="w-8 h-8 rounded-lg bg-[#526B50] flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-base font-bold text-[#20251F]">
                Dinning Room
              </span>
              <span className="text-xs text-[#74796F] block leading-none">
                Checkout
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-[#20251F] mb-1">
            Review Your Order
          </h1>
          <p className="text-sm text-[#74796F]">
            Confirm your items and place your order for the table.
          </p>
        </div>

        <div className="flex items-center gap-4 p-4 bg-white border border-[#E6E8E1] rounded-lg shadow-sm">
          <div className="w-12 h-12 rounded-lg bg-[#EFF1EA] border border-[#E6E8E1] flex flex-col items-center justify-center flex-shrink-0">
            <span className="text-[9px] uppercase font-semibold leading-none text-[#74796F]">
              Table
            </span>
            <span className="text-xl font-bold leading-tight text-[#526B50]">
              {tableNumber}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#20251F]">
              QR Order — Table {tableNumber}
            </p>
            <p className="text-xs text-[#74796F] mt-0.5">
              Your order will be served directly at this table.
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#E6E8E1] rounded-lg shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E6E8E1] flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#526B50]" />
            <h2 className="text-sm font-semibold text-[#20251F]">
              Order Items
              <span className="ml-1.5 text-[#74796F] font-normal">
                ({cartCount} {cartCount === 1 ? 'item' : 'items'})
              </span>
            </h2>
          </div>

          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center px-6">
              <Utensils className="w-10 h-10 text-[#E6E8E1] mb-3" />
              <p className="text-sm text-[#74796F]">
                No items in cart. Go back and add items to proceed.
              </p>
              <button
                type="button"
                onClick={() => navigate(`/menu?table=${tableNumber}`)}
                className="mt-4 px-5 py-2 rounded-md bg-[#526B50] hover:bg-[#40563F] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-[#E6E8E1]">
              {cartItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 px-5 py-3.5"
                >
                  <VegDot isVeg={item.isVeg} />
                  <span className="flex-1 text-sm text-[#20251F] leading-snug">
                    {item.name}
                  </span>
                  <span className="text-xs text-[#74796F] mr-2">
                    × {item.quantity}
                  </span>
                  <span className="text-sm font-semibold text-[#526B50] min-w-[60px] text-right">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white border border-[#E6E8E1] rounded-lg shadow-sm p-5 space-y-3">
          <h2 className="text-sm font-semibold text-[#20251F] mb-1">
            Price Breakdown
          </h2>
          <div className="flex justify-between text-sm">
            <span className="text-[#74796F]">Subtotal</span>
            <span className="text-[#20251F] font-medium">
              ₹{subtotal.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between text-xs text-[#74796F]">
            <span>Service charges &amp; taxes</span>
            <span>Included</span>
          </div>
          <div className="border-t border-[#E6E8E1] pt-3 flex justify-between items-center">
            <span className="font-semibold text-[#20251F]">Estimated Total</span>
            <span className="text-2xl font-bold text-[#526B50]">
              ₹{total.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[10px] text-[#74796F] leading-relaxed">
            Final total is confirmed by the server after order placement.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
            <p>{error}</p>
          </div>
        )}

        <div className="pb-6">
          <button
            id="place-order-btn"
            type="button"
            onClick={handlePlaceOrder}
            disabled={isPlacing || cartItems.length === 0}
            className="
              w-full flex items-center justify-center gap-3 py-4 px-6 rounded-lg
              bg-[#526B50] hover:bg-[#40563F] active:scale-[0.98]
              text-white text-base font-semibold
              transition-all duration-200 cursor-pointer
              disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
              focus:outline-none focus:ring-2 focus:ring-[#526B50]/40
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

          <p className="text-center text-xs text-[#74796F] mt-3">
            Your order will be prepared fresh and served at Table {tableNumber}.
          </p>
        </div>
      </main>

      <footer className="border-t border-[#E6E8E1] bg-white py-4 text-xs text-[#74796F]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex items-center justify-center">
          <span>Dinning Room · Table #{tableNumber}</span>
        </div>
      </footer>
    </div>
  );
}

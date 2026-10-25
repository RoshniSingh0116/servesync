import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { OrderProvider } from './context/OrderContext';

// Customer Pages (Member 1 & Member 2)
import MenuPage from './pages/customer/MenuPage';
import CartPage from './pages/customer/CartPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import OrderConfirmationPage from './pages/customer/OrderConfirmationPage';

// Kitchen KDS Page (Member 4)
import KitchenDashboardPage from './pages/admin/KitchenDashboardPage';

// Admin Pages (Member 3)
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';

function App() {
  return (
    <OrderProvider>
      <CartProvider>
        <Router>
          <Routes>
            {/* Customer Routes (Member 1 & Member 2) */}
            <Route path="/" element={<MenuPage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />

            {/* Kitchen Display Station Route (Member 4) */}
            <Route path="/kitchen" element={<KitchenDashboardPage />} />

            {/* Admin Management Routes (Member 3) */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />

            {/* Wildcard Fallback */}
            <Route path="*" element={<MenuPage />} />
          </Routes>
        </Router>
      </CartProvider>
    </OrderProvider>
  );
}

export default App;

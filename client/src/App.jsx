import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { OrderProvider } from './context/OrderContext';

import MenuPage from './pages/customer/MenuPage';
import CartPage from './pages/customer/CartPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import OrderConfirmationPage from './pages/customer/OrderConfirmationPage';

import KitchenDashboardPage from './pages/admin/KitchenDashboardPage';

import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AddFoodPage from './pages/admin/AddFoodPage';
import ProtectedRoute from './components/admin/ProtectedRoute';

function App() {
  return (
    <OrderProvider>
      <CartProvider>
        <Router>
          <Routes>
            <Route path="/" element={<MenuPage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />

            <Route path="/kitchen" element={<KitchenDashboardPage />} />

            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/add-food"
              element={
                <ProtectedRoute>
                  <AddFoodPage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<MenuPage />} />
          </Routes>
        </Router>
      </CartProvider>
    </OrderProvider>
  );
}

export default App;

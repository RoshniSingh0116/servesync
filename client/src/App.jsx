import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MenuPage from './pages/customer/MenuPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Customer Menu — Member 1 */}
        <Route path="/" element={<MenuPage />} />
        <Route path="/menu" element={<MenuPage />} />

        {/* Future routes reserved for team members:
            Member 2: /cart, /checkout, /order-status
            Member 3: /admin/login, /admin/dashboard, /admin/add-food
            Member 4: /kitchen
        */}
        <Route path="*" element={<MenuPage />} />
      </Routes>
    </Router>
  );
}

export default App;

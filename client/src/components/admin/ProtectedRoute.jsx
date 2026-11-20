
import { Navigate, useLocation } from 'react-router-dom';
import { isAdminAuthenticated } from '../../services/adminApi';

export default function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}

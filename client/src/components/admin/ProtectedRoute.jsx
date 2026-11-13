/**
 * ProtectedRoute.jsx — ServeSync Admin (Member 3, Commit 5)
 *
 * Route guard component protecting admin-only pages from unauthenticated access.
 * Checks for the presence of the admin authentication token.
 * If unauthenticated or token is expired/missing, redirects to /admin/login.
 */

import { Navigate, useLocation } from 'react-router-dom';
import { isAdminAuthenticated } from '../../services/adminApi';

export default function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}

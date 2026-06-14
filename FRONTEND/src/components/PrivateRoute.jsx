import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated, getUserRole } from '../services/auth';

export default function PrivateRoute({ allowedRoles }) {
  const authenticated = isAuthenticated();
  const role = getUserRole();

  if (!authenticated) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/" replace />;

  return <Outlet />;
}
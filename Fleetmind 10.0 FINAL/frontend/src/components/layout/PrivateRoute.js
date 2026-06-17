import { Navigate, Outlet } from 'react-router-dom';
import { getCurrentUser } from '../../services/auth';

export default function PrivateRoute({ allowedRoles }) {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
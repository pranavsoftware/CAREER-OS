import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_DASHBOARDS = {
  student: '/student/dashboard',
  university: '/university/dashboard',
  company: '/company/dashboard',
};

/**
 * ProtectedRoute: redirects unauthenticated users to /login,
 * and wrong-role users to their own dashboard.
 */
export default function ProtectedRoute({ children, allowedRole }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={ROLE_DASHBOARDS[user.role] || '/login'} replace />;
  }

  return children;
}

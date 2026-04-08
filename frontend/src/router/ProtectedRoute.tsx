import { Navigate, useLocation, useParams } from 'react-router-dom';
import { resolveDashboardPath, useAuth } from '../hooks/useAuth';
import type { UserRole } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { role } = useParams();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={resolveDashboardPath(user.role)} replace />;
  }

  if (location.pathname.startsWith('/dashboard/')) {
    const requestedRole = role;
    if (requestedRole && requestedRole !== user.role) {
      return <Navigate to={resolveDashboardPath(user.role)} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;

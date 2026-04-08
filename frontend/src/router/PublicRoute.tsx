import { Navigate } from 'react-router-dom';
import { resolveDashboardPath, useAuth } from '../hooks/useAuth';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={resolveDashboardPath(user.role)} replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;

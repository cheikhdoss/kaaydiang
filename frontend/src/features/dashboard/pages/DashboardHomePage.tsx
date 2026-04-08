import { Navigate } from 'react-router-dom'
import { resolveDashboardPath, useAuth } from '@/hooks/useAuth'
import { LoadingState } from '../components/LoadingState'

const DashboardHomePage: React.FC = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingState fullscreen />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={resolveDashboardPath(user.role)} replace />
}

export default DashboardHomePage

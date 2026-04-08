import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { resolveDashboardPath, useAuth } from '@/hooks/useAuth'
import { DashboardShell } from '../components/DashboardShell'
import { StudentDashboard } from '../components/StudentDashboard'
import { InstructorDashboard } from '../components/InstructorDashboard'
import { AdminDashboard } from '../components/AdminDashboard'
import { ErrorState } from '../components/ErrorState'
import { LoadingState } from '../components/LoadingState'
import { useDashboardData } from '../hooks/useDashboardData'
import type { DashboardRole } from '../services/dashboard.api'

interface DashboardPageProps {
  forcedRole?: DashboardRole
}

const titleByRole: Record<DashboardRole, string> = {
  student: 'Espace Etudiant',
  instructor: 'Espace Instructeur',
  admin: 'Console Administration',
}

const DashboardPage: React.FC<DashboardPageProps> = ({ forcedRole }) => {
  const { user, logout } = useAuth()
  const { role } = useParams()
  const navigate = useNavigate()

  const activeRole: DashboardRole =
    forcedRole ??
    (role === 'student' || role === 'instructor' || role === 'admin'
      ? role
      : user?.role === 'student' || user?.role === 'instructor' || user?.role === 'admin'
        ? user.role
        : 'student')

  const { data, isLoading, isError, error, refetch } = useDashboardData(activeRole)

  useEffect(() => {
    if (!forcedRole && !role && user?.role) {
      navigate(resolveDashboardPath(user.role), { replace: true })
    }
  }, [forcedRole, navigate, role, user?.role])

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const handleNavigateRole = (targetRole: DashboardRole) => {
    navigate(resolveDashboardPath(targetRole))
  }

  const errorMessage =
    error instanceof Error ? error.message : "Impossible de charger les donnees du dashboard."

  if (!user) {
    return <LoadingState fullscreen />
  }

  return (
    <DashboardShell
      title={`Bienvenue, ${user.first_name}`}
      subtitle={titleByRole[activeRole]}
      role={activeRole}
      viewerRole={user.role}
      userName={`${user.first_name} ${user.last_name}`}
      userEmail={user.email}
      onLogout={handleLogout}
      onNavigateRole={handleNavigateRole}
    >
      {isLoading ? <LoadingState /> : null}

      {!isLoading && isError ? <ErrorState message={errorMessage} onRetry={() => void refetch()} /> : null}

      {!isLoading && data?.role === 'student' ? <StudentDashboard data={data} /> : null}
      {!isLoading && data?.role === 'instructor' ? <InstructorDashboard data={data} /> : null}
      {!isLoading && data?.role === 'admin' ? <AdminDashboard data={data} /> : null}
    </DashboardShell>
  )
}

export default DashboardPage

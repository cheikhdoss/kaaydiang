import { Users, Mail, Calendar, UserCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { resolveRoleDashboardPath } from '../utils/navigation'
import { DashboardShell } from '../components/DashboardShell'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { useInstructorStudents } from '../hooks/useInstructorSupplements'
import type { DashboardRole } from '../services/dashboard.api'

const InstructorStudentsPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { data: students = [], isLoading, isError, error, refetch } = useInstructorStudents()

  if (!user) return <LoadingState fullscreen />

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const handleNavigateRole = (role: DashboardRole) => {
    navigate(resolveRoleDashboardPath(role))
  }

  if (isLoading) return <LoadingState fullscreen />
  if (isError) return <ErrorState message={error instanceof Error ? error.message : 'Erreur'} onRetry={() => void refetch()} />
  const avgProgress = students.length > 0
    ? Math.round(students.reduce((acc, student) => acc + student.average_progress, 0) / students.length)
    : 0

  const activeThisWeek = students.filter((student) => {
    if (!student.last_active) {
      return false
    }

    return new Date(student.last_active) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  }).length

  return (
    <DashboardShell
      title="Mes Étudiants"
      subtitle={`${students.length} etudiants inscrits`}
      role="instructor"
      viewerRole={user.role}
      userName={`${user.first_name} ${user.last_name}`}
      userEmail={user.email}
      onLogout={handleLogout}
      onNavigateRole={handleNavigateRole}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-400/10 flex items-center justify-center">
              <Users size={22} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{students.length}</div>
              <div className="text-xs text-slate-500 dark:text-white/40">Total étudiants</div>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-400/10 flex items-center justify-center">
              <UserCheck size={22} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{avgProgress}%</div>
              <div className="text-xs text-slate-500 dark:text-white/40">Moyenne progression</div>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-400/10 flex items-center justify-center">
              <Calendar size={22} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{activeThisWeek}</div>
              <div className="text-xs text-slate-500 dark:text-white/40">Actifs cette semaine</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {students.map((student, i) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {(student.first_name?.[0] ?? '').toUpperCase()}{(student.last_name?.[0] ?? '').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">{student.first_name} {student.last_name}</div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-white/40 mt-0.5">
                    <span className="flex items-center gap-1"><Mail size={11} /> {student.email}</span>
                    <span>{student.enrolled_courses} cours</span>
                  </div>
                </div>
                <div className="hidden sm:block text-right">
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{student.average_progress}%</div>
                  <div className="w-24 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${student.average_progress}%` }} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}

export default InstructorStudentsPage

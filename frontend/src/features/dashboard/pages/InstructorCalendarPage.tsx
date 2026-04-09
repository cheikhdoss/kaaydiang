import { Calendar, Clock, Users, Plus, AlertCircle, BarChart3 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { dashboardPaths, resolveRoleDashboardPath } from '../utils/navigation'
import { DashboardShell } from '../components/DashboardShell'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { useInstructorCalendar } from '../hooks/useInstructorSupplements'
import { Button } from '@/components/ui/button'
import type { DashboardRole } from '../services/dashboard.api'

const InstructorCalendarPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { data: events = [], isLoading, isError, error, refetch } = useInstructorCalendar()

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
  const typeConfig: Record<string, any> = {
    live: { icon: Users, color: 'bg-blue-600', bg: 'bg-blue-50 dark:bg-blue-400/10', label: 'Session Live' },
    deadline: { icon: AlertCircle, color: 'bg-red-600', bg: 'bg-red-50 dark:bg-red-400/10', label: 'Date limite' },
    exam: { icon: BarChart3, color: 'bg-purple-600', bg: 'bg-purple-50 dark:bg-purple-400/10', label: 'Examen' },
    reminder: { icon: Clock, color: 'bg-amber-600', bg: 'bg-amber-50 dark:bg-amber-400/10', label: 'Rappel' },
  }

  return (
    <DashboardShell
      title="Calendrier"
      subtitle="Planifiez vos sessions et deadlines"
      role="instructor"
      viewerRole={user.role}
      userName={`${user.first_name} ${user.last_name}`}
      userEmail={user.email}
      onLogout={handleLogout}
      onNavigateRole={handleNavigateRole}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Calendar size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{events.length} événements</h3>
              <p className="text-xs text-slate-500 dark:text-white/40">Ce mois-ci</p>
            </div>
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold h-12 px-6 shadow-none"
            onClick={() => navigate(dashboardPaths.instructorAssignments)}
          >
            <Plus size={18} className="mr-2" />
            Voir les devoirs
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, i) => {
            const config = typeConfig[event.type]
            const Icon = config.icon
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:border-blue-500/30 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center`}>
                    <Icon size={18} className="text-white" />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${config.bg} text-slate-700 dark:text-white/70`}>
                    {config.label}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-3">{event.title}</h4>
                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-white/40">
                  <span className="flex items-center gap-1"><Calendar size={12} /> {event.date}</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {event.time}</span>
                </div>
                {event.student_count > 0 && (
                  <div className="flex items-center gap-1 mt-3 text-xs text-slate-500 dark:text-white/40">
                    <Users size={12} /> {event.student_count} etudiants concernes
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </DashboardShell>
  )
}

export default InstructorCalendarPage

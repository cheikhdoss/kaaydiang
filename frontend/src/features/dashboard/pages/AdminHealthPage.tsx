import { motion } from 'framer-motion'
import {
  BookOpen,
  CheckCircle2,
  FileText,
  GraduationCap,
  Layers,
  PlayCircle,
  TrendingUp,
  Trophy,
  Users,
  UserCheck,
  UserPlus,
  BarChart3,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { DashboardShell } from '../components/DashboardShell'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { useAdminPlatformHealth } from '../hooks/useAdminHealth'
import type { DashboardRole } from '../services/dashboard.api'

const AdminHealthPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const { data: stats, isLoading, isError, error, refetch } = useAdminPlatformHealth()

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
  if (!stats) return <ErrorState message="Données non disponibles" onRetry={() => void refetch()} />

  const resolveRoleDashboardPath = (role: DashboardRole) => {
    switch (role) {
      case 'admin': return '/dashboard/admin'
      case 'instructor': return '/dashboard/instructor'
      case 'student': return '/dashboard/student'
    }
  }

  const pubRate = stats.total_courses > 0
    ? Math.round((stats.published_courses / stats.total_courses) * 100)
    : 0

  const completionRate = stats.total_lessons > 0
    ? Math.round((stats.total_certificates / Math.max(stats.total_enrollments, 1)) * 100)
    : 0

  return (
    <DashboardShell
      title="Santé de la Plateforme"
      subtitle="Suivez les indicateurs globaux et la stabilité"
      role="admin"
      viewerRole={user.role}
      userName={`${user.first_name} ${user.last_name}`}
      userEmail={user.email}
      onLogout={handleLogout}
      onNavigateRole={handleNavigateRole}
    >
      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Utilisateurs', value: stats.total_users, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-400/10' },
            { label: 'Cours', value: stats.total_courses, icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-400/10' },
            { label: 'Inscriptions', value: stats.total_enrollments, icon: GraduationCap, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-400/10' },
            { label: 'Certificats', value: stats.total_certificates, icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-400/10' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/5 dark:bg-white/5"
            >
              <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon size={20} />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</p>
              <p className="text-xs text-slate-500 dark:text-white/40">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Content Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Chapitres', value: stats.total_chapters, icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-400/10' },
            { label: 'Leçons', value: stats.total_lessons, icon: FileText, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-400/10' },
            { label: 'Quiz', value: stats.total_quizzes, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-400/10' },
            { label: 'Tentatives', value: stats.total_quiz_attempts, icon: PlayCircle, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-400/10' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (i + 4) * 0.05 }}
              className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/5 dark:bg-white/5"
            >
              <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon size={20} />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</p>
              <p className="text-xs text-slate-500 dark:text-white/40">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Activity (7 derniers jours) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/5 dark:bg-white/5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Activité (7 derniers jours)</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl bg-blue-50 dark:bg-blue-400/10 p-4">
              <div className="flex items-center gap-2 mb-1">
                <UserPlus size={14} className="text-blue-600" />
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Nouveaux utilisateurs</span>
              </div>
              <p className="text-xl font-black text-slate-900 dark:text-white">{stats.activity.new_users_7d}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-400/10 p-4">
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap size={14} className="text-emerald-600" />
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Inscriptions</span>
              </div>
              <p className="text-xl font-black text-slate-900 dark:text-white">{stats.activity.new_enrollments_7d}</p>
            </div>
            <div className="rounded-xl bg-purple-50 dark:bg-purple-400/10 p-4">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen size={14} className="text-purple-600" />
                <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Cours créés</span>
              </div>
              <p className="text-xl font-black text-slate-900 dark:text-white">{stats.activity.new_courses_7d}</p>
            </div>
            <div className="rounded-xl bg-amber-50 dark:bg-amber-400/10 p-4">
              <div className="flex items-center gap-2 mb-1">
                <UserCheck size={14} className="text-amber-600" />
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Leçons terminées</span>
              </div>
              <p className="text-xl font-black text-slate-900 dark:text-white">{stats.activity.lessons_completed_7d}</p>
            </div>
          </div>
        </div>

        {/* Distribution */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Role distribution */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/5 dark:bg-white/5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={16} className="text-slate-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Distribution par rôle</h3>
            </div>
            <div className="space-y-3">
              {Object.entries(stats.role_distribution).map(([role, count]) => {
                const pct = stats.total_users > 0 ? Math.round((count / stats.total_users) * 100) : 0
                const colors: Record<string, string> = {
                  student: 'bg-blue-600',
                  instructor: 'bg-emerald-600',
                  admin: 'bg-amber-600',
                }
                const labels: Record<string, string> = {
                  student: 'Étudiants',
                  instructor: 'Instructeurs',
                  admin: 'Administrateurs',
                }
                return (
                  <div key={role}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-slate-700 dark:text-white/80">{labels[role] || role}</span>
                      <span className="text-slate-500 dark:text-white/40">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        className={`h-full ${colors[role] || 'bg-slate-400'}`}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Publication status */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/5 dark:bg-white/5">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={16} className="text-slate-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Statut des cours</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">Publiés</span>
                  <span className="text-slate-500 dark:text-white/40">{stats.published_courses} ({pubRate}%)</span>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pubRate}%` }}
                    className="h-full bg-emerald-500"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-amber-600 dark:text-amber-400">Brouillons</span>
                  <span className="text-slate-500 dark:text-white/40">{stats.draft_courses} ({100 - pubRate}%)</span>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${100 - pubRate}%` }}
                    className="h-full bg-amber-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-white/60">Taux de certification</span>
                <span className="font-bold text-slate-900 dark:text-white">{completionRate}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top courses */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/5 dark:bg-white/5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={16} className="text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Top cours par inscriptions</h3>
          </div>
          <div className="space-y-3">
            {stats.top_courses.map((course, i) => (
              <div key={course.id} className="flex items-center gap-4">
                <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-white/60">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{course.title}</p>
                  <p className="text-xs text-slate-500 dark:text-white/40 capitalize">{course.level}</p>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{course.enrollment_count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}

export default AdminHealthPage

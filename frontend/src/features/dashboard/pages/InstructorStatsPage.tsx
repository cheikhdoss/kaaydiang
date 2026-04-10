import { TrendingUp, Users, BookOpen, Award, Eye, Clock, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { resolveRoleDashboardPath } from '../utils/navigation'
import { DashboardShell } from '../components/DashboardShell'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { useInstructorStats } from '../hooks/useInstructorSupplements'
import type { DashboardRole } from '../services/dashboard.api'

const InstructorStatsPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { data, isLoading, isError, error, refetch } = useInstructorStats()

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
  if (!data) return <ErrorState message="Donnees invalides" onRetry={() => void refetch()} />

  const weeklyData = data.weekly_activity ?? []
  const maxViews = Math.max(1, ...weeklyData.map(d => d.views))
  const topCourses = data.top_courses ?? []

  return (
    <DashboardShell
      title="Statistiques"
      subtitle="Analysez la performance de vos cours"
      role="instructor"
      viewerRole={user.role}
      userName={`${user.first_name} ${user.last_name}`}
      userEmail={user.email}
      onLogout={handleLogout}
      onNavigateRole={handleNavigateRole}
    >
      <div className="space-y-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users, label: 'Etudiants total', value: data.total_students, change: '-', color: 'bg-blue-600' },
              { icon: BookOpen, label: 'Cours total', value: data.total_courses, change: '-', color: 'bg-emerald-600' },
              { icon: Eye, label: 'Vues cette semaine', value: data.weekly_views, change: '-', color: 'bg-purple-600' },
              { icon: Award, label: 'Certificats delivres', value: data.certificates_issued, change: '-', color: 'bg-amber-600' },
            ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="relative p-6 rounded-[2rem] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 overflow-hidden"
            >
              <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center mb-4`}>
                <stat.icon size={22} className="text-white" />
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</div>
              <div className="text-xs text-slate-500 dark:text-white/40 mt-1 font-semibold uppercase tracking-wider">{stat.label}</div>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp size={12} className="text-emerald-500" />
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{stat.change}</span>
                <span className="text-xs text-slate-400 dark:text-white/30">vs semaine dernière</span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Weekly Chart */}
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Activité hebdomadaire</h3>
            <div className="space-y-3">
              {weeklyData.map((day, i) => (
                <div key={day.day} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-500 dark:text-white/40 w-8">{day.day}</span>
                  <div className="flex-1 h-6 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(day.views / maxViews) * 100}%` }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                      className="h-full bg-blue-600 rounded-full flex items-center justify-end pr-2"
                    >
                      <span className="text-[10px] font-bold text-white">{day.views}</span>
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Courses */}
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Meilleurs cours</h3>
            <div className="space-y-4">
              {topCourses.map((course, i) => (
                <motion.div
                  key={course.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 rounded-xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{course.title}</h4>
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-amber-500 fill-amber-500" />
                     <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{course.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-white/40 mb-2">
                    <span className="flex items-center gap-1"><Users size={11} /> {course.student_count} etudiants</span>
                    <span>Progression: {course.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${course.progress}%` }}
                      transition={{ delay: i * 0.1 + 0.3 }}
                      className="h-full bg-blue-600 rounded-full"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Engagement */}
        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Engagement global</h3>
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" className="text-slate-200 dark:text-white/10" strokeWidth="3" />
                <motion.path
                  initial={{ strokeDashoffset: 100 }}
                   animate={{ strokeDashoffset: 100 - data.engagement_rate }}
                  transition={{ duration: 1.5, delay: 0.3 }}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeDasharray="100"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-black text-slate-900 dark:text-white">{data.engagement_rate}%</div>
                  <div className="text-[10px] text-slate-500 dark:text-white/40 uppercase">Engagement</div>
                </div>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              {[
                { label: 'Temps moyen/session', value: '24 min', icon: Clock },
                { label: 'Taux de complétion', value: '68%', icon: TrendingUp },
                { label: 'Satisfaction', value: '4.7/5', icon: Star },
                { label: 'Retour étudiants', value: '89%', icon: Users },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-2 mb-1">
                    <item.icon size={14} className="text-blue-600 dark:text-blue-400" />
                    <span className="text-xs text-slate-500 dark:text-white/40">{item.label}</span>
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}

export default InstructorStatsPage

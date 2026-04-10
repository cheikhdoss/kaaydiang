import { Star, TrendingUp, BookOpen, BarChart3, HelpCircle, ClipboardList } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { resolveRoleDashboardPath } from '../utils/navigation'
import { DashboardShell } from '../components/DashboardShell'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { useDashboardData } from '../hooks/useDashboardData'
import { useStudentGrades } from '../hooks/useStudentSupplements'
import type { DashboardRole } from '../services/dashboard.api'

interface GradeCard {
  id: string
  title: string
  type: string
  score: number
  maxScore: number
  date: string
  course: string
  icon: any
}

const CHART_TICKS = [0, 25, 50, 75, 100]

const StudentGradesPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { data, isLoading, isError, error, refetch } = useDashboardData('student')
  const { data: gradesPayload, isLoading: gradesLoading, isError: gradesError, error: gradesQueryError, refetch: refetchGrades } = useStudentGrades()

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
  if (!data || data.role !== 'student') return <ErrorState message="Données invalides" onRetry={() => void refetch()} />
  if (gradesLoading) return <LoadingState fullscreen />
  if (gradesError) {
    return <ErrorState message={gradesQueryError instanceof Error ? gradesQueryError.message : 'Erreur'} onRetry={() => void refetchGrades()} />
  }

  const stats = data.stats

  const gradeItems: GradeCard[] = (gradesPayload?.grades ?? []).map((grade) => ({
    id: grade.id,
    title: grade.title,
    type: grade.type === 'quiz' ? 'Quiz' : 'Devoir',
    score: grade.score,
    maxScore: grade.max_score,
    date: grade.date ? new Date(grade.date).toLocaleDateString('fr-FR') : '-',
    course: grade.course,
    icon: grade.type === 'quiz' ? HelpCircle : ClipboardList,
  }))

  const summary = gradesPayload?.summary
  const average = summary?.average ?? 0
  const bestScore = summary?.best_score ?? 0

  const getGradeColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 dark:text-emerald-400'
    if (score >= 75) return 'text-blue-600 dark:text-blue-400'
    if (score >= 60) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <DashboardShell
      title="Mes Notes"
      subtitle="Consultez vos résultats et moyennes"
      role="student"
      viewerRole={user.role}
      userName={`${user.first_name} ${user.last_name}`}
      userEmail={user.email}
      onLogout={handleLogout}
      onNavigateRole={handleNavigateRole}
    >
      <div className="space-y-10">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Moyenne Générale', value: `${average}%`, icon: BarChart3, color: 'from-blue-500 to-indigo-600' },
              { label: 'Quiz Complétés', value: `${summary?.total_quizzes ?? stats.totalQuizzes ?? 0}`, icon: HelpCircle, color: 'from-purple-500 to-pink-500' },
              { label: 'Devoirs Rendus', value: `${summary?.total_assignments ?? stats.totalAssignments ?? 0}`, icon: BookOpen, color: 'from-emerald-500 to-teal-500' },
              { label: 'Meilleure Note', value: `${bestScore}%`, icon: Star, color: 'from-amber-500 to-orange-500' },
            ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon size={20} className="text-white" />
                </div>
                <TrendingUp size={16} className="text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
              <div className="text-xs text-slate-500 dark:text-white/50 mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Grades List */}
        <div className="rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Dernières Notes</h3>
          <div className="space-y-4">
            {gradeItems.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-white/50">
                Aucune note disponible pour le moment.
              </div>
            ) : gradeItems.map((grade, i) => (
              <motion.div
                key={grade.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center">
                    <grade.icon size={18} className="text-slate-500 dark:text-white/50" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">{grade.title}</div>
                    <div className="text-xs text-slate-500 dark:text-white/40">{grade.course} • {grade.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/60">{grade.type}</span>
                  <span className={`text-lg font-bold ${getGradeColor(grade.score)}`}>{grade.score}%</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Evolution */}
        <div className="rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Évolution des Notes</h3>
          {gradeItems.length === 0 ? (
            <div className="h-48 rounded-xl bg-gradient-to-r from-slate-100 to-slate-50 dark:from-white/5 dark:to-white/5 flex items-center justify-center">
              <div className="text-sm text-slate-400 dark:text-white/30">Aucune donnee pour l'evolution.</div>
            </div>
          ) : (
            <div className="h-56 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f1118] p-4">
              <div className="flex h-full gap-3">
                <div className="w-10 shrink-0">
                  <div className="relative h-full">
                    {CHART_TICKS.map((tick) => (
                      <div
                        key={`y-${tick}`}
                        className="absolute left-0 right-0"
                        style={{ bottom: `${tick}%` }}
                      >
                        <span className="-translate-y-1/2 text-[10px] text-slate-500 dark:text-white/40">{tick}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative flex-1 rounded-lg border border-slate-100 bg-slate-50/70 p-2 dark:border-white/5 dark:bg-white/5">
                  {CHART_TICKS.map((tick) => (
                    <div
                      key={`grid-${tick}`}
                      className="absolute left-0 right-0 border-t border-dashed border-slate-200 dark:border-white/10"
                      style={{ bottom: `${tick}%` }}
                    />
                  ))}

                  <div className="relative flex h-full items-end gap-2">
                    {gradeItems
                      .slice(0, 8)
                      .reverse()
                      .map((grade, index) => {
                        const barHeight = Math.max(8, Math.min(100, grade.score))

                        return (
                          <div key={`evo-${grade.id}`} className="flex-1 min-w-0 flex flex-col items-center gap-1">
                            <div
                              className="w-full max-w-10 rounded-t-md bg-gradient-to-t from-blue-600 to-indigo-400"
                              style={{ height: `${barHeight}%` }}
                              title={`${grade.title} - ${grade.score}%`}
                            />
                            <span className="text-[10px] font-semibold text-slate-600 dark:text-white/70">{grade.score}%</span>
                            <span className="max-w-full truncate text-[10px] text-slate-500 dark:text-white/40">
                              N{index + 1}
                            </span>
                          </div>
                        )
                      })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}

export default StudentGradesPage

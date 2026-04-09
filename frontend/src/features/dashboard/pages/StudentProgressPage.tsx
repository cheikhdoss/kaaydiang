import { Activity, TrendingUp, Clock, Target, Calendar, CheckCircle2, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { resolveRoleDashboardPath } from '../utils/navigation'
import { DashboardShell } from '../components/DashboardShell'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { useDashboardData } from '../hooks/useDashboardData'
import type { DashboardRole } from '../services/dashboard.api'

const StudentProgressPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { data, isLoading, isError, error, refetch } = useDashboardData('student')

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

  const stats = [
    { label: 'Leçons Complétées', value: data.progress.completed_lessons, total: data.progress.total_lessons, icon: CheckCircle2, color: 'text-emerald-500 dark:text-emerald-400' },
    { label: 'Heures Apprises', value: `${data.stats.learning_hours}h`, icon: Clock, color: 'text-blue-500 dark:text-blue-400' },
    { label: 'Objectif Hebdo', value: `${data.progress.weekly_goal}%`, icon: Target, color: 'text-purple-500 dark:text-purple-400' },
    { label: 'Série Actuelle', value: `${data.progress.streak_days}j`, icon: Activity, color: 'text-orange-500 dark:text-orange-400' },
  ]

  return (
    <DashboardShell
      title='Ma Progression'
      subtitle='Analysez vos performances et votre assiduité'
      role='student'
      viewerRole={user.role}
      userName={`${user.first_name} ${user.last_name}`}
      userEmail={user.email}
      onLogout={handleLogout}
      onNavigateRole={handleNavigateRole}
    >
      <div className="space-y-10">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-6 rounded-[2rem] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl bg-white dark:bg-white/5 ${stat.color}`}>
                  <stat.icon size={20} />
                </div>
                <div className="text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest">Temps réel</div>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</div>
              <div className="text-xs text-slate-400 dark:text-white/40 font-bold mt-1 uppercase tracking-widest">{stat.label}</div>
              {stat.total && (
                <div className="mt-4 space-y-2">
                  <div className="h-1 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(Number(stat.value) / stat.total) * 100}%` }}
                      className="h-full bg-[#3054ff]"
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-white/20 text-right">Sur {stat.total} leçons</div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Detailed Charts Simulation (Premium Look) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-8 p-8 rounded-[2.5rem] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <TrendingUp className="text-[#3054ff]" />
                Activité d'apprentissage
              </h3>
              <div className="flex gap-2">
                <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase">Semaine</div>
                <div className="px-3 py-1 rounded-full bg-[#3054ff]/20 text-[10px] font-bold text-[#3054ff] uppercase">Mois</div>
              </div>
            </div>

            {/* Fake Chart Visualization */}
            <div className="h-64 flex items-end justify-between gap-4">
              {[40, 70, 45, 90, 65, 80, 50, 85, 60, 95, 75, 100].map((h, i) => (
                <div key={i} className="flex-1 group relative">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: i * 0.05, duration: 1 }}
                    className="w-full bg-gradient-to-t from-[#3054ff]/20 to-[#3054ff] rounded-t-lg group-hover:to-[#9791fe] transition-all"
                  />
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                    {h}%
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-between text-[10px] font-bold text-slate-400 dark:text-white/20 uppercase tracking-widest px-2">
              <span>Jan</span><span>Fév</span><span>Mar</span><span>Avr</span><span>Mai</span><span>Juin</span>
              <span>Juil</span><span>Août</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Déc</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 space-y-8"
          >
            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-[#3054ff] to-[#1943f2] shadow-[0_20px_50px_rgba(48,84,255,0.3)]">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-2xl bg-white/20">
                  <Calendar className="text-white" size={20} />
                </div>
                <h3 className="text-lg font-bold text-white">Objectif Global</h3>
              </div>
              <div className="text-4xl font-black text-white mb-2">{data.progress.weekly_goal}%</div>
              <p className="text-sm text-white/70 leading-relaxed mb-6">Excellent travail ! Vous avez surpassé votre objectif de la semaine dernière de 12%.</p>
              <Button className="w-full bg-white text-[#3054ff] hover:bg-white/90 font-bold rounded-xl h-12">
                Ajuster mon but
              </Button>
            </div>

            <div className="p-8 rounded-[2.5rem] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Badges récents</h3>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="aspect-square rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center justify-center group cursor-pointer hover:border-[#3054ff]/50 transition-colors">
                    <Sparkles size={24} className="text-slate-300 dark:text-white/10 group-hover:text-[#3054ff] transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardShell>
  )
}

export default StudentProgressPage

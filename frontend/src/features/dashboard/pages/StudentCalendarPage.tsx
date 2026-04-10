import { Calendar, Clock, AlertCircle, CheckCircle2, Video, Star, ArrowUpRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { resolveRoleDashboardPath } from '../utils/navigation'
import { DashboardShell } from '../components/DashboardShell'
import { LoadingState } from '../components/LoadingState'
import { Button } from '@/components/ui/button'
import { useStudentCalendar } from '../hooks/useStudentSupplements'
import type { DashboardRole } from '../services/dashboard.api'

const typeConfig: Record<string, any> = {
  deadline: { icon: AlertCircle, color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-500/10', label: 'Échéance' },
  live: { icon: Video, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-500/10', label: 'Live' },
  exam: { icon: Star, color: 'text-red-500 dark:text-red-400', bg: 'bg-red-500/10', label: 'Examen' },
  reminder: { icon: Clock, color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-500/10', label: 'Rappel' },
}

const StudentCalendarPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { data: events = [], isLoading } = useStudentCalendar()

  if (!user) return <LoadingState fullscreen />

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const handleNavigateRole = (role: DashboardRole) => {
    navigate(resolveRoleDashboardPath(role))
  }

  if (isLoading) return <LoadingState fullscreen />

  const upcomingEvents = events.filter((e: any) => new Date(e.date) >= new Date()).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const pastEvents = events.filter((e: any) => new Date(e.date) < new Date())

  return (
    <DashboardShell
      title='Calendrier'
      subtitle='Suivez vos échéances, lives et examens'
      role='student'
      viewerRole={user.role}
      userName={`${user.first_name} ${user.last_name}`}
      userEmail={user.email}
      onLogout={handleLogout}
      onNavigateRole={handleNavigateRole}
    >
      <div className="space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Échéances', count: events.filter(e => e.type === 'deadline').length, icon: AlertCircle, color: 'text-orange-500' },
            { label: 'Lives', count: events.filter(e => e.type === 'live').length, icon: Video, color: 'text-blue-500' },
            { label: 'Examens', count: events.filter(e => e.type === 'exam').length, icon: Star, color: 'text-red-500' },
            { label: 'Rappels', count: events.filter(e => e.type === 'reminder').length, icon: Clock, color: 'text-emerald-500' },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-xl bg-white dark:bg-white/5 ${item.color}`}>
                  <item.icon size={18} />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{item.count}</div>
              <div className="text-xs text-slate-400 dark:text-white/40 uppercase tracking-widest font-bold mt-1">{item.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Events */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Calendar className="text-[#3054ff]" />
              Événements à venir
            </h3>

            {isLoading ? <LoadingState /> : upcomingEvents.length === 0 ? (
              <div className="p-10 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-center">
                <CheckCircle2 className="mx-auto mb-4 text-emerald-500/20" size={40} />
                <p className="text-slate-400 dark:text-white/40">Aucun événement à venir. Profitez-en !</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingEvents.map((event, idx) => {
                  const config = typeConfig[event.type as keyof typeof typeConfig]
                  const Icon = config.icon
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:border-[#3054ff]/30 transition-all group"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={config.color} size={22} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-[#3054ff] transition-colors">{event.title}</h4>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${config.bg} ${config.color}`}>
                              {config.label}
                            </span>
                          </div>
                          <p className="text-sm text-slate-400 dark:text-white/40 mb-2">{event.description}</p>
                          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 dark:text-white/20 uppercase tracking-widest">
                            <span className="flex items-center gap-1"><Calendar size={12} />{new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            <span className="flex items-center gap-1"><Clock size={12} />{event.time}</span>
                            <span className="text-[#3054ff]">{event.course_title ?? 'General'}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="p-8 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Événements passés</h3>
              <div className="space-y-3">
                {pastEvents.slice(0, 3).map(event => (
                  <div key={event.id} className="p-3 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 opacity-60">
                    <div className="text-xs font-bold text-slate-600 dark:text-white/60">{event.title}</div>
                    <div className="text-[10px] text-slate-400 dark:text-white/30 mt-1">{new Date(event.date).toLocaleDateString('fr-FR')}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-br from-[#3054ff] to-[#1943f2] text-white relative overflow-hidden shadow-[0_20px_50px_rgba(48,84,255,0.3)]">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-[40px]" />
              <div className="relative z-10">
                <h3 className="text-lg font-bold mb-2">Synchroniser</h3>
                <p className="text-sm text-white/70 mb-4">Synchronisez votre calendrier avec Google Calendar ou Outlook.</p>
                <Button className="w-full bg-white text-[#3054ff] hover:bg-white/90 font-bold rounded-xl h-10 text-sm">
                  <ArrowUpRight size={16} className="mr-2" />
                  Configurer
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}

export default StudentCalendarPage

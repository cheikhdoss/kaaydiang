import { Bell, Clock, Check, AlertCircle, Info } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { resolveRoleDashboardPath } from '../utils/navigation'
import { DashboardShell } from '../components/DashboardShell'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { useDashboardData } from '../hooks/useDashboardData'
import {
  useMarkAllStudentNotificationsRead,
  useMarkStudentNotificationRead,
  useStudentNotifications,
} from '../hooks/useStudentSupplements'
import type { DashboardRole } from '../services/dashboard.api'

const StudentNotificationsPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { data, isLoading, isError, error, refetch } = useDashboardData('student')
  const {
    data: notifications = [],
    isLoading: notificationsLoading,
    isError: notificationsError,
    error: notificationsQueryError,
    refetch: refetchNotifications,
  } = useStudentNotifications()
  const markRead = useMarkStudentNotificationRead()
  const markAllRead = useMarkAllStudentNotificationsRead()

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
  if (notificationsLoading) return <LoadingState fullscreen />
  if (notificationsError) {
    return <ErrorState message={notificationsQueryError instanceof Error ? notificationsQueryError.message : 'Erreur'} onRetry={() => void refetchNotifications()} />
  }

  const unreadCount = notifications.filter((notification) => !notification.read).length

  const typeConfig = {
    info: { icon: Info, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-400/10', border: 'border-blue-200 dark:border-blue-400/20' },
    warning: { icon: AlertCircle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-400/10', border: 'border-amber-200 dark:border-amber-400/20' },
    success: { icon: Check, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-400/10', border: 'border-emerald-200 dark:border-emerald-400/20' },
    error: { icon: AlertCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-400/10', border: 'border-red-200 dark:border-red-400/20' },
  }

  return (
    <DashboardShell
      title="Notifications"
      subtitle={`${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`}
      role="student"
      viewerRole={user.role}
      userName={`${user.first_name} ${user.last_name}`}
      userEmail={user.email}
      onLogout={handleLogout}
      onNavigateRole={handleNavigateRole}
    >
      <div className="space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-400/10 flex items-center justify-center">
              <Bell size={22} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{notifications.length}</div>
              <div className="text-xs text-slate-500 dark:text-white/40">Total</div>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-400/10 flex items-center justify-center">
              <Clock size={22} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{unreadCount}</div>
              <div className="text-xs text-slate-500 dark:text-white/40">Non lues</div>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-400/10 flex items-center justify-center">
              <Check size={22} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{notifications.length - unreadCount}</div>
              <div className="text-xs text-slate-500 dark:text-white/40">Lues</div>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider">Toutes les notifications</h3>
            <button
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium disabled:opacity-60"
              onClick={() => void markAllRead.mutateAsync()}
              disabled={markAllRead.isPending || notifications.length === 0}
            >
              {markAllRead.isPending ? 'Mise a jour...' : 'Tout marquer comme lu'}
            </button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {notifications.length === 0 ? (
              <div className="p-6 text-sm text-slate-500 dark:text-white/40">Aucune notification pour le moment.</div>
            ) : notifications.map((notif, i) => {
              const config = typeConfig[notif.type]
              const Icon = config.icon
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-4 flex gap-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer ${!notif.read ? 'bg-blue-50/50 dark:bg-blue-400/5' : ''}`}
                  onClick={() => {
                    if (!notif.read) {
                      void markRead.mutateAsync(notif.id)
                    }
                  }}
                >
                  <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0 ${!notif.read ? '' : 'opacity-60'}`}>
                    <Icon size={18} className={config.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`text-sm font-semibold ${!notif.read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-white/60'}`}>
                        {notif.title}
                        {!notif.read && <span className="inline-block w-2 h-2 bg-blue-600 rounded-full ml-2" />}
                      </h4>
                      <span className="text-xs text-slate-400 dark:text-white/30 flex-shrink-0">{notif.date}</span>
                    </div>
                    <p className={`text-sm mt-1 ${!notif.read ? 'text-slate-600 dark:text-white/70' : 'text-slate-400 dark:text-white/40'}`}>{notif.message}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}

export default StudentNotificationsPage

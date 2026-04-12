import { motion } from 'framer-motion'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, Area, AreaChart,
} from 'recharts'
import { useState } from 'react'
import {
  TrendingUp, Users, BookOpen, FileText, Activity,
  Clock, Filter, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { DashboardShell } from '../components/DashboardShell'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useAdminChartData, useAdminActivityLogs } from '../hooks/useAdminCharts'
import type { DashboardRole } from '../services/dashboard.api'

const AdminActivityPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { data: chartData, isLoading: chartsLoading, isError: chartsError } = useAdminChartData()
  const [logPage, setLogPage] = useState(1)
  const [logDays, setLogDays] = useState(30)
  const { data: logsData, isLoading: logsLoading } = useAdminActivityLogs({
    page: logPage,
    days: logDays,
    per_page: 15,
  })

  if (!user) return <LoadingState fullscreen />

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const handleNavigateRole = (role: DashboardRole) => {
    const paths: Record<DashboardRole, string> = {
      admin: '/dashboard/admin',
      instructor: '/dashboard/instructor',
      student: '/dashboard/student',
    }
    navigate(paths[role])
  }

  if (chartsLoading || logsLoading) return <LoadingState fullscreen />
  if (chartsError) return <ErrorState message="Erreur chargement graphiques" onRetry={() => window.location.reload()} />

  const actionLabels: Record<string, string> = {
    'user.registered': 'Inscription',
    'user.logged_in': 'Connexion',
    'user.created': 'Création utilisateur',
    'user.role_changed': 'Changement de rôle',
    'user.status_changed': 'Changement de statut',
    'course.created': 'Création de cours',
    'course.published': 'Cours publié',
    'course.unpublished': 'Cours dépublié',
    'course.deleted': 'Cours supprimé',
    'admin.course.approved': 'Cours approuvé',
    'admin.course.unpublished': 'Cours dépublié (admin)',
    'admin.course.deleted': 'Cours supprimé (admin)',
    'assignment.created': 'Devoir créé',
    'assignment.graded': 'Devoir noté',
  }

  const actionColors: Record<string, string> = {
    'user.registered': '#3b82f6',
    'user.logged_in': '#94a3b8',
    'user.created': '#8b5cf6',
    'user.role_changed': '#f59e0b',
    'user.status_changed': '#ef4444',
    'course.created': '#10b981',
    'course.published': '#22c55e',
    'course.unpublished': '#6b7280',
    'course.deleted': '#dc2626',
    'admin.course.approved': '#10b981',
    'admin.course.unpublished': '#f59e0b',
    'admin.course.deleted': '#dc2626',
    'assignment.created': '#06b6d4',
    'assignment.graded': '#a855f7',
  }

  return (
    <DashboardShell
      title="Activité & Analyses"
      subtitle="Tableau de bord complet avec journaux d'activité et graphiques"
      role="admin"
      viewerRole={user.role}
      userName={`${user.first_name} ${user.last_name}`}
      userEmail={user.email}
      onLogout={handleLogout}
      onNavigateRole={handleNavigateRole}
    >
      <div className="space-y-6">

        {/* ──────────── CHARTS: Registrations & Enrollments ──────────── */}
        {chartData && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Registrations (30 jours) */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-white/10 bg-black/40 p-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Users size={16} className="text-blue-400" />
                  <h3 className="text-sm font-bold text-white">Inscriptions (30 jours)</h3>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData.registrations}>
                    <defs>
                      <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#regGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Enrollments (30 jours) */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-white/10 bg-black/40 p-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen size={16} className="text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Inscriptions cours (30 jours)</h3>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData.enrollments}>
                    <defs>
                      <linearGradient id="enrGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#10b981" fill="url(#enrGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>
            </div>

            {/* ──────────── Activity by type (7 jours) ──────────── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-white/10 bg-black/40 p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <Activity size={16} className="text-purple-400" />
                <h3 className="text-sm font-bold text-white">Activité par type (7 derniers jours)</h3>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData.activity_by_type}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="user_actions" name="Utilisateurs" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="course_actions" name="Cours" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="assignment_actions" name="Devoirs" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* ──────────── PIE CHARTS ──────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Role Distribution */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl border border-white/10 bg-black/40 p-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Users size={16} className="text-blue-400" />
                  <h3 className="text-sm font-bold text-white">Rôles</h3>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={chartData.role_distribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      dataKey="count"
                      nameKey="role"
                      stroke="rgba(255,255,255,0.1)"
                    >
                      {chartData.role_distribution.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1 mt-2">
                  {chartData.role_distribution.map((item) => (
                    <div key={item.role} className="flex items-center gap-2 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-white/60">{item.role}</span>
                      <span className="text-white font-bold ml-auto">{item.count}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Level Distribution */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="rounded-2xl border border-white/10 bg-black/40 p-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={16} className="text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Niveaux</h3>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={chartData.level_distribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      dataKey="count"
                      nameKey="level"
                      stroke="rgba(255,255,255,0.1)"
                    >
                      {chartData.level_distribution.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1 mt-2">
                  {chartData.level_distribution.map((item) => (
                    <div key={item.level} className="flex items-center gap-2 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-white/60">{item.level}</span>
                      <span className="text-white font-bold ml-auto">{item.count}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Publication Status */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-2xl border border-white/10 bg-black/40 p-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <FileText size={16} className="text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Publication</h3>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={chartData.publication_status}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      dataKey="count"
                      nameKey="status"
                      stroke="rgba(255,255,255,0.1)"
                    >
                      {chartData.publication_status.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1 mt-2">
                  {chartData.publication_status.map((item) => (
                    <div key={item.status} className="flex items-center gap-2 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-white/60">{item.status}</span>
                      <span className="text-white font-bold ml-auto">{item.count}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </>
        )}

        {/* ──────────── ACTIVITY LOGS TABLE ──────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl border border-white/10 bg-black/40 p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-white/60" />
              <h3 className="text-sm font-bold text-white">Journal d'activité</h3>
            </div>
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-white/40" />
              <select
                value={logDays}
                onChange={(e) => setLogDays(Number(e.target.value))}
                className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white"
              >
                <option value={7}>7 jours</option>
                <option value={14}>14 jours</option>
                <option value={30}>30 jours</option>
                <option value={90}>90 jours</option>
              </select>
            </div>
          </div>

          {logsData && logsData.data.length === 0 ? (
            <p className="text-sm text-white/50 text-center py-8">Aucune activité enregistrée.</p>
          ) : (
            <>
              <div className="space-y-2">
                {logsData?.data.map((log) => (
                  <motion.div
                    key={log.id}
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                    className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3"
                  >
                    {/* Color dot */}
                    <div
                      className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: actionColors[log.action] || '#6b7280' }}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-white">
                          {actionLabels[log.action] || log.action}
                        </span>
                        {log.user && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/50">
                            {log.user.role}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/60 mt-0.5">{log.description}</p>
                      {log.user && (
                        <p className="text-[10px] text-white/35 mt-0.5">
                          {log.user.name} ({log.user.email})
                        </p>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] text-white/35">
                        {new Date(log.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {log.ip_address && (
                        <p className="text-[10px] text-white/20 mt-0.5">{log.ip_address}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {logsData && logsData.last_page > 1 && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                  <p className="text-xs text-white/40">
                    Page {logsData.current_page} / {logsData.last_page} ({logsData.total} entrées)
                  </p>
                  <div className="flex gap-1">
                    <button
                      disabled={logsData.current_page <= 1}
                      onClick={() => setLogPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      disabled={logsData.current_page >= logsData.last_page}
                      onClick={() => setLogPage((p) => Math.min(logsData.last_page, p + 1))}
                      className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </DashboardShell>
  )
}

export default AdminActivityPage

import { motion } from 'framer-motion'
import { BookOpenCheck, ChevronLeft, ChevronRight, ScrollText, ShieldCheck, UserCog, Users } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Gauge } from '@/components/ui/gauge'
import { dashboardPaths } from '../utils/navigation'
import { ActionFeedback } from './ActionFeedback'
import { useAdminUsers, useUpdateAdminUserRole, useUpdateAdminUserStatus } from '../hooks/useAdminUsers'
import { useAdminActivityLogs } from '../hooks/useAdminActivityLogs'
import { useAdminModules } from '../hooks/useAdminModules'
import type { AdminDashboardPayload } from '../services/dashboard.api'

interface AdminDashboardProps {
  data: AdminDashboardPayload
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ data }) => {
  const navigate = useNavigate()
  const { data: usersPage } = useAdminUsers()
  const updateRole = useUpdateAdminUserRole()
  const updateStatus = useUpdateAdminUserStatus()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [logPage, setLogPage] = useState(1)
  const { data: activityPage, isLoading: logsLoading, isError: logsError } = useAdminActivityLogs(logPage)

  const { data: modulesData } = useAdminModules()
  const recentUsers = modulesData?.modules.recent_users ?? []
  const recentCourses = modulesData?.modules.recent_courses ?? []
  const openReviews = modulesData?.modules.open_reviews ?? []
  const managedUsers = usersPage?.data ?? []

  const ratio = data.stats.users > 0 ? Math.round((data.stats.instructors / data.stats.users) * 100) : 0

  const stats = [
    { icon: Users, label: 'Utilisateurs', value: data.stats.users },
    { icon: UserCog, label: 'Etudiants', value: data.stats.students },
    { icon: ShieldCheck, label: 'Instructeurs', value: data.stats.instructors },
    { icon: BookOpenCheck, label: 'Cours publies', value: data.stats.published_courses },
  ]

  return (
    <>
      {feedback ? <div className='mb-4'><ActionFeedback type={feedback.type} message={feedback.message} /></div> : null}
      <div
        id="journal-systeme"
        className="mb-8 rounded-2xl border border-[#3054ff]/25 bg-gradient-to-br from-black/50 to-[#1a1f3a]/40 p-5 shadow-[0_0_40px_-12px_rgba(48,84,255,0.35)]"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-[#8ea0ff]" />
            <h4 className="text-sm font-semibold text-white/95">Journal d&apos;activite systeme</h4>
          </div>
          <p className="text-xs text-white/55">
            Traces des appels API (methodes, chemins, acteurs, codes HTTP). Consultation de cette page n&apos;est pas
            enregistree pour eviter le bruit.
          </p>
        </div>

        {logsLoading ? (
          <p className="py-8 text-center text-sm text-white/60">Chargement du journal...</p>
        ) : logsError ? (
          <p className="py-8 text-center text-sm text-red-300/90">Impossible de charger le journal.</p>
        ) : (
          <>
            <div className="max-h-[420px] overflow-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[720px] border-collapse text-left text-xs text-white/85">
                <thead className="sticky top-0 z-10 bg-[#0d1020]/95 backdrop-blur">
                  <tr className="border-b border-white/10">
                    <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-white/70">Date</th>
                    <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-white/70">Acteur</th>
                    <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-white/70">Action</th>
                    <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-white/70">Methode</th>
                    <th className="min-w-[180px] px-3 py-2.5 font-semibold text-white/70">Chemin</th>
                    <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-white/70">HTTP</th>
                  </tr>
                </thead>
                <tbody>
                  {(activityPage?.data ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-white/55">
                        Aucune activite enregistree pour le moment.
                      </td>
                    </tr>
                  ) : (
                    (activityPage?.data ?? []).map((row) => {
                      const when = new Date(row.created_at)
                      const actor =
                        row.user != null
                          ? `${row.user.first_name} ${row.user.last_name} (${row.user.role})`
                          : row.actor_email ?? '—'
                      return (
                        <tr key={row.id} className="border-b border-white/5 bg-white/[0.02] hover:bg-white/[0.05]">
                          <td className="whitespace-nowrap px-3 py-2.5 text-white/65">
                            {when.toLocaleString('fr-FR', {
                              dateStyle: 'short',
                              timeStyle: 'medium',
                            })}
                          </td>
                          <td className="max-w-[160px] truncate px-3 py-2.5" title={actor}>
                            {actor}
                          </td>
                          <td className="max-w-[220px] truncate px-3 py-2.5 text-white/80" title={row.action_summary}>
                            {row.action_summary}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[#9dacf7]">{row.method}</td>
                          <td className="max-w-[280px] truncate px-3 py-2.5 font-mono text-white/70" title={row.path}>
                            {row.path}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5">
                            <span
                              className={
                                row.status_code >= 200 && row.status_code < 300
                                  ? 'text-emerald-300/90'
                                  : row.status_code >= 400
                                    ? 'text-red-300/90'
                                    : 'text-amber-200/90'
                              }
                            >
                              {row.status_code}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {activityPage != null && activityPage.last_page > 1 ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-white/65">
                <span>
                  Page {activityPage.current_page} / {activityPage.last_page} — {activityPage.total} entrees
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-white/20 bg-transparent text-white hover:bg-white/10"
                    disabled={activityPage.current_page <= 1}
                    onClick={() => setLogPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Precedent
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-white/20 bg-transparent text-white hover:bg-white/10"
                    disabled={activityPage.current_page >= activityPage.last_page}
                    onClick={() => setLogPage((p) => p + 1)}
                  >
                    Suivant
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
          <Gauge
            value={ratio}
            size="large"
            showValue
            colors={{
              primary: '#7c89ff',
              secondary: 'rgba(255,255,255,0.2)',
            }}
          />
          <p className="mt-4 text-center text-xs text-white/60">Ratio instructeurs</p>
        </div>

        <div className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-5 lg:col-span-2">
          <h4 className="text-sm font-semibold text-white/85">Modules administration</h4>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {data.modules.map((module) => (
              <div key={module.key} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <h5 className="mb-2 text-sm font-semibold text-white">{module.title}</h5>
                <p className="mb-3 text-xs text-white/65">{module.description}</p>
                <Button
                  className="w-full bg-[#3054ff]/90 text-white hover:bg-[#2445e8]"
                  onClick={() => {
                    if (module.key === 'user-governance') {
                      navigate(dashboardPaths.adminUsers)
                      return
                    }
                    if (module.key === 'content-moderation') {
                      setFeedback({ type: 'success', message: 'Moderation active sur les cours recents.' })
                      navigate(dashboardPaths.admin)
                      return
                    }
                                       if (module.key === 'platform-health') {
                      setFeedback({ type: 'success', message: 'Indicateurs plateforme synchronises.' })
                      navigate(dashboardPaths.admin)
                      return
                    }
                    if (module.key === 'system-audit') {
                      document.getElementById('journal-systeme')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      return
                    }
                    setFeedback({ type: 'success', message: `${module.cta} disponible.` })
                  }}
                >
                  {module.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-8 mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (index + 1) }}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#3054ff]/20">
              <stat.icon className="h-6 w-6 text-[#8ea0ff]" />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-white/65">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
          <h4 className="mb-4 text-sm font-semibold text-white/90">Nouveaux utilisateurs</h4>
          <div className="space-y-2">
            {recentUsers.length === 0 ? (
              <p className="text-sm text-white/60">Aucun utilisateur recent.</p>
            ) : (
              recentUsers.slice(0, 5).map((user) => (
                <div key={user.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="text-sm font-semibold text-white">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs text-white/60">
                    {user.email} | {user.role}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
          <h4 className="mb-4 text-sm font-semibold text-white/90">Cours recents</h4>
          <div className="space-y-2">
            {recentCourses.length === 0 ? (
              <p className="text-sm text-white/60">Aucun cours recent.</p>
            ) : (
              recentCourses.slice(0, 5).map((course) => (
                <div key={course.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="text-sm font-semibold text-white">{course.title}</p>
                  <p className="text-xs text-white/60">
                    {course.instructor || 'Instructeur inconnu'} | Chapitres: {course.chapters_count}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
          <h4 className="mb-4 text-sm font-semibold text-white/90">Reviews ouvertes</h4>
          <div className="space-y-2">
            {openReviews.length === 0 ? (
              <p className="text-sm text-white/60">Aucune review en attente.</p>
            ) : (
              openReviews.slice(0, 5).map((review) => (
                <div key={review.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="text-sm font-semibold text-white">{review.assignment.title ?? 'Soumission'}</p>
                  <p className="text-xs text-white/60">
                    {review.student.first_name} {review.student.last_name} | {review.status}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-black/35 p-5">
        <h4 className="mb-4 text-sm font-semibold text-white/90">Gestion utilisateurs (admin)</h4>
        <div className='mb-3'>
          <Button
            className='bg-[#3054ff] text-white hover:bg-[#2445e8]'
            onClick={() => navigate(dashboardPaths.adminUsers)}
          >
            Ouvrir la page complete utilisateurs
          </Button>
        </div>
        <div className="space-y-3">
          {managedUsers.length === 0 ? (
            <p className="text-sm text-white/60">Aucun utilisateur trouve.</p>
          ) : (
            managedUsers.slice(0, 8).map((user) => (
              <div
                key={user.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-white">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs text-white/60">
                    {user.email} | role: {user.role} | {user.is_active ? 'actif' : 'inactif'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="border-white/20 bg-transparent text-white hover:bg-white/10"
                    disabled={updateRole.isPending}
                    onClick={() => {
                      setFeedback(null)
                      const nextRole = user.role === 'student' ? 'instructor' : user.role === 'instructor' ? 'admin' : 'student'
                      updateRole
                        .mutateAsync({ userId: user.id, role: nextRole })
                        .then(() => setFeedback({ type: 'success', message: 'Role mis a jour.' }))
                        .catch((err: unknown) => {
                          const message = err instanceof Error ? err.message : 'Echec mise a jour role.'
                          setFeedback({ type: 'error', message })
                        })
                    }}
                  >
                    Changer role
                  </Button>
                  <Button
                    className="bg-[#3054ff]/90 text-white hover:bg-[#2445e8]"
                    disabled={updateStatus.isPending}
                    onClick={() => {
                      setFeedback(null)
                      updateStatus
                        .mutateAsync({ userId: user.id, isActive: !user.is_active })
                        .then(() => setFeedback({ type: 'success', message: 'Statut mis a jour.' }))
                        .catch((err: unknown) => {
                          const message = err instanceof Error ? err.message : 'Echec mise a jour statut.'
                          setFeedback({ type: 'error', message })
                        })
                    }}
                  >
                    {user.is_active ? 'Desactiver' : 'Activer'}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}

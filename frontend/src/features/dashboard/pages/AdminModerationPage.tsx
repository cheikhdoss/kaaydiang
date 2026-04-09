import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Eye,
  EyeOff,
  Filter,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { DashboardShell } from '../components/DashboardShell'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { ConfirmationModal } from '../components/ConfirmationModal'
import { useAdminCourses, useToggleAdminCourseStatus, useDeleteAdminCourse } from '../hooks/useAdminHealth'
import type { DashboardRole, AdminCourseModerationItem } from '../services/dashboard.api'

const AdminModerationPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | boolean>('all')
  const [deleteCourseId, setDeleteCourseId] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const filters = useMemo(() => {
    const params: Record<string, string | number | boolean | undefined> = { page: currentPage, per_page: 15 }
    if (searchTerm.trim()) params.search = searchTerm.trim()
    if (levelFilter !== 'all') params.level = levelFilter
    if (statusFilter !== 'all') params.is_published = statusFilter
    return params
  }, [currentPage, searchTerm, levelFilter, statusFilter])

  const { data: coursesData, isLoading, isError, error, refetch } = useAdminCourses(filters)
  const toggleStatus = useToggleAdminCourseStatus()
  const deleteCourse = useDeleteAdminCourse()

  if (!user) return <LoadingState fullscreen />

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const handleNavigateRole = (role: DashboardRole) => {
    navigate(resolveRoleDashboardPath(role))
  }

  const handleToggleStatus = async (course: AdminCourseModerationItem) => {
    setFeedback(null)
    try {
      await toggleStatus.mutateAsync({ courseId: course.id, isPublished: !course.is_published })
      setFeedback({
        type: 'success',
        message: course.is_published ? 'Cours dépublié.' : 'Cours publié.',
      })
    } catch {
      setFeedback({ type: 'error', message: 'Erreur lors du changement de statut.' })
    }
  }

  const handleDelete = async () => {
    setFeedback(null)
    if (!deleteCourseId) return
    try {
      await deleteCourse.mutateAsync(deleteCourseId)
      setDeleteCourseId(null)
      setFeedback({ type: 'success', message: 'Cours supprimé.' })
    } catch {
      setFeedback({ type: 'error', message: 'Erreur lors de la suppression.' })
    }
  }

  const courses = coursesData?.data ?? []
  const totalPages = coursesData?.last_page ?? 1

  const resolveRoleDashboardPath = (role: DashboardRole) => {
    switch (role) {
      case 'admin': return '/dashboard/admin'
      case 'instructor': return '/dashboard/instructor'
      case 'student': return '/dashboard/student'
    }
  }

  return (
    <DashboardShell
      title="Modération Contenu"
      subtitle="Contrôlez les cours publiés et la qualité éditoriale"
      role="admin"
      viewerRole={user.role}
      userName={`${user.first_name} ${user.last_name}`}
      userEmail={user.email}
      onLogout={handleLogout}
      onNavigateRole={handleNavigateRole}
    >
      <div className="space-y-6">
        {feedback && (
          <div className={`rounded-xl p-4 text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {feedback.message}
          </div>
        )}

        {/* Filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/5 dark:bg-white/5">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={16} className="text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Filtres</h3>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
                placeholder="Rechercher un cours..."
                className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>

            <select
              value={levelFilter}
              onChange={(e) => { setLevelFilter(e.target.value); setCurrentPage(1) }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
              <option value="all">Tous niveaux</option>
              <option value="beginner">Débutant</option>
              <option value="intermediate">Intermédiaire</option>
              <option value="advanced">Avancé</option>
            </select>

            <select
              value={statusFilter === 'all' ? 'all' : statusFilter ? 'published' : 'draft'}
              onChange={(e) => {
                const v = e.target.value
                setStatusFilter(v === 'all' ? 'all' : v === 'published')
                setCurrentPage(1)
              }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
              <option value="all">Tous statuts</option>
              <option value="published">Publiés</option>
              <option value="draft">Brouillons</option>
            </select>

            {(searchTerm || levelFilter !== 'all' || statusFilter !== 'all') && (
              <button
                onClick={() => { setSearchTerm(''); setLevelFilter('all'); setStatusFilter('all'); setCurrentPage(1) }}
                className="flex items-center gap-1 h-10 px-3 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5"
              >
                <X size={14} /> Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* Course list */}
        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState message={error instanceof Error ? error.message : 'Erreur'} onRetry={() => void refetch()} />
        ) : courses.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center dark:border-white/5 dark:bg-white/5">
            <BookOpen size={48} className="mx-auto mb-4 text-slate-300 dark:text-white/20" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Aucun cours trouvé</h3>
            <p className="text-sm text-slate-500 dark:text-white/40">Modifiez vos filtres pour voir plus de résultats.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/5 dark:bg-white/5"
              >
                <div className="flex flex-wrap items-start gap-4">
                  {/* Thumbnail */}
                  <div className="w-24 h-16 rounded-xl bg-slate-200 dark:bg-white/10 overflow-hidden flex-shrink-0">
                    {course.thumbnail ? (
                      <img
                        src={`${import.meta.env.VITE_API_URL.replace('/api', '')}/storage/${course.thumbnail}`}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-white/20">
                        <BookOpen size={20} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{course.title}</h4>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        course.is_published
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400'
                          : 'bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400'
                      }`}>
                        {course.is_published ? 'Publié' : 'Brouillon'}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold capitalize dark:bg-white/10 dark:text-white/60">
                        {course.level}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-white/40 line-clamp-1 mb-2">
                      {course.description || 'Aucune description'}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-white/40">
                      <span className="flex items-center gap-1">
                        <Users size={12} /> {course.enrollments_count} inscrits
                      </span>
                      <span>{course.chapters_count} chapitres</span>
                      <span>Instructeur: {course.instructor}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className={`h-8 rounded-lg text-xs font-semibold ${
                        course.is_published
                          ? 'border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-400/20 dark:text-amber-400 dark:hover:bg-amber-400/10'
                          : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-400/20 dark:text-emerald-400 dark:hover:bg-emerald-400/10'
                      }`}
                      onClick={() => void handleToggleStatus(course)}
                      disabled={toggleStatus.isPending}
                    >
                      {course.is_published ? <EyeOff size={12} className="mr-1" /> : <Eye size={12} className="mr-1" />}
                      {course.is_published ? 'Dépublier' : 'Publier'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50"
                      onClick={() => setDeleteCourseId(course.id)}
                      disabled={deleteCourse.isPending}
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-xs text-slate-500 dark:text-white/40">
                  Page {currentPage} sur {totalPages} ({coursesData?.total ?? 0} cours)
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-lg text-xs"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                  >
                    Précédent
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-lg text-xs"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmationModal
        open={deleteCourseId !== null}
        title="Supprimer le cours"
        description="Êtes-vous sûr de vouloir supprimer ce cours ? Cette action est irréversible."
        confirmLabel="Supprimer"
        isPending={deleteCourse.isPending}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteCourseId(null)}
      />
    </DashboardShell>
  )
}

export default AdminModerationPage

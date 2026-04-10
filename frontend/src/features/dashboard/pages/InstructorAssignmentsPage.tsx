import { useMemo, useState } from 'react'
import { ClipboardList, Clock, Download, Edit, Eye, FileText, Plus, Search, Send, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { dashboardPaths, resolveRoleDashboardPath } from '../utils/navigation'
import { DashboardShell } from '../components/DashboardShell'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { ActionFeedback } from '../components/ActionFeedback'
import { ConfirmationModal } from '../components/ConfirmationModal'
import {
  useCreateInstructorAssignment,
  useDeleteInstructorAssignment,
  useGradeInstructorAssignmentSubmission,
  useInstructorAssignments,
  useInstructorAssignmentSubmissions,
  useUpdateInstructorAssignment,
} from '../hooks/useInstructorSupplements'
import { useInstructorCourses } from '../hooks/useInstructorCourses'
import type {
  CreateInstructorAssignmentPayload,
  DashboardRole,
  InstructorAssignmentItem,
  UpdateInstructorAssignmentPayload,
} from '../services/dashboard.api'

type CorrectionStatus = 'reviewed' | 'rejected'

interface SubmissionDraft {
  score: string
  status: CorrectionStatus
  feedback: string
  correctionFiles: File[]
}

interface SubmissionSnapshot {
  score: number | null
  status: 'submitted' | 'reviewed' | 'rejected'
  instructor_feedback: string | null
}

interface AssignmentDraft {
  title: string
  description: string
  course_id: string
  due_date: string
}

const emptyDraft: AssignmentDraft = { title: '', description: '', course_id: '', due_date: '' }

const statusConfig: Record<string, { color: string; text: string; label: string }> = {
  active: { color: 'bg-emerald-50 dark:bg-emerald-400/10', text: 'text-emerald-600 dark:text-emerald-400', label: 'Actif' },
  draft: { color: 'bg-amber-50 dark:bg-amber-400/10', text: 'text-amber-600 dark:text-amber-400', label: 'Brouillon' },
  completed: { color: 'bg-slate-50 dark:bg-slate-400/10', text: 'text-slate-600 dark:text-slate-400', label: 'Termine' },
}

const InstructorAssignmentsPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [searchTerm, setSearchTerm] = useState('')
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState<'all' | 'draft' | 'active' | 'completed'>('all')
  const [submissionSearchTerm, setSubmissionSearchTerm] = useState('')
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState<'all' | 'submitted' | 'reviewed' | 'rejected'>('all')

  // Create / Edit / Delete assignment state
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createDraft, setCreateDraft] = useState<AssignmentDraft>({ ...emptyDraft })
  const [editingAssignmentId, setEditingAssignmentId] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState<AssignmentDraft>({ ...emptyDraft })
  const [deleteAssignmentId, setDeleteAssignmentId] = useState<number | null>(null)

  const { data: courses = [] } = useInstructorCourses()
  const createInstructorAssignment = useCreateInstructorAssignment()
  const updateInstructorAssignment = useUpdateInstructorAssignment()
  const deleteInstructorAssignment = useDeleteInstructorAssignment()

  const assignmentFilters = useMemo(() => {
    const next: { search?: string; status?: 'draft' | 'active' | 'completed' } = {}
    const trimmedSearch = searchTerm.trim()
    if (trimmedSearch !== '') next.search = trimmedSearch
    if (assignmentStatusFilter !== 'all') next.status = assignmentStatusFilter
    return next
  }, [assignmentStatusFilter, searchTerm])

  const { data: assignments = [], isLoading, isError, error, refetch } = useInstructorAssignments(assignmentFilters)
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [draftBySubmission, setDraftBySubmission] = useState<Record<number, SubmissionDraft>>({})

  const submissionFilters = useMemo(() => {
    const next: { search?: string; status?: 'submitted' | 'reviewed' | 'rejected' } = {}
    const trimmedSearch = submissionSearchTerm.trim()
    if (trimmedSearch !== '') next.search = trimmedSearch
    if (submissionStatusFilter !== 'all') next.status = submissionStatusFilter
    return next
  }, [submissionSearchTerm, submissionStatusFilter])

  const selectedAssignment = useMemo(
    () => {
      const data = assignments as InstructorAssignmentItem[] | null
      if (!data) return null
      return data.find((assignment) => assignment.id === selectedAssignmentId) ?? null
    },
    [assignments, selectedAssignmentId],
  )

  const submissionsQuery = useInstructorAssignmentSubmissions(selectedAssignmentId, submissionFilters)
  const gradeSubmission = useGradeInstructorAssignmentSubmission()

  if (!user) return <LoadingState fullscreen />

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const handleNavigateRole = (role: DashboardRole) => {
    navigate(resolveRoleDashboardPath(role))
  }

  // ── Create Assignment ──
  const handleCreateAssignment = async () => {
    setFeedback(null)
    if (!createDraft.title.trim()) {
      setFeedback({ type: 'error', message: 'Le titre est obligatoire.' })
      return
    }
    if (!createDraft.course_id) {
      setFeedback({ type: 'error', message: 'Selectionnez un cours.' })
      return
    }

    const payload: CreateInstructorAssignmentPayload = {
      title: createDraft.title.trim(),
      description: createDraft.description.trim() || null,
      course_id: Number(createDraft.course_id),
      due_date: createDraft.due_date || null,
    }

    try {
      await createInstructorAssignment.mutateAsync(payload)
      setCreateDraft({ ...emptyDraft })
      setShowCreateForm(false)
      setFeedback({ type: 'success', message: 'Devoir cree avec succes.' })
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Erreur de creation.' })
    }
  }

  // ── Edit Assignment ──
  const openEditForm = (assignment: InstructorAssignmentItem) => {
    setEditingAssignmentId(assignment.id)
    setEditDraft({
      title: assignment.title,
      description: '',
      course_id: String(assignment.course_id),
      due_date: assignment.due_date || '',
    })
  }

  const closeEditForm = () => {
    setEditingAssignmentId(null)
    setEditDraft({ ...emptyDraft })
  }

  const handleUpdateAssignment = async () => {
    setFeedback(null)
    if (!editingAssignmentId) return
    if (!editDraft.title.trim()) {
      setFeedback({ type: 'error', message: 'Le titre est obligatoire.' })
      return
    }

    const payload: UpdateInstructorAssignmentPayload = {
      title: editDraft.title.trim(),
      ...(editDraft.description.trim() ? { description: editDraft.description.trim() } : {}),
      ...(editDraft.course_id ? { course_id: Number(editDraft.course_id) } : {}),
      ...(editDraft.due_date ? { due_date: editDraft.due_date } : {}),
    }

    try {
      await updateInstructorAssignment.mutateAsync({ assignmentId: editingAssignmentId, payload })
      closeEditForm()
      setFeedback({ type: 'success', message: 'Devoir modifie avec succes.' })
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Erreur de modification.' })
    }
  }

  // ── Delete Assignment ──
  const handleDeleteAssignment = async () => {
    setFeedback(null)
    if (!deleteAssignmentId) return

    try {
      await deleteInstructorAssignment.mutateAsync(deleteAssignmentId)
      setDeleteAssignmentId(null)
      setFeedback({ type: 'success', message: 'Devoir supprime avec succes.' })
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Erreur de suppression.' })
    }
  }

  if (isLoading) return <LoadingState fullscreen />
  if (isError) return <ErrorState message={error instanceof Error ? error.message : 'Erreur'} onRetry={() => void refetch()} />

  const pendingReview = assignments
    .filter((a) => a.status === 'active')
    .reduce((acc, a) => acc + Math.max(0, a.submission_count - Math.floor(a.submission_count * 0.7)), 0)

  const openCorrections = (assignment: InstructorAssignmentItem) => {
    setSelectedAssignmentId(assignment.id)
    setFeedback(null)
  }

  const closeCorrections = () => {
    setSelectedAssignmentId(null)
    setFeedback(null)
  }

  const readDraft = (submissionId: number, score: number | null, status: 'submitted' | 'reviewed' | 'rejected', instructorFeedback: string | null): SubmissionDraft => {
    const existing = draftBySubmission[submissionId]
    if (existing) return existing

    return {
      score: score !== null ? String(score) : '',
      status: status === 'rejected' ? 'rejected' : 'reviewed',
      feedback: instructorFeedback ?? '',
      correctionFiles: [],
    }
  }

  const patchDraft = (
    submissionId: number,
    base: SubmissionSnapshot,
    patch: Partial<SubmissionDraft>,
  ) => {
    const current = readDraft(submissionId, base.score, base.status, base.instructor_feedback)

    setDraftBySubmission((prev) => ({
      ...prev,
      [submissionId]: {
        ...current,
        ...patch,
      },
    }))
  }

  const handleGrade = async (
    assignmentId: number,
    submissionId: number,
    base: SubmissionSnapshot,
  ) => {
    setFeedback(null)

    const draft = readDraft(submissionId, base.score, base.status, base.instructor_feedback)
    const parsedScore = Number.parseInt(draft.score, 10)

    if (!Number.isFinite(parsedScore) || parsedScore < 0 || parsedScore > 100) {
      setFeedback({ type: 'error', message: 'La note doit etre comprise entre 0 et 100.' })
      return
    }

    try {
      await gradeSubmission.mutateAsync({
        assignmentId,
        submissionId,
        payload: {
          status: draft.status,
          score: parsedScore,
          feedback: draft.feedback.trim() || null,
          correction_files: draft.correctionFiles,
        },
      })

      setDraftBySubmission((prev) => {
        const next = { ...prev }
        delete next[submissionId]
        return next
      })

      setFeedback({ type: 'success', message: 'Soumission corrigee avec succes.' })
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Erreur de correction.' })
    }
  }

  return (
    <DashboardShell
      title="Devoirs"
      subtitle={`${Math.round(pendingReview)} soumissions en attente de correction`}
      role="instructor"
      viewerRole={user.role}
      userName={`${user.first_name} ${user.last_name}`}
      userEmail={user.email}
      onLogout={handleLogout}
      onNavigateRole={handleNavigateRole}
    >
      <div className="space-y-6">
        {feedback && <ActionFeedback type={feedback.type} message={feedback.message} />}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/5 dark:bg-white/5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
              <ClipboardList size={22} className="text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{assignments.length}</div>
              <div className="text-xs text-slate-500 dark:text-white/40">Total devoirs</div>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/5 dark:bg-white/5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-600">
              <Clock size={22} className="text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{assignments.filter((a) => a.status === 'active').length}</div>
              <div className="text-xs text-slate-500 dark:text-white/40">En cours</div>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/5 dark:bg-white/5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600">
              <Download size={22} className="text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{assignments.reduce((acc, a) => acc + a.submission_count, 0)}</div>
              <div className="text-xs text-slate-500 dark:text-white/40">Soumissions</div>
            </div>
          </div>
        </div>

        {/* ── Create Assignment Form ── */}
        {!showCreateForm ? (
          <div className="flex justify-end">
            <Button
              className="h-11 rounded-xl bg-blue-600 px-5 font-semibold text-white shadow-none hover:bg-blue-700"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus size={16} className="mr-2" />
              Nouveau devoir
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#050608]">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
                  <FileText size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Nouveau devoir</h3>
                  <p className="text-xs text-slate-500 dark:text-white/40">Remplissez les informations pour creer un devoir</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="h-8 rounded-lg text-xs"
                onClick={() => { setShowCreateForm(false); setCreateDraft({ ...emptyDraft }) }}
              >
                Annuler
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-white/70">Titre *</label>
                  <input
                    value={createDraft.title}
                    onChange={(e) => setCreateDraft((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Chapitre 3 - Exercices"
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-white/70">Cours *</label>
                  <select
                    value={createDraft.course_id}
                    onChange={(e) => setCreateDraft((prev) => ({ ...prev, course_id: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  >
                    <option value="">Selectionner un cours</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-white/70">Date d'echeance</label>
                  <input
                    type="datetime-local"
                    value={createDraft.due_date}
                    onChange={(e) => setCreateDraft((prev) => ({ ...prev, due_date: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-white/70">Description</label>
                  <textarea
                    value={createDraft.description}
                    onChange={(e) => setCreateDraft((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    placeholder="Instructions du devoir..."
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex flex-col justify-between">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="mb-2 text-xs font-semibold text-slate-500 dark:text-white/40">Apercu</p>
                  <h4 className="mb-1 font-bold text-slate-900 dark:text-white">
                    {createDraft.title || 'Sans titre'}
                  </h4>
                  <p className="mb-2 text-xs text-slate-500 dark:text-white/40">
                    {createDraft.course_id
                      ? courses.find((c) => c.id === Number(createDraft.course_id))?.title ?? 'Cours inconnu'
                      : 'Aucun cours selectionne'}
                  </p>
                  {createDraft.due_date && (
                    <p className="text-xs text-slate-500 dark:text-white/40">
                      Echeance: {new Date(createDraft.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                  {createDraft.description && (
                    <p className="mt-2 text-xs text-slate-600 dark:text-white/60">{createDraft.description}</p>
                  )}
                </div>

                <Button
                  className="mt-4 h-11 w-full rounded-xl bg-blue-600 font-semibold text-white shadow-none hover:bg-blue-700 disabled:opacity-50"
                  disabled={createInstructorAssignment.isPending}
                  onClick={() => void handleCreateAssignment()}
                >
                  {createInstructorAssignment.isPending ? 'Creation...' : 'Ajouter le devoir'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Edit Assignment Form ── */}
        {editingAssignmentId && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-6 dark:border-blue-500/20 dark:bg-blue-500/5">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600">
                  <Edit size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Modifier le devoir</h3>
                  <p className="text-xs text-slate-500 dark:text-white/40">Modifiez les informations du devoir</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="h-8 rounded-lg text-xs"
                onClick={closeEditForm}
              >
                Annuler
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-white/70">Titre *</label>
                  <input
                    value={editDraft.title}
                    onChange={(e) => setEditDraft((prev) => ({ ...prev, title: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-white/70">Cours</label>
                  <select
                    value={editDraft.course_id}
                    onChange={(e) => setEditDraft((prev) => ({ ...prev, course_id: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  >
                    <option value="">Selectionner un cours</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-white/70">Date d'echeance</label>
                  <input
                    type="datetime-local"
                    value={editDraft.due_date}
                    onChange={(e) => setEditDraft((prev) => ({ ...prev, due_date: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-white/70">Description</label>
                  <textarea
                    value={editDraft.description}
                    onChange={(e) => setEditDraft((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    placeholder="Instructions du devoir..."
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex flex-col justify-between">
                <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#050608]">
                  <p className="mb-2 text-xs font-semibold text-slate-500 dark:text-white/40">Apercu</p>
                  <h4 className="mb-1 font-bold text-slate-900 dark:text-white">
                    {editDraft.title || 'Sans titre'}
                  </h4>
                  <p className="mb-2 text-xs text-slate-500 dark:text-white/40">
                    {editDraft.course_id
                      ? courses.find((c) => c.id === Number(editDraft.course_id))?.title ?? 'Cours inconnu'
                      : 'Aucun cours selectionne'}
                  </p>
                  {editDraft.due_date && (
                    <p className="text-xs text-slate-500 dark:text-white/40">
                      Echeance: {new Date(editDraft.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                  {editDraft.description && (
                    <p className="mt-2 text-xs text-slate-600 dark:text-white/60">{editDraft.description}</p>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    className="h-11 flex-1 rounded-xl bg-blue-600 font-semibold text-white shadow-none hover:bg-blue-700 disabled:opacity-50"
                    disabled={updateInstructorAssignment.isPending}
                    onClick={() => void handleUpdateAssignment()}
                  >
                    {updateInstructorAssignment.isPending ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 rounded-xl"
                    onClick={closeEditForm}
                    disabled={updateInstructorAssignment.isPending}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {assignments.map((assignment, i) => {
            const config = statusConfig[assignment.status]
            const progress = assignment.total_students > 0
              ? Math.round((assignment.submission_count / assignment.total_students) * 100)
              : 0

            return (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6 transition-all hover:border-blue-500/30 dark:border-white/5 dark:bg-white/5"
              >
                <div className="mb-4 flex items-start justify-between">
                  <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${config.color} ${config.text}`}>
                    {config.label}
                  </span>
                </div>

                <h4 className="mb-1 font-bold text-slate-900 dark:text-white">{assignment.title}</h4>
                <p className="mb-4 text-xs text-slate-500 dark:text-white/40">{assignment.course_title}</p>

                <div className="mb-3 flex items-center justify-between text-xs text-slate-500 dark:text-white/40">
                  <span>{assignment.submission_count}/{assignment.total_students} soumissions</span>
                  <span>{progress}%</span>
                </div>

                <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full rounded-full bg-blue-600" />
                </div>

                <div className="mb-4 flex items-center justify-between text-xs text-slate-500 dark:text-white/40">
                  <span className="flex items-center gap-1"><Clock size={12} /> Echeance: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString('fr-FR') : 'N/A'}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 flex-1 rounded-lg border-slate-200 text-xs font-semibold text-slate-900 hover:bg-slate-100 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
                    onClick={() => openCorrections(assignment)}
                  >
                    <Eye size={14} className="mr-1" /> Corriger
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 rounded-lg border-slate-200 text-xs font-semibold text-slate-900 hover:bg-slate-100 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
                    onClick={() => openEditForm(assignment)}
                  >
                    <Edit size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 rounded-lg border-slate-200 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-white/10 dark:text-red-400 dark:hover:bg-red-500/10"
                    onClick={() => setDeleteAssignmentId(assignment.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                  <Button size="sm" variant="outline" className="h-9 rounded-lg border-slate-200 text-xs font-semibold text-slate-900 hover:bg-slate-100 dark:border-white/10 dark:text-white dark:hover:bg-white/5">
                    <Download size={14} />
                  </Button>
                </div>
              </motion.div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
          <label className="relative block">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Rechercher un devoir ou un cours"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </label>

          <select
            value={assignmentStatusFilter}
            onChange={(event) => setAssignmentStatusFilter(event.target.value as 'all' | 'draft' | 'active' | 'completed')}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
          >
            <option value="all">Tous les statuts</option>
            <option value="draft">Brouillons</option>
            <option value="active">Actifs</option>
            <option value="completed">Termines</option>
          </select>
        </div>

        {selectedAssignment && (
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#050608]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Corrections - {selectedAssignment.title}</h3>
                <p className="text-xs text-slate-500 dark:text-white/40">{selectedAssignment.course_title}</p>
              </div>
              <Button variant="outline" className="h-9 rounded-lg" onClick={closeCorrections}>Fermer</Button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
              <label className="relative block">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={submissionSearchTerm}
                  onChange={(event) => setSubmissionSearchTerm(event.target.value)}
                  placeholder="Rechercher un etudiant"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </label>

              <select
                value={submissionStatusFilter}
                onChange={(event) => setSubmissionStatusFilter(event.target.value as 'all' | 'submitted' | 'reviewed' | 'rejected')}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
              >
                <option value="all">Tous les statuts</option>
                <option value="submitted">Soumis</option>
                <option value="reviewed">Corriges</option>
                <option value="rejected">A revoir</option>
              </select>
            </div>

            {submissionsQuery.isLoading ? (
              <LoadingState />
            ) : submissionsQuery.isError ? (
              <ErrorState
                message={submissionsQuery.error instanceof Error ? submissionsQuery.error.message : 'Erreur'}
                onRetry={() => void submissionsQuery.refetch()}
              />
            ) : !submissionsQuery.data || submissionsQuery.data.submissions.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-white/50">
                Aucune soumission pour ce devoir.
              </div>
            ) : (
              <div className="space-y-4">
                {submissionsQuery.data.submissions.map((submission) => {
                  const draft = readDraft(submission.id, submission.score, submission.status, submission.instructor_feedback)

                  return (
                    <div key={submission.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{submission.student.name || 'Etudiant'}</p>
                          <p className="text-xs text-slate-500 dark:text-white/40">{submission.student.email ?? 'Sans email'} - {submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString('fr-FR') : '-'}</p>
                        </div>
                        <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                          {submission.status}
                        </span>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={draft.score}
                          onChange={(event) => patchDraft(submission.id, submission, { score: event.target.value })}
                          placeholder="Note /100"
                          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                        />

                        <select
                          value={draft.status}
                          onChange={(event) => patchDraft(submission.id, submission, { status: event.target.value as 'reviewed' | 'rejected' })}
                          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                        >
                          <option value="reviewed">Valider</option>
                          <option value="rejected">Demander revision</option>
                        </select>

                        <Button
                          className="h-10 rounded-lg bg-blue-600 text-white shadow-none hover:bg-blue-700"
                          disabled={gradeSubmission.isPending}
                          onClick={() => void handleGrade(selectedAssignment.id, submission.id, submission)}
                        >
                          <Send size={14} className="mr-1" /> Enregistrer
                        </Button>
                      </div>

                      <textarea
                        value={draft.feedback}
                        onChange={(event) => patchDraft(submission.id, submission, { feedback: event.target.value })}
                        rows={2}
                        placeholder="Feedback pour l'etudiant"
                        className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                      />

                      {submission.student_attachments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs font-semibold text-slate-700 dark:text-white/80">Fichiers etudiant</p>
                          <div className="flex flex-wrap gap-2">
                            {submission.student_attachments.map((attachment) => (
                              <a
                                key={`${submission.id}-${attachment.path}`}
                                href={attachment.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                              >
                                <Download size={12} /> {attachment.name}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-semibold text-slate-700 dark:text-white/80">Pieces jointes de correction</p>
                        <input
                          type="file"
                          multiple
                          onChange={(event) => {
                            const files = Array.from(event.target.files ?? [])
                            patchDraft(submission.id, submission, {
                              correctionFiles: [...draft.correctionFiles, ...files].slice(0, 5),
                            })
                            event.target.value = ''
                          }}
                          className="block w-full cursor-pointer text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-200 file:px-2 file:py-1 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-300 dark:text-white/60 dark:file:bg-white/10 dark:file:text-white"
                        />

                        {draft.correctionFiles.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {draft.correctionFiles.map((file, index) => (
                              <button
                                key={`${submission.id}-draft-file-${file.name}-${index}`}
                                type="button"
                                className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                                onClick={() => {
                                  patchDraft(submission.id, submission, {
                                    correctionFiles: draft.correctionFiles.filter((_, fileIndex) => fileIndex !== index),
                                  })
                                }}
                              >
                                {file.name}
                              </button>
                            ))}
                          </div>
                        )}

                        {submission.correction_attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {submission.correction_attachments.map((attachment) => (
                              <a
                                key={`${submission.id}-correction-${attachment.path}`}
                                href={attachment.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                              >
                                <Download size={12} /> {attachment.name}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <Button
            className="h-12 rounded-xl bg-blue-600 px-6 font-semibold text-white shadow-none hover:bg-blue-700"
            onClick={() => navigate(dashboardPaths.instructorCourses)}
          >
            <Plus size={18} className="mr-2" />
            Gerer les cours
          </Button>
        </div>

        {/* ── Delete Confirmation Modal ── */}
        <ConfirmationModal
          open={deleteAssignmentId !== null}
          title="Supprimer le devoir"
          description="Etes-vous sur de vouloir supprimer ce devoir ? Cette action est irreversible."
          confirmLabel="Supprimer"
          cancelLabel="Annuler"
          confirmVariant="danger"
          isPending={deleteInstructorAssignment.isPending}
          onConfirm={() => void handleDeleteAssignment()}
          onCancel={() => setDeleteAssignmentId(null)}
        />
      </div>
    </DashboardShell>
  )
}

export default InstructorAssignmentsPage

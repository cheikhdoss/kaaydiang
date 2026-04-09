import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  Circle,
  Edit3,
  Eye,
  FileEdit,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
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
import { useInstructorCourses } from '../hooks/useInstructorCourses'
import {
  useCreateInstructorQuiz,
  useDeleteInstructorQuiz,
  useInstructorQuizzes,
  useUpdateInstructorQuiz,
  useQuizQuestions,
  useCreateQuizQuestion,
  useUpdateQuizQuestion,
  useDeleteQuizQuestion,
  useCreateQuizOption,
  useUpdateQuizOption,
  useDeleteQuizOption,
} from '../hooks/useInstructorSupplements'
import type {
  DashboardRole,
  InstructorQuizItem,
  QuizQuestionItem,
  QuizOptionItem,
  CreateQuizQuestionPayload,
} from '../services/dashboard.api'

type QuizStatusMeta = {
  icon: LucideIcon
  color: string
  text: string
  label: string
}

type SelectPrimitiveValue = string | number

type SelectOption<T extends SelectPrimitiveValue> = {
  value: T
  label: string
}

interface SelectFieldProps<T extends SelectPrimitiveValue> {
  value: T
  options: Array<SelectOption<T>>
  onChange: (value: T) => void
  placeholder?: string
  disabled?: boolean
}

type QuestionType = QuizQuestionItem['question_type']

type OptionDraft = {
  id: string
  text: string
  is_correct: boolean
}

type QuestionDraft = {
  question_text: string
  question_type: QuestionType
  points: string
  true_false_correct: 'true' | 'false'
  options: OptionDraft[]
}

const statusConfig: Record<string, QuizStatusMeta> = {
  active: {
    icon: CheckCircle,
    color: 'bg-emerald-50 dark:bg-emerald-400/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    label: 'Actif',
  },
  draft: {
    icon: Edit3,
    color: 'bg-amber-50 dark:bg-amber-400/10',
    text: 'text-amber-600 dark:text-amber-400',
    label: 'Brouillon',
  },
  completed: {
    icon: Eye,
    color: 'bg-slate-50 dark:bg-slate-400/10',
    text: 'text-slate-600 dark:text-slate-400',
    label: 'Termine',
  },
}

const questionTypeLabels: Record<QuestionType, string> = {
  multiple_choice: 'Choix multiple',
  true_false: 'Vrai / Faux',
  short_answer: 'Reponse courte',
}

const fieldBaseClassName =
  'h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100'

const textAreaClassName =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100'

const randomId = () => `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`

const makeOptionDraft = (): OptionDraft => ({
  id: randomId(),
  text: '',
  is_correct: false,
})

const makeDefaultQuestionDraft = (): QuestionDraft => ({
  question_text: '',
  question_type: 'multiple_choice',
  points: '1',
  true_false_correct: 'true',
  options: [makeOptionDraft(), makeOptionDraft()],
})

const parsePercent = (value: string, fallback = 60) => {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(0, Math.min(100, parsed))
}

function SelectField<T extends SelectPrimitiveValue>({
  value,
  options,
  onChange,
  placeholder,
  disabled,
}: SelectFieldProps<T>) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const selectedOption = options.find((option) => option.value === value)

  useEffect(() => {
    if (!open) return

    const onMouseDown = (event: MouseEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onEscape)

    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onEscape)
    }
  }, [open])

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((previous) => !previous)}
        className={`${fieldBaseClassName} flex items-center justify-between ${disabled ? 'opacity-60' : ''}`}
      >
        <span className="truncate text-left">{selectedOption?.label ?? placeholder ?? 'Selectionner'}</span>
        <ChevronDown size={16} className={`ml-2 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div className="absolute z-40 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-2xl dark:border-white/10 dark:bg-[#0a0d12]">
          {options.map((option) => {
            const isSelected = option.value === value

            return (
              <button
                type="button"
                key={`${option.value}`}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10'
                }`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected ? <CheckCircle2 size={14} /> : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

const InstructorQuizPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'active' | 'completed'>('all')
  const [courseFilter, setCourseFilter] = useState<'all' | number>('all')

  const [createDraft, setCreateDraft] = useState({ title: '', description: '', course_id: '', pass_score: '60' })
  const [editDraft, setEditDraft] = useState({ title: '', description: '', course_id: '', pass_score: '60' })

  const [editorQuizId, setEditorQuizId] = useState<number | null>(null)
  const [deleteQuizId, setDeleteQuizId] = useState<number | null>(null)
  const [deleteQuestionState, setDeleteQuestionState] = useState<QuizQuestionItem | null>(null)

  const [questionDraft, setQuestionDraft] = useState<QuestionDraft>(makeDefaultQuestionDraft)
  const [newOptionByQuestion, setNewOptionByQuestion] = useState<Record<number, { text: string; is_correct: boolean }>>({})

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const quizFilters = useMemo(() => {
    const next: { search?: string; status?: 'draft' | 'active' | 'completed'; course_id?: number } = {}

    const trimmedSearch = searchTerm.trim()
    if (trimmedSearch !== '') next.search = trimmedSearch
    if (statusFilter !== 'all') next.status = statusFilter
    if (courseFilter !== 'all') next.course_id = courseFilter

    return next
  }, [courseFilter, searchTerm, statusFilter])

  const { data: quizzes = [], isLoading, isError, error, refetch } = useInstructorQuizzes(quizFilters)
  const { data: courses = [] } = useInstructorCourses()

  const selectedQuiz = useMemo(
    () => quizzes.find((quiz) => quiz.id === editorQuizId) ?? null,
    [editorQuizId, quizzes],
  )

  const {
    data: questions = [],
    isLoading: questionsLoading,
    isError: questionsIsError,
    error: questionsError,
    refetch: refetchQuestions,
  } = useQuizQuestions(selectedQuiz?.id ?? null)

  const createQuiz = useCreateInstructorQuiz()
  const updateQuiz = useUpdateInstructorQuiz()
  const deleteQuiz = useDeleteInstructorQuiz()
  const createQuestion = useCreateQuizQuestion()
  const updateQuestion = useUpdateQuizQuestion()
  const deleteQuestion = useDeleteQuizQuestion()
  const createOption = useCreateQuizOption()
  const updateOption = useUpdateQuizOption()
  const deleteOption = useDeleteQuizOption()

  const activeCount = quizzes.filter((quiz) => quiz.status === 'active').length
  const createPassScoreValue = parsePercent(createDraft.pass_score)
  const sortedQuestions = useMemo(() => [...questions].sort((a, b) => a.order - b.order), [questions])

  const createCourseOptions = useMemo<Array<SelectOption<string>>>(
    () => [{ value: '', label: 'Selectionner un cours' }, ...courses.map((course) => ({ value: String(course.id), label: course.title }))],
    [courses],
  )

  const filterCourseOptions = useMemo<Array<SelectOption<'all' | number>>>(
    () => [{ value: 'all', label: 'Tous les cours' }, ...courses.map((course) => ({ value: course.id, label: course.title }))],
    [courses],
  )

  const statusOptions: Array<SelectOption<'all' | 'draft' | 'active' | 'completed'>> = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'draft', label: 'Brouillons' },
    { value: 'active', label: 'Actifs' },
    { value: 'completed', label: 'Termines' },
  ]

  const questionTypeOptions: Array<SelectOption<QuestionType>> = [
    { value: 'multiple_choice', label: 'Choix multiple' },
    { value: 'true_false', label: 'Vrai / Faux' },
    { value: 'short_answer', label: 'Reponse courte' },
  ]

  if (!user) return <LoadingState fullscreen />
  if (isLoading) return <LoadingState fullscreen />
  if (isError) {
    return <ErrorState message={error instanceof Error ? error.message : 'Erreur'} onRetry={() => void refetch()} />
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const handleNavigateRole = (role: DashboardRole) => {
    navigate(resolveRoleDashboardPath(role))
  }

  const parseQuizDraft = (draft: { title: string; course_id: string; pass_score: string }) => {
    const courseId = Number.parseInt(draft.course_id, 10)
    const passScore = Number.parseInt(draft.pass_score, 10)

    if (!draft.title.trim() || !Number.isFinite(courseId) || courseId <= 0) {
      return { ok: false as const, message: 'Veuillez saisir un titre et selectionner un cours.' }
    }

    if (!Number.isFinite(passScore) || passScore < 0 || passScore > 100) {
      return { ok: false as const, message: 'Le score de validation doit etre entre 0 et 100.' }
    }

    return { ok: true as const, courseId, passScore }
  }

  const openQuizEditor = (quiz: InstructorQuizItem) => {
    setEditorQuizId(quiz.id)
    setEditDraft({
      title: quiz.title,
      description: quiz.description ?? '',
      course_id: String(quiz.course_id),
      pass_score: String(quiz.pass_score),
    })
    setQuestionDraft(makeDefaultQuestionDraft())
    setNewOptionByQuestion({})
    setFeedback(null)
  }

  const handleCreateQuiz = async () => {
    setFeedback(null)
    const parsed = parseQuizDraft(createDraft)

    if (!parsed.ok) {
      setFeedback({ type: 'error', message: parsed.message })
      return
    }

    try {
      await createQuiz.mutateAsync({
        title: createDraft.title.trim(),
        description: createDraft.description.trim() || null,
        course_id: parsed.courseId,
        pass_score: parsed.passScore,
      })

      setCreateDraft({ title: '', description: '', course_id: '', pass_score: '60' })
      setFeedback({ type: 'success', message: 'Quiz cree avec succes. Ajoutez maintenant vos questions.' })
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Creation impossible.' })
    }
  }

  const handleSaveQuiz = async () => {
    if (!selectedQuiz) return

    setFeedback(null)
    const parsed = parseQuizDraft(editDraft)

    if (!parsed.ok) {
      setFeedback({ type: 'error', message: parsed.message })
      return
    }

    try {
      await updateQuiz.mutateAsync({
        quizId: selectedQuiz.id,
        payload: {
          title: editDraft.title.trim(),
          description: editDraft.description.trim() || null,
          course_id: parsed.courseId,
          pass_score: parsed.passScore,
        },
      })

      setFeedback({ type: 'success', message: 'Quiz mis a jour.' })
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Mise a jour impossible.' })
    }
  }

  const confirmDeleteQuiz = async () => {
    if (!deleteQuizId) return

    setFeedback(null)

    try {
      await deleteQuiz.mutateAsync(deleteQuizId)
      if (editorQuizId === deleteQuizId) {
        setEditorQuizId(null)
      }
      setDeleteQuizId(null)
      setFeedback({ type: 'success', message: 'Quiz supprime.' })
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Suppression impossible.' })
    }
  }

  const updateDraftOption = (optionId: string, patch: Partial<OptionDraft>) => {
    setQuestionDraft((previous) => ({
      ...previous,
      options: previous.options.map((option) => (option.id === optionId ? { ...option, ...patch } : option)),
    }))
  }

  const addDraftOption = () => {
    setQuestionDraft((previous) => ({ ...previous, options: [...previous.options, makeOptionDraft()] }))
  }

  const removeDraftOption = (optionId: string) => {
    setQuestionDraft((previous) => ({
      ...previous,
      options: previous.options.filter((option) => option.id !== optionId),
    }))
  }

  const handleCreateQuestion = async () => {
    if (!selectedQuiz) return

    const questionText = questionDraft.question_text.trim()
    if (questionText === '') {
      setFeedback({ type: 'error', message: 'Le texte de la question est requis.' })
      return
    }

    const points = Number.parseInt(questionDraft.points, 10)
    if (!Number.isFinite(points) || points < 1) {
      setFeedback({ type: 'error', message: 'Le nombre de points doit etre superieur ou egal a 1.' })
      return
    }

    const payload: CreateQuizQuestionPayload = {
      question_text: questionText,
      question_type: questionDraft.question_type,
      points,
    }

    if (questionDraft.question_type === 'multiple_choice') {
      const normalizedOptions = questionDraft.options
        .map((option, index) => ({
          option_text: option.text.trim(),
          is_correct: option.is_correct,
          order: index,
        }))
        .filter((option) => option.option_text !== '')

      if (normalizedOptions.length < 2) {
        setFeedback({ type: 'error', message: 'Ajoutez au moins deux options pour une question a choix multiple.' })
        return
      }

      if (!normalizedOptions.some((option) => option.is_correct)) {
        setFeedback({ type: 'error', message: 'Selectionnez au moins une bonne reponse.' })
        return
      }

      payload.options = normalizedOptions
    }

    if (questionDraft.question_type === 'true_false') {
      payload.options = [
        { option_text: 'Vrai', is_correct: questionDraft.true_false_correct === 'true', order: 0 },
        { option_text: 'Faux', is_correct: questionDraft.true_false_correct === 'false', order: 1 },
      ]
    }

    try {
      await createQuestion.mutateAsync({ quizId: selectedQuiz.id, payload })
      setQuestionDraft(makeDefaultQuestionDraft())
      setFeedback({ type: 'success', message: 'Question ajoutee au quiz.' })
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Ajout de la question impossible.' })
    }
  }

  const handleMoveQuestion = async (question: QuizQuestionItem, direction: 'up' | 'down') => {
    const currentIndex = sortedQuestions.findIndex((item) => item.id === question.id)
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= sortedQuestions.length) return

    const targetQuestion = sortedQuestions[targetIndex]

    try {
      await Promise.all([
        updateQuestion.mutateAsync({ questionId: question.id, payload: { order: targetQuestion.order } }),
        updateQuestion.mutateAsync({ questionId: targetQuestion.id, payload: { order: question.order } }),
      ])
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Reorganisation impossible.' })
    }
  }

  const confirmDeleteQuestion = async () => {
    if (!deleteQuestionState) return

    try {
      await deleteQuestion.mutateAsync(deleteQuestionState.id)
      setDeleteQuestionState(null)
      setFeedback({ type: 'success', message: 'Question supprimee.' })
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Suppression impossible.' })
    }
  }

  const setNewOptionDraft = (questionId: number, patch: Partial<{ text: string; is_correct: boolean }>) => {
    setNewOptionByQuestion((previous) => ({
      ...previous,
      [questionId]: {
        text: previous[questionId]?.text ?? '',
        is_correct: previous[questionId]?.is_correct ?? false,
        ...patch,
      },
    }))
  }

  const handleCreateOption = async (questionId: number) => {
    const draft = newOptionByQuestion[questionId]
    if (!draft || draft.text.trim() === '') return

    try {
      await createOption.mutateAsync({
        questionId,
        payload: {
          option_text: draft.text.trim(),
          is_correct: draft.is_correct,
        },
      })

      setNewOptionByQuestion((previous) => {
        const next = { ...previous }
        delete next[questionId]
        return next
      })
      setFeedback({ type: 'success', message: 'Option ajoutee.' })
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Ajout de l\'option impossible.' })
    }
  }

  const handleToggleOptionCorrect = async (question: QuizQuestionItem, option: QuizOptionItem) => {
    try {
      if (question.question_type === 'true_false') {
        await Promise.all(
          question.options.map((currentOption) =>
            updateOption.mutateAsync({
              optionId: currentOption.id,
              payload: { is_correct: currentOption.id === option.id },
            }),
          ),
        )
        return
      }

      await updateOption.mutateAsync({
        optionId: option.id,
        payload: { is_correct: !option.is_correct },
      })
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Mise a jour de l\'option impossible.' })
    }
  }

  const handleDeleteOption = async (optionId: number) => {
    try {
      await deleteOption.mutateAsync(optionId)
      setFeedback({ type: 'success', message: 'Option supprimee.' })
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Suppression de l\'option impossible.' })
    }
  }

  return (
    <DashboardShell
      title="Quiz"
      subtitle={`${activeCount} quiz actif${activeCount > 1 ? 's' : ''}`}
      role="instructor"
      viewerRole={user.role}
      userName={`${user.first_name} ${user.last_name}`}
      userEmail={user.email}
      onLogout={handleLogout}
      onNavigateRole={handleNavigateRole}
    >
      <div className="space-y-6">
        {feedback ? <ActionFeedback type={feedback.type} message={feedback.message} /> : null}

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
              <Plus size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Nouveau quiz</h3>
              <p className="text-xs text-slate-500 dark:text-white/40">
                Etape 1: creez le quiz. Etape 2: ajoutez les questions dans le panneau de configuration.
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-3">
              <label className="block space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-white/50">Titre</span>
                <input
                  value={createDraft.title}
                  onChange={(event) => setCreateDraft((previous) => ({ ...previous, title: event.target.value }))}
                  placeholder="Ex: Evaluation module 2"
                  className={fieldBaseClassName}
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-white/50">Cours associe</span>
                <SelectField
                  value={createDraft.course_id}
                  options={createCourseOptions}
                  onChange={(value) => setCreateDraft((previous) => ({ ...previous, course_id: value }))}
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-white/50">Description</span>
                <textarea
                  value={createDraft.description}
                  onChange={(event) => setCreateDraft((previous) => ({ ...previous, description: event.target.value }))}
                  rows={3}
                  placeholder="Contexte, objectifs, consignes"
                  className={textAreaClassName}
                />
              </label>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-black/20">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-white/50">Score de validation</p>
                <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                  {createPassScoreValue}%
                </span>
              </div>

              <input
                value={createDraft.pass_score}
                onChange={(event) => setCreateDraft((previous) => ({ ...previous, pass_score: event.target.value }))}
                type="number"
                min={0}
                max={100}
                className={fieldBaseClassName}
              />

              <input
                type="range"
                min={0}
                max={100}
                value={createPassScoreValue}
                onChange={(event) => setCreateDraft((previous) => ({ ...previous, pass_score: event.target.value }))}
                className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600 dark:bg-white/10"
              />
            </div>
          </div>

          <Button
            className="mt-4 h-10 rounded-xl bg-blue-600 text-white shadow-none hover:bg-blue-700"
            disabled={createQuiz.isPending}
            onClick={() => void handleCreateQuiz()}
          >
            <Plus size={14} className="mr-1" /> Ajouter le quiz
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
              <FileEdit size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{quizzes.length} quiz</h3>
              <p className="text-xs text-slate-500 dark:text-white/40">{activeCount} actifs</p>
            </div>
          </div>

          <Button
            className="h-12 rounded-xl bg-blue-600 px-6 font-semibold text-white shadow-none hover:bg-blue-700"
            onClick={() => navigate(dashboardPaths.instructorCourses)}
          >
            <Plus size={18} className="mr-2" /> Gerer les cours
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px_220px]">
          <label className="relative block">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Rechercher un quiz, un cours"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100"
            />
          </label>

          <SelectField value={statusFilter} options={statusOptions} onChange={setStatusFilter} />

          <SelectField value={courseFilter} options={filterCourseOptions} onChange={setCourseFilter} />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {quizzes.map((quiz, index) => {
            const config = statusConfig[quiz.status]
            const StatusIcon = config.icon

            return (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6 transition-all hover:border-blue-500/30 dark:border-white/10 dark:bg-white/5"
              >
                <div className="mb-4 flex items-start justify-between">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${config.color} ${config.text}`}>
                    <StatusIcon size={10} /> {config.label}
                  </span>
                </div>

                <h4 className="mb-1 font-bold text-slate-900 dark:text-white">{quiz.title}</h4>
                <p className="mb-2 text-xs text-slate-500 dark:text-white/40">{quiz.course_title}</p>
                <p className="mb-4 text-xs text-slate-500 dark:text-white/50">{quiz.description || 'Sans description'}</p>

                <div className="mb-4 grid grid-cols-4 gap-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-slate-900 dark:text-white">{quiz.question_count}</div>
                    <div className="text-[10px] uppercase text-slate-500 dark:text-white/40">Questions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-slate-900 dark:text-white">{quiz.attempt_count}</div>
                    <div className="text-[10px] uppercase text-slate-500 dark:text-white/40">Tentatives</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-bold ${quiz.average_score >= 70 ? 'text-emerald-600' : quiz.average_score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                      {quiz.average_score}%
                    </div>
                    <div className="text-[10px] uppercase text-slate-500 dark:text-white/40">Moyenne</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{quiz.pass_score}%</div>
                    <div className="text-[10px] uppercase text-slate-500 dark:text-white/40">Validation</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 flex-1 rounded-lg border-slate-200 text-xs font-semibold text-slate-900 hover:bg-slate-100 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
                    onClick={() => openQuizEditor(quiz)}
                  >
                    <Edit3 size={14} className="mr-1" /> Configurer
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 rounded-lg border-slate-200 text-xs font-semibold text-slate-900 hover:bg-slate-100 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
                    onClick={() => navigate(dashboardPaths.instructorStats)}
                  >
                    <Eye size={14} className="mr-1" /> Stats
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 rounded-lg border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50"
                    onClick={() => setDeleteQuizId(quiz.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </motion.div>
            )
          })}
        </div>

        {selectedQuiz ? (
          <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#050608]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Configuration du quiz</h3>
                <p className="text-xs text-slate-500 dark:text-white/50">{selectedQuiz.title}</p>
              </div>
              <Button variant="outline" className="h-10 rounded-xl" onClick={() => setEditorQuizId(null)}>
                Fermer
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={editDraft.title}
                onChange={(event) => setEditDraft((previous) => ({ ...previous, title: event.target.value }))}
                placeholder="Titre du quiz"
                className={fieldBaseClassName}
              />

              <SelectField
                value={editDraft.course_id}
                options={createCourseOptions}
                onChange={(value) => setEditDraft((previous) => ({ ...previous, course_id: value }))}
              />

              <input
                value={editDraft.pass_score}
                onChange={(event) => setEditDraft((previous) => ({ ...previous, pass_score: event.target.value }))}
                type="number"
                min={0}
                max={100}
                placeholder="Score de validation"
                className={fieldBaseClassName}
              />

              <textarea
                value={editDraft.description}
                onChange={(event) => setEditDraft((previous) => ({ ...previous, description: event.target.value }))}
                rows={2}
                placeholder="Description"
                className={textAreaClassName}
              />
            </div>

            <div className="flex gap-2">
              <Button
                className="h-10 rounded-xl bg-blue-600 text-white shadow-none hover:bg-blue-700"
                onClick={() => void handleSaveQuiz()}
                disabled={updateQuiz.isPending}
              >
                Enregistrer le quiz
              </Button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Questions ({sortedQuestions.length})</h4>
                {questionsLoading ? <span className="text-xs text-slate-500 dark:text-white/50">Chargement...</span> : null}
              </div>

              {questionsIsError ? (
                <ErrorState
                  message={questionsError instanceof Error ? questionsError.message : 'Impossible de charger les questions.'}
                  onRetry={() => void refetchQuestions()}
                />
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-black/20">
                    <h5 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-white/50">
                      Ajouter une question
                    </h5>

                    <textarea
                      value={questionDraft.question_text}
                      onChange={(event) => setQuestionDraft((previous) => ({ ...previous, question_text: event.target.value }))}
                      rows={3}
                      placeholder="Texte de la question"
                      className={`${textAreaClassName} mb-3`}
                    />

                    <div className="grid gap-3 md:grid-cols-[220px_140px_1fr]">
                      <SelectField
                        value={questionDraft.question_type}
                        options={questionTypeOptions}
                        onChange={(value) =>
                          setQuestionDraft((previous) => ({
                            ...previous,
                            question_type: value,
                            options: value === 'multiple_choice' ? previous.options : previous.options,
                          }))
                        }
                      />

                      <input
                        value={questionDraft.points}
                        onChange={(event) => setQuestionDraft((previous) => ({ ...previous, points: event.target.value }))}
                        type="number"
                        min={1}
                        className={fieldBaseClassName}
                        placeholder="Points"
                      />

                      {questionDraft.question_type === 'true_false' ? (
                        <SelectField
                          value={questionDraft.true_false_correct}
                          options={[
                            { value: 'true', label: 'Bonne reponse: Vrai' },
                            { value: 'false', label: 'Bonne reponse: Faux' },
                          ]}
                          onChange={(value) => setQuestionDraft((previous) => ({ ...previous, true_false_correct: value }))}
                        />
                      ) : (
                        <div className="text-xs text-slate-500 dark:text-white/50">
                          {questionDraft.question_type === 'short_answer'
                            ? 'Reponse texte libre cote apprenant.'
                            : 'Selectionnez la ou les bonnes options.'}
                        </div>
                      )}
                    </div>

                    {questionDraft.question_type === 'multiple_choice' ? (
                      <div className="mt-4 space-y-2">
                        {questionDraft.options.map((option) => (
                          <div key={option.id} className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
                            <input
                              value={option.text}
                              onChange={(event) => updateDraftOption(option.id, { text: event.target.value })}
                              placeholder="Texte de l'option"
                              className={fieldBaseClassName}
                            />

                            <Button
                              type="button"
                              variant={option.is_correct ? 'default' : 'outline'}
                              className="h-10 rounded-xl"
                              onClick={() => updateDraftOption(option.id, { is_correct: !option.is_correct })}
                            >
                              {option.is_correct ? 'Bonne reponse' : 'Marquer correcte'}
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              className="h-10 rounded-xl border-red-200 text-red-600"
                              onClick={() => removeDraftOption(option.id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        ))}

                        <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={addDraftOption}>
                          <Plus size={14} className="mr-1" /> Ajouter une option
                        </Button>
                      </div>
                    ) : null}

                    <Button
                      type="button"
                      className="mt-4 h-10 rounded-xl bg-blue-600 text-white shadow-none hover:bg-blue-700"
                      disabled={createQuestion.isPending}
                      onClick={() => void handleCreateQuestion()}
                    >
                      <Plus size={14} className="mr-1" /> Ajouter la question
                    </Button>
                  </div>

                  {sortedQuestions.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-white/20 dark:text-white/50">
                      Aucune question pour ce quiz. Commencez par en ajouter une.
                    </div>
                  ) : (
                    sortedQuestions.map((question, index) => {
                      const optionDraft = newOptionByQuestion[question.id] ?? { text: '', is_correct: false }

                      return (
                        <div key={question.id} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-black/20">
                          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:bg-white/10 dark:text-white/70">
                                Q{index + 1}
                              </span>
                              <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                                {questionTypeLabels[question.question_type]}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-white/50">{question.points} point(s)</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-lg"
                                onClick={() => void handleMoveQuestion(question, 'up')}
                                disabled={index === 0 || updateQuestion.isPending}
                              >
                                Haut
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-lg"
                                onClick={() => void handleMoveQuestion(question, 'down')}
                                disabled={index === sortedQuestions.length - 1 || updateQuestion.isPending}
                              >
                                Bas
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-lg border-red-200 text-red-600 hover:bg-red-50"
                                onClick={() => setDeleteQuestionState(question)}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </div>

                          <p className="mb-3 text-sm font-medium text-slate-900 dark:text-slate-100">{question.question_text}</p>

                          {question.options.length > 0 ? (
                            <div className="space-y-2">
                              {question.options.map((option) => (
                                <div
                                  key={option.id}
                                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-white/10"
                                >
                                  <button
                                    type="button"
                                    onClick={() => void handleToggleOptionCorrect(question, option)}
                                    className="flex items-center gap-2 text-left text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white"
                                  >
                                    {option.is_correct ? (
                                      <CheckCircle2 size={14} className="text-emerald-500" />
                                    ) : (
                                      <Circle size={14} className="text-slate-400" />
                                    )}
                                    <span>{option.option_text}</span>
                                  </button>

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 rounded-md border-red-200 text-red-600 hover:bg-red-50"
                                    onClick={() => void handleDeleteOption(option.id)}
                                  >
                                    <Trash2 size={12} />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 dark:text-white/50">Aucune option (reponse libre).</p>
                          )}

                          {question.question_type === 'multiple_choice' ? (
                            <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto_auto]">
                              <input
                                value={optionDraft.text}
                                onChange={(event) => setNewOptionDraft(question.id, { text: event.target.value })}
                                placeholder="Nouvelle option"
                                className={fieldBaseClassName}
                              />

                              <Button
                                type="button"
                                variant={optionDraft.is_correct ? 'default' : 'outline'}
                                className="h-10 rounded-xl"
                                onClick={() => setNewOptionDraft(question.id, { is_correct: !optionDraft.is_correct })}
                              >
                                {optionDraft.is_correct ? 'Correcte' : 'Marquer correcte'}
                              </Button>

                              <Button
                                type="button"
                                variant="outline"
                                className="h-10 rounded-xl"
                                onClick={() => void handleCreateOption(question.id)}
                              >
                                <Plus size={14} className="mr-1" /> Ajouter option
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <ConfirmationModal
        open={deleteQuizId !== null}
        title="Supprimer ce quiz ?"
        description="Le quiz sera supprime definitivement ainsi que ses questions associees."
        confirmLabel="Supprimer"
        isPending={deleteQuiz.isPending}
        onConfirm={() => void confirmDeleteQuiz()}
        onCancel={() => {
          if (!deleteQuiz.isPending) {
            setDeleteQuizId(null)
          }
        }}
      />

      <ConfirmationModal
        open={deleteQuestionState !== null}
        title="Supprimer cette question ?"
        description="Cette action retire aussi les options de la question."
        confirmLabel="Supprimer"
        isPending={deleteQuestion.isPending}
        onConfirm={() => void confirmDeleteQuestion()}
        onCancel={() => {
          if (!deleteQuestion.isPending) {
            setDeleteQuestionState(null)
          }
        }}
      />
    </DashboardShell>
  )
}

export default InstructorQuizPage

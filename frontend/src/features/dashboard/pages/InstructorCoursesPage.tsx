import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  ChevronLeft,
  Edit3,
  FileText,
  Layers,
  Plus,
  Send,
  Trash2,
  Upload,
  X,
  Image as ImageIcon,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { LessonEditor } from '@/components/lesson-blocks/LessonEditor'
import { resolveRoleDashboardPath } from '../utils/navigation'
import { DashboardShell } from '../components/DashboardShell'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { ActionFeedback } from '../components/ActionFeedback'
import { ConfirmationModal } from '../components/ConfirmationModal'
import { useDashboardData } from '../hooks/useDashboardData'
import {
  useCreateInstructorChapter,
  useCreateInstructorCourse,
  useCreateInstructorLesson,
  useDeleteInstructorChapter,
  useDeleteInstructorCourse,
  useDeleteInstructorLesson,
  useInstructorCourseDetail,
  useInstructorCourses,
  usePublishInstructorCourse,
  useReorderInstructorChapters,
  useReorderInstructorLessons,
  useUploadInstructorLessonBlockPdf,
  useUploadInstructorChapterAsset,
  useUpdateInstructorChapter,
  useUpdateInstructorCourse,
  useUpdateInstructorLesson,
} from '../hooks/useInstructorCourses'
import type {
  DashboardRole,
  InstructorCourseDetailChapterItem,
  InstructorCourseDetailLessonItem,
  UpsertLessonPayload,
} from '../services/dashboard.api'

type CourseLevel = 'beginner' | 'intermediate' | 'advanced'

interface LessonDraftState {
  title: string
  description: string
  videoUrl: string
  duration: string
  isFree: boolean
}

type DeleteTarget =
  | { kind: 'course'; id: number }
  | { kind: 'chapter'; id: number }
  | { kind: 'lesson'; id: number }

const INITIAL_LESSON_DRAFT: LessonDraftState = {
  title: '',
  description: '',
  videoUrl: '',
  duration: '0',
  isFree: false,
}

const InstructorCoursesPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const { data, isLoading, isError, error, refetch } = useDashboardData('instructor')
  const { data: courses = [], isLoading: coursesLoading } = useInstructorCourses()

  const createCourse = useCreateInstructorCourse()
  const publishCourse = usePublishInstructorCourse()
  const updateCourse = useUpdateInstructorCourse()
  const deleteCourse = useDeleteInstructorCourse()

  const createChapter = useCreateInstructorChapter()
  const updateChapter = useUpdateInstructorChapter()
  const deleteChapter = useDeleteInstructorChapter()

  const createLesson = useCreateInstructorLesson()
  const reorderChapters = useReorderInstructorChapters()
  const reorderLessons = useReorderInstructorLessons()
  const uploadChapterAsset = useUploadInstructorChapterAsset()
  const uploadLessonBlockPdf = useUploadInstructorLessonBlockPdf()
  const updateLesson = useUpdateInstructorLesson()
  const deleteLesson = useDeleteInstructorLesson()

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [editorCourseId, setEditorCourseId] = useState<number | null>(null)

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createDraft, setCreateDraft] = useState<{ title: string; description: string; level: CourseLevel; price: string; thumbnail: File | null }>({
    title: '',
    description: '',
    level: 'beginner',
    price: '0',
    thumbnail: null,
  })
  const [createThumbnailPreview, setCreateThumbnailPreview] = useState<string | null>(null)

  const courseDetailQuery = useInstructorCourseDetail(editorCourseId)
  const courseDetail = courseDetailQuery.data

  const [courseTitle, setCourseTitle] = useState('')
  const [courseDescription, setCourseDescription] = useState('')
  const [courseLevel, setCourseLevel] = useState<CourseLevel>('beginner')
  const [coursePrice, setCoursePrice] = useState('0')
  const [courseThumbnail, setCourseThumbnail] = useState<File | null>(null)
  const [courseThumbnailPreview, setCourseThumbnailPreview] = useState<string | null>(null)

  const [newChapterTitle, setNewChapterTitle] = useState('')
  const [newChapterDescription, setNewChapterDescription] = useState('')
  const [editingChapterId, setEditingChapterId] = useState<number | null>(null)
  const [chapterDraftTitle, setChapterDraftTitle] = useState('')
  const [chapterDraftDescription, setChapterDraftDescription] = useState('')

  const [newLessonDrafts, setNewLessonDrafts] = useState<Record<number, LessonDraftState>>({})
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null)
  const [editingLessonDraft, setEditingLessonDraft] = useState<LessonDraftState>(INITIAL_LESSON_DRAFT)
  const [uploadingChapterId, setUploadingChapterId] = useState<number | null>(null)
  const [uploadProgressByChapter, setUploadProgressByChapter] = useState<Record<number, number>>({})
  const [uploadErrorByChapter, setUploadErrorByChapter] = useState<Record<number, string>>({})
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [visualEditorMode, setVisualEditorMode] = useState(false)
  const [visualEditorChapterId, setVisualEditorChapterId] = useState<number | null>(null)
  const [visualEditorLessonId, setVisualEditorLessonId] = useState<number | null>(null)

  const resetEditor = () => {
    setEditorCourseId(null)
    setEditingChapterId(null)
    setEditingLessonId(null)
    setCourseThumbnail(null)
    setCourseThumbnailPreview(null)
    setVisualEditorMode(false)
    setVisualEditorChapterId(null)
    setVisualEditorLessonId(null)
  }

  const openVisualEditor = (chapterId: number, lessonId: number | null) => {
    setVisualEditorMode(true)
    setVisualEditorChapterId(chapterId)
    setVisualEditorLessonId(lessonId)
  }

  const closeVisualEditor = () => {
    setVisualEditorMode(false)
    setVisualEditorChapterId(null)
    setVisualEditorLessonId(null)
  }

  const handleVisualEditorSave = async (lessonData: UpsertLessonPayload) => {
    if (!editorCourseId || !visualEditorLessonId) return

    setFeedback(null)
    try {
      await updateLesson.mutateAsync({
        lessonId: visualEditorLessonId,
        courseId: editorCourseId,
        payload: {
          title: lessonData.title,
          content: lessonData.content,
          blocks: lessonData.blocks,
          video_url: lessonData.video_url,
          order: lessonData.order,
          duration: lessonData.duration,
          is_free: lessonData.is_free,
        },
      })
      setFeedback({ type: 'success', message: 'Leçon sauvegardée.' })
    } catch (err: unknown) {
      showError('Échec de la sauvegarde de la leçon.', err)
    }
  }

  const handleVisualEditorAddLesson = async (chapterId: number) => {
    if (!editorCourseId || !courseDetail) return

    const chapter = courseDetail.chapters.find(c => c.id === chapterId)
    if (!chapter) return

    setFeedback(null)
    try {
      const newLesson = await createLesson.mutateAsync({
        chapterId,
        courseId: editorCourseId,
        payload: {
          title: 'Nouvelle leçon',
          content: null,
          blocks: [],
          order: chapter.lessons.length + 1,
          duration: 0,
          is_free: false,
        },
      })

      setFeedback({ type: 'success', message: 'Nouvelle leçon ajoutée.' })
      // Navigate to the new lesson
      setVisualEditorLessonId(newLesson.id)
    } catch (err: unknown) {
      showError('Échec de l\'ajout de la leçon.', err)
    }
  }

  const handleVisualEditorFinishChapter = () => {
    setFeedback({ type: 'success', message: 'Chapitre terminé ! Vous pouvez continuer à le modifier ou passer au suivant.' })
  }

  const handleVisualEditorAddChapter = async () => {
    if (!editorCourseId) return

    setFeedback(null)
    try {
      const newChapter = await createChapter.mutateAsync({
        courseId: editorCourseId,
        payload: {
          title: 'Nouveau chapitre',
          description: null,
          order: (courseDetail?.chapters.length ?? 0) + 1,
        },
      })

      setFeedback({ type: 'success', message: 'Nouveau chapitre ajouté.' })
      setVisualEditorChapterId(newChapter.id)
    } catch (err: unknown) {
      showError('Échec de l\'ajout du chapitre.', err)
    }
  }

  const handleVisualEditorDeleteLesson = async (lessonId: number) => {
    if (!editorCourseId) return

    setFeedback(null)
    try {
      await deleteLesson.mutateAsync({
        lessonId,
        courseId: editorCourseId,
      })

      setFeedback({ type: 'success', message: 'Leçon supprimée.' })

      // Navigate to another lesson if available
      const currentChapter = courseDetail?.chapters.find(c => c.id === visualEditorChapterId)
      const remainingLessons = currentChapter?.lessons.filter(l => l.id !== lessonId) ?? []
      if (remainingLessons.length > 0) {
        setVisualEditorLessonId(remainingLessons[0].id)
      } else {
        closeVisualEditor()
      }
    } catch (err: unknown) {
      showError('Échec de la suppression de la leçon.', err)
    }
  }

  const handleVisualEditorUploadPdfBlock = async (blockId: string, file: File) => {
    if (!editorCourseId || !visualEditorLessonId) return

    setFeedback(null)
    try {
      const response = await uploadLessonBlockPdf.mutateAsync({
        lessonId: visualEditorLessonId,
        blockId,
        file,
        courseId: editorCourseId,
      })

      return response.block
    } catch (err: unknown) {
      showError('Échec de l upload du PDF du bloc.', err)
    }
  }

  useEffect(() => {
    if (!courseDetail) return

    setCourseTitle(courseDetail.title)
    setCourseDescription(courseDetail.description ?? '')
    setCourseLevel(courseDetail.level)
    setCoursePrice(String(courseDetail.price ?? 0))
    setCourseThumbnailPreview(courseDetail.thumbnail ? `${import.meta.env.VITE_API_URL.replace('/api', '')}/storage/${courseDetail.thumbnail}` : null)
  }, [courseDetail])

  const parsedCoursePrice = useMemo(() => {
    const parsed = Number.parseFloat(coursePrice)
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
  }, [coursePrice])

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
  if (!data || data.role !== 'instructor') return <ErrorState message="Données invalides" onRetry={() => void refetch()} />

  const readNewLessonDraft = (chapterId: number): LessonDraftState => {
    return newLessonDrafts[chapterId] ?? INITIAL_LESSON_DRAFT
  }

  const patchNewLessonDraft = (chapterId: number, patch: Partial<LessonDraftState>) => {
    setNewLessonDrafts((previous) => ({
      ...previous,
      [chapterId]: {
        ...readNewLessonDraft(chapterId),
        ...patch,
      },
    }))
  }

  const showError = (fallback: string, errorValue: unknown) => {
    const message = errorValue instanceof Error ? errorValue.message : fallback
    setFeedback({ type: 'error', message })
  }

  const formatBytes = (value: number | null) => {
    if (!value || value <= 0) return '0 B'

    const units = ['B', 'KB', 'MB', 'GB']
    let size = value
    let index = 0

    while (size >= 1024 && index < units.length - 1) {
      size /= 1024
      index += 1
    }

    return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`
  }

  const handleCreateCourse = async () => {
    if (!createDraft.title.trim()) {
      setFeedback({ type: 'error', message: 'Le titre est requis.' })
      return
    }

    setFeedback(null)

    try {
      const parsedPrice = Number.parseFloat(createDraft.price)
      const created = await createCourse.mutateAsync({
        title: createDraft.title.trim(),
        description: createDraft.description.trim() || undefined,
        level: createDraft.level,
        price: Number.isFinite(parsedPrice) && parsedPrice >= 0 ? parsedPrice : 0,
        thumbnail: createDraft.thumbnail,
      })
      setFeedback({ type: 'success', message: 'Cours créé avec succès.' })
      setCreateDraft({ title: '', description: '', level: 'beginner', price: '0', thumbnail: null })
      setCreateThumbnailPreview(null)
      setShowCreateForm(false)
      setEditorCourseId(created.id)
    } catch (err: unknown) {
      showError('Echec de creation du cours.', err)
    }
  }

  const handleTogglePublish = async (courseId: number, isPublished: boolean) => {
    setFeedback(null)

    try {
      await publishCourse.mutateAsync({ courseId, isPublished: !isPublished })
      setFeedback({ type: 'success', message: isPublished ? 'Cours dépublié.' : 'Cours publié.' })
    } catch (err: unknown) {
      showError('Echec de publication.', err)
    }
  }

  const handleDeleteCourse = async (courseId: number) => {
    setFeedback(null)

    try {
      await deleteCourse.mutateAsync({ courseId })
      if (editorCourseId === courseId) {
        resetEditor()
      }
      setFeedback({ type: 'success', message: 'Cours supprimé.' })
    } catch (err: unknown) {
      showError('Echec de suppression.', err)
    }
  }

  const handleSaveCourse = async () => {
    if (!editorCourseId || !courseTitle.trim()) return

    setFeedback(null)

    try {
      await updateCourse.mutateAsync({
        courseId: editorCourseId,
        payload: {
          title: courseTitle.trim(),
          description: courseDescription.trim() || null,
          level: courseLevel,
          price: parsedCoursePrice,
          thumbnail: courseThumbnail,
        },
      })
      setFeedback({ type: 'success', message: 'Cours mis à jour.' })
    } catch (err: unknown) {
      showError('Echec de mise a jour.', err)
    }
  }

  const startChapterEdit = (chapter: InstructorCourseDetailChapterItem) => {
    setEditingChapterId(chapter.id)
    setChapterDraftTitle(chapter.title)
    setChapterDraftDescription(chapter.description ?? '')
  }

  const handleCreateChapter = async () => {
    if (!editorCourseId || !newChapterTitle.trim()) return

    setFeedback(null)

    try {
      await createChapter.mutateAsync({
        courseId: editorCourseId,
        payload: {
          title: newChapterTitle.trim(),
          description: newChapterDescription.trim() || null,
          order: (courseDetail?.chapters.length ?? 0) + 1,
        },
      })

      setNewChapterTitle('')
      setNewChapterDescription('')
      setFeedback({ type: 'success', message: 'Chapitre ajouté.' })
    } catch (err: unknown) {
      showError('Echec de creation du chapitre.', err)
    }
  }

  const handleSaveChapter = async () => {
    if (!editorCourseId || !editingChapterId || !chapterDraftTitle.trim()) return

    setFeedback(null)

    try {
      await updateChapter.mutateAsync({
        chapterId: editingChapterId,
        courseId: editorCourseId,
        payload: {
          title: chapterDraftTitle.trim(),
          description: chapterDraftDescription.trim() || null,
        },
      })
      setEditingChapterId(null)
      setFeedback({ type: 'success', message: 'Chapitre mis à jour.' })
    } catch (err: unknown) {
      showError('Echec de mise a jour du chapitre.', err)
    }
  }

  const handleDeleteChapter = async (chapterId: number) => {
    if (!editorCourseId) return

    setFeedback(null)

    try {
      await deleteChapter.mutateAsync({ chapterId, courseId: editorCourseId })
      if (editingChapterId === chapterId) setEditingChapterId(null)
      setFeedback({ type: 'success', message: 'Chapitre supprimé.' })
    } catch (err: unknown) {
      showError('Echec de suppression du chapitre.', err)
    }
  }

  const handleUploadChapterAsset = async (chapterId: number, file: File | null) => {
    if (!editorCourseId || !file) return

    setFeedback(null)
    setUploadingChapterId(chapterId)
    setUploadProgressByChapter((previous) => ({ ...previous, [chapterId]: 0 }))
    setUploadErrorByChapter((previous) => {
      const next = { ...previous }
      delete next[chapterId]
      return next
    })

    try {
      await uploadChapterAsset.mutateAsync({
        chapterId,
        courseId: editorCourseId,
        file,
        onProgress: (progressPercent) => {
          setUploadProgressByChapter((previous) => ({
            ...previous,
            [chapterId]: progressPercent,
          }))
        },
      })

      setUploadProgressByChapter((previous) => ({ ...previous, [chapterId]: 100 }))
      setFeedback({ type: 'success', message: 'Ressource de chapitre uploadée.' })
    } catch (err: unknown) {
      setUploadErrorByChapter((previous) => ({
        ...previous,
        [chapterId]: err instanceof Error ? err.message : 'Upload impossible.',
      }))
      showError('Echec de l upload de la ressource.', err)
    } finally {
      setUploadingChapterId(null)
    }
  }

  const startLessonEdit = (lesson: InstructorCourseDetailLessonItem) => {
    setEditingLessonId(lesson.id)
    setEditingLessonDraft({
      title: lesson.title,
      description: lesson.description ?? '',
      videoUrl: lesson.video_url ?? '',
      duration: String(lesson.duration),
      isFree: lesson.is_free,
    })
  }

  const handleCreateLesson = async (chapterId: number, currentLessonsCount: number) => {
    if (!editorCourseId) return

    const draft = readNewLessonDraft(chapterId)
    if (!draft.title.trim()) return

    setFeedback(null)

    try {
      await createLesson.mutateAsync({
        chapterId,
        courseId: editorCourseId,
        payload: {
          title: draft.title.trim(),
          content: draft.description.trim() || null,
          video_url: draft.videoUrl.trim() || null,
          duration: Math.max(0, Number.parseInt(draft.duration || '0', 10) || 0),
          is_free: draft.isFree,
          order: currentLessonsCount + 1,
        },
      })

      setNewLessonDrafts((previous) => ({
        ...previous,
        [chapterId]: INITIAL_LESSON_DRAFT,
      }))

      setFeedback({ type: 'success', message: 'Leçon ajoutée.' })
    } catch (err: unknown) {
      showError('Echec de creation de la lecon.', err)
    }
  }

  const handleSaveLesson = async (lessonId: number) => {
    if (!editorCourseId || !editingLessonDraft.title.trim()) return

    setFeedback(null)

    try {
      await updateLesson.mutateAsync({
        lessonId,
        courseId: editorCourseId,
        payload: {
          title: editingLessonDraft.title.trim(),
          content: editingLessonDraft.description.trim() || null,
          video_url: editingLessonDraft.videoUrl.trim() || null,
          duration: Math.max(0, Number.parseInt(editingLessonDraft.duration || '0', 10) || 0),
          is_free: editingLessonDraft.isFree,
        },
      })
      setEditingLessonId(null)
      setFeedback({ type: 'success', message: 'Leçon mise à jour.' })
    } catch (err: unknown) {
      showError('Echec de mise a jour de la lecon.', err)
    }
  }

  const handleDeleteLesson = async (lessonId: number) => {
    if (!editorCourseId) return

    setFeedback(null)

    try {
      await deleteLesson.mutateAsync({ lessonId, courseId: editorCourseId })
      if (editingLessonId === lessonId) setEditingLessonId(null)
      setFeedback({ type: 'success', message: 'Leçon supprimée.' })
    } catch (err: unknown) {
      showError('Echec de suppression de la lecon.', err)
    }
  }

  const handleReorderChapters = async (chapterIds: number[]) => {
    if (!editorCourseId || chapterIds.length === 0) return

    setFeedback(null)

    try {
      await reorderChapters.mutateAsync({
        courseId: editorCourseId,
        payload: { chapter_ids: chapterIds },
      })
      setFeedback({ type: 'success', message: 'Ordre des chapitres mis a jour.' })
    } catch (err: unknown) {
      showError('Echec du reordonnancement des chapitres.', err)
    }
  }

  const handleReorderLessons = async (chapterId: number, lessonIds: number[]) => {
    if (!editorCourseId || lessonIds.length === 0) return

    setFeedback(null)

    try {
      await reorderLessons.mutateAsync({
        chapterId,
        courseId: editorCourseId,
        payload: { lesson_ids: lessonIds },
      })
      setFeedback({ type: 'success', message: 'Ordre des lecons mis a jour.' })
    } catch (err: unknown) {
      showError('Echec du reordonnancement des lecons.', err)
    }
  }

  const moveChapter = (chapterId: number, direction: 'up' | 'down') => {
    const chapterIds = courseDetail?.chapters.map((chapter) => chapter.id) ?? []
    const currentIndex = chapterIds.findIndex((id) => id === chapterId)
    if (currentIndex < 0) return

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= chapterIds.length) return

    const reordered = [...chapterIds]
    ;[reordered[currentIndex], reordered[targetIndex]] = [reordered[targetIndex], reordered[currentIndex]]
    void handleReorderChapters(reordered)
  }

  const moveLesson = (chapterId: number, lessonId: number, direction: 'up' | 'down') => {
    const chapter = courseDetail?.chapters.find((item) => item.id === chapterId)
    if (!chapter) return

    const lessonIds = chapter.lessons.map((lesson) => lesson.id)
    const currentIndex = lessonIds.findIndex((id) => id === lessonId)
    if (currentIndex < 0) return

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= lessonIds.length) return

    const reordered = [...lessonIds]
    ;[reordered[currentIndex], reordered[targetIndex]] = [reordered[targetIndex], reordered[currentIndex]]
    void handleReorderLessons(chapterId, reordered)
  }

  const confirmDeleteAction = async () => {
    if (!deleteTarget) return

    if (deleteTarget.kind === 'course') {
      await handleDeleteCourse(deleteTarget.id)
    }

    if (deleteTarget.kind === 'chapter') {
      await handleDeleteChapter(deleteTarget.id)
    }

    if (deleteTarget.kind === 'lesson') {
      await handleDeleteLesson(deleteTarget.id)
    }

    setDeleteTarget(null)
  }

  const closeDeleteModal = () => {
    if (deleteCourse.isPending || deleteChapter.isPending || deleteLesson.isPending) return
    setDeleteTarget(null)
  }

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>, isCreate: boolean) => {
    const file = e.target.files?.[0] || null
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      if (isCreate) {
        setCreateDraft(prev => ({ ...prev, thumbnail: file }))
        setCreateThumbnailPreview(reader.result as string)
      } else {
        setCourseThumbnail(file)
        setCourseThumbnailPreview(reader.result as string)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <DashboardShell
      title="Mes Cours"
      subtitle="Gérez vos cours et publications"
      role="instructor"
      viewerRole={user.role}
      userName={`${user.first_name} ${user.last_name}`}
      userEmail={user.email}
      onLogout={handleLogout}
      onNavigateRole={handleNavigateRole}
    >
      <div className="space-y-6">
        {feedback && <ActionFeedback type={feedback.type} message={feedback.message} />}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
              <BookOpen size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{courses.length} cours</h3>
              <p className="text-xs text-slate-500 dark:text-white/40">{courses.filter((course) => course.is_published).length} publiés</p>
            </div>
          </div>

          <Button
            className="h-12 rounded-xl bg-blue-600 px-6 font-semibold text-white shadow-none hover:bg-blue-700"
            onClick={() => {
              setCreateDraft({ title: '', description: '', level: 'beginner', price: '0', thumbnail: null })
              setCreateThumbnailPreview(null)
              setShowCreateForm(true)
            }}
          >
            <Plus size={18} className="mr-2" />
            Nouveau cours
          </Button>
        </div>

        {coursesLoading ? (
          <LoadingState />
        ) : courses.length === 0 ? (
          <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-12 text-center dark:border-white/5 dark:bg-white/5">
            <BookOpen size={40} className="mx-auto mb-4 text-slate-300 dark:text-white/20" />
            <p className="text-slate-500 dark:text-white/40">Aucun cours. Créez votre premier cours !</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6 transition-all hover:border-blue-500/30 dark:border-white/5 dark:bg-white/5"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="w-full h-32 rounded-xl bg-slate-200 dark:bg-white/10 mb-4 overflow-hidden relative">
                    {course.thumbnail ? (
                      <img
                        src={`${import.meta.env.VITE_API_URL.replace('/api', '')}/storage/${course.thumbnail}`}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-white/20">
                        <ImageIcon size={32} />
                      </div>
                    )}
                    <span className={`absolute top-2 left-2 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      course.is_published
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400'
                        : 'bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400'
                    }`}>
                      {course.is_published ? 'Publié' : 'Brouillon'}
                    </span>
                  </div>
                </div>

                <h4 className="mb-2 font-bold text-slate-900 dark:text-white line-clamp-1">{course.title}</h4>
                <p className="mb-4 text-xs text-slate-500 dark:text-white/40 line-clamp-2">{course.description || 'Aucune description'}</p>

                <div className="mb-4 flex items-center gap-4 text-xs text-slate-500 dark:text-white/40">
                  <span className="flex items-center gap-1">
                    <FileText size={12} /> {course.chapters_count} chapitres
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-white/10 capitalize">{course.level}</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 flex-1 rounded-lg border-slate-200 text-xs font-semibold text-slate-900 hover:bg-slate-100 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
                    onClick={() => setEditorCourseId(course.id)}
                  >
                    <Edit3 size={14} className="mr-1" /> Modifier
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className={`h-9 rounded-lg text-xs font-semibold ${
                      course.is_published
                        ? 'border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-400/20 dark:text-amber-400 dark:hover:bg-amber-400/10'
                        : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-400/20 dark:text-emerald-400 dark:hover:bg-emerald-400/10'
                    }`}
                    onClick={() => void handleTogglePublish(course.id, course.is_published)}
                  >
                    <Send size={14} className="mr-1" /> {course.is_published ? 'Dépublier' : 'Publier'}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 rounded-lg border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50"
                    onClick={() => setDeleteTarget({ kind: 'course', id: course.id })}
                    disabled={deleteCourse.isPending}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setShowCreateForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.98 }}
              onClick={(event) => event.stopPropagation()}
              className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#050608] md:p-8"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Nouveau cours</h3>
                  <p className="text-xs text-slate-500 dark:text-white/40">Remplissez les informations pour créer un cours</p>
                </div>
                <button onClick={() => setShowCreateForm(false)} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-white/10">
                  <X size={18} className="text-slate-500" />
                </button>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-4 md:col-span-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-white/80">
                      Titre <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={createDraft.title}
                      onChange={(event) => setCreateDraft((prev) => ({ ...prev, title: event.target.value }))}
                      placeholder="Titre du cours"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-white/80">Description</label>
                    <textarea
                      value={createDraft.description}
                      onChange={(event) => setCreateDraft((prev) => ({ ...prev, description: event.target.value }))}
                      rows={3}
                      placeholder="Description du cours (optionnelle)"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-white/80">Niveau</label>
                      <select
                        value={createDraft.level}
                        onChange={(event) => setCreateDraft((prev) => ({ ...prev, level: event.target.value as CourseLevel }))}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                      >
                        <option value="beginner">Débutant</option>
                        <option value="intermediate">Intermédiaire</option>
                        <option value="advanced">Avancé</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-white/80">Prix (FCFA)</label>
                      <input
                        value={createDraft.price}
                        onChange={(event) => setCreateDraft((prev) => ({ ...prev, price: event.target.value }))}
                        type="number"
                        min={0}
                        placeholder="0"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-white/80">Image du cours (Optionnelle)</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleThumbnailChange(e, true)}
                        className="hidden"
                        id="create-thumbnail"
                      />
                      <label
                        htmlFor="create-thumbnail"
                        className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white"
                      >
                        <Upload size={16} /> Choisir une image
                      </label>
                      {createDraft.thumbnail && (
                        <span className="text-xs text-slate-500 line-clamp-1">{createDraft.thumbnail.name}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={() => void handleCreateCourse()}
                      disabled={createCourse.isPending}
                      className="h-11 rounded-xl bg-blue-600 px-6 text-white shadow-none hover:bg-blue-700"
                    >
                      <Plus size={16} className="mr-2" />
                      {createCourse.isPending ? 'Creation...' : 'Créer le cours'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                      className="h-11 rounded-xl"
                    >
                      Annuler
                    </Button>
                  </div>
                </div>

                <div className="md:col-span-1">
                  <div className="sticky top-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-white/80">
                      <BookOpen size={14} /> Aperçu
                    </div>

                    <div className="w-full h-32 rounded-xl bg-slate-200 dark:bg-white/10 mb-4 overflow-hidden relative border border-slate-100 dark:border-white/5">
                      {createThumbnailPreview ? (
                        <img src={createThumbnailPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-white/20">
                          <ImageIcon size={32} />
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/30">Titre</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                          {createDraft.title.trim() || <span className="text-slate-400 dark:text-white/30">Sans titre</span>}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/30">Niveau</p>
                        <span className="mt-1 inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
                          {createDraft.level}
                        </span>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/30">Prix</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">
                          {(() => {
                            const p = Number.parseFloat(createDraft.price)
                            const price = Number.isFinite(p) && p >= 0 ? p : 0
                            return price === 0 ? 'Gratuit' : `${price.toLocaleString('fr-FR')} FCFA`
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editorCourseId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={resetEditor}
          >
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.98 }}
              onClick={(event) => event.stopPropagation()}
              className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#050608] md:p-8"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Studio de cours</h3>
                  <p className="text-xs text-slate-500 dark:text-white/40">Gestion complète du cours, des chapitres et des leçons</p>
                </div>
                <button onClick={resetEditor} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-white/10">
                  <X size={18} className="text-slate-500" />
                </button>
              </div>

              {courseDetailQuery.isLoading || !courseDetail ? (
                <LoadingState />
              ) : (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
                    <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                      <BookOpen size={16} /> Paramètres du cours
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                      <div className="md:col-span-1">
                        <div className="w-full aspect-video rounded-xl bg-slate-200 dark:bg-white/10 overflow-hidden relative mb-3 border border-slate-200 dark:border-white/5">
                          {courseThumbnailPreview ? (
                            <img src={courseThumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-white/20">
                              <ImageIcon size={40} />
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleThumbnailChange(e, false)}
                          className="hidden"
                          id="edit-thumbnail"
                        />
                        <label
                          htmlFor="edit-thumbnail"
                          className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white"
                        >
                          <Upload size={14} /> Modifier l'image
                        </label>
                      </div>

                      <div className="md:col-span-2 space-y-3">
                        <div className="grid gap-3 md:grid-cols-2">
                          <input
                            value={courseTitle}
                            onChange={(event) => setCourseTitle(event.target.value)}
                            placeholder="Titre du cours"
                            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                          />

                          <input
                            value={coursePrice}
                            onChange={(event) => setCoursePrice(event.target.value)}
                            type="number"
                            min={0}
                            placeholder="Prix"
                            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                          />

                          <select
                            value={courseLevel}
                            onChange={(event) => setCourseLevel(event.target.value as CourseLevel)}
                            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                          >
                            <option value="beginner">Débutant</option>
                            <option value="intermediate">Intermédiaire</option>
                            <option value="advanced">Avancé</option>
                          </select>
                        </div>
                        <textarea
                          value={courseDescription}
                          onChange={(event) => setCourseDescription(event.target.value)}
                          rows={2}
                          placeholder="Description du cours"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">
                      <Button
                        onClick={() => void handleSaveCourse()}
                        disabled={updateCourse.isPending}
                        className="h-10 rounded-xl bg-blue-600 text-white shadow-none hover:bg-blue-700"
                      >
                        Enregistrer les modifications
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => void handleTogglePublish(courseDetail.id, courseDetail.is_published)}
                        disabled={publishCourse.isPending}
                        className="h-10 rounded-xl"
                      >
                        <Send size={14} className="mr-1" /> {courseDetail.is_published ? 'Dépublier' : 'Publier'}
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
                    <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                      <Layers size={16} /> Ajouter un chapitre
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        value={newChapterTitle}
                        onChange={(event) => setNewChapterTitle(event.target.value)}
                        placeholder="Titre du chapitre"
                        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                      />

                      <textarea
                        value={newChapterDescription}
                        onChange={(event) => setNewChapterDescription(event.target.value)}
                        rows={2}
                        placeholder="Description du chapitre"
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                      />
                    </div>

                    <Button
                      onClick={() => void handleCreateChapter()}
                      disabled={createChapter.isPending}
                      className="mt-3 h-10 rounded-xl bg-slate-900 text-white shadow-none hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                    >
                      <Plus size={14} className="mr-1" /> Ajouter le chapitre
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {courseDetail.chapters.map((chapter) => {
                      return (
                        <div
                          key={chapter.id}
                          className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5"
                        >
                          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <h4 className="text-base font-bold text-slate-900 dark:text-white">{chapter.title}</h4>
                              <p className="text-xs text-slate-500 dark:text-white/40">{chapter.lessons.length} leçons</p>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-lg text-xs bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                                onClick={() => openVisualEditor(chapter.id, chapter.lessons[0]?.id ?? null)}
                              >
                                <BookOpen size={12} className="mr-1" /> Éditeur visuel
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-lg text-xs"
                                onClick={() => moveChapter(chapter.id, 'up')}
                                disabled={reorderChapters.isPending}
                              >
                                <ArrowUp size={12} className="mr-1" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-lg text-xs"
                                onClick={() => moveChapter(chapter.id, 'down')}
                                disabled={reorderChapters.isPending}
                              >
                                <ArrowDown size={12} className="mr-1" />
                              </Button>
                              <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs" onClick={() => startChapterEdit(chapter)}>
                                <Edit3 size={12} className="mr-1" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-lg border-red-200 text-xs text-red-600 hover:bg-red-50"
                                onClick={() => setDeleteTarget({ kind: 'chapter', id: chapter.id })}
                              >
                                <Trash2 size={12} className="mr-1" />
                              </Button>
                            </div>
                          </div>

                          {editingChapterId === chapter.id && (
                            <div className="mb-4 grid gap-2 rounded-xl border border-slate-200 p-3 md:grid-cols-2 dark:border-white/10">
                              <input
                                value={chapterDraftTitle}
                                onChange={(event) => setChapterDraftTitle(event.target.value)}
                                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                              />

                              <textarea
                                value={chapterDraftDescription}
                                onChange={(event) => setChapterDraftDescription(event.target.value)}
                                rows={2}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                              />

                              <div className="flex gap-2 md:col-span-2">
                                <Button size="sm" className="h-8 rounded-lg bg-blue-600 text-white shadow-none hover:bg-blue-700" onClick={() => void handleSaveChapter()}>
                                  Enregistrer
                                </Button>
                                <Button size="sm" variant="outline" className="h-8 rounded-lg" onClick={() => setEditingChapterId(null)}>
                                  Annuler
                                </Button>
                              </div>
                            </div>
                          )}

                          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
                            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-white/80">
                              <Upload size={12} /> Ressource du chapitre (PDF ou vidéo)
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                type="file"
                                accept="application/pdf,video/mp4,video/webm,video/quicktime,video/x-matroska"
                                onChange={(event) => {
                                  const file = event.target.files?.[0] ?? null
                                  void handleUploadChapterAsset(chapter.id, file)
                                  event.target.value = ''
                                }}
                                className="block w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-blue-700 dark:border-white/10 dark:bg-white/5 dark:text-white/80 md:w-auto"
                              />
                            </div>

                            {uploadingChapterId === chapter.id && (
                              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                                <div
                                  className="h-full bg-blue-600 transition-all"
                                  style={{ width: `${uploadProgressByChapter[chapter.id] ?? 0}%` }}
                                />
                              </div>
                            )}

                            {uploadErrorByChapter[chapter.id] && (
                              <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
                                {uploadErrorByChapter[chapter.id]}
                              </p>
                            )}

                            {chapter.asset_path && (
                              <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#0B0E13]">
                                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-white/60">
                                  <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold uppercase dark:bg-white/10">
                                    {chapter.asset_type}
                                  </span>
                                  <span>{chapter.asset_original_name}</span>
                                  <span>{formatBytes(chapter.asset_size)}</span>
                                </div>
                                {chapter.asset_url && (
                                  <a
                                    href={chapter.asset_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                  >
                                    <FileText size={12} /> Voir le fichier
                                  </a>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            {chapter.lessons.map((lesson, lessonIndex) => (
                              <div
                                key={lesson.id}
                                className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5"
                              >
                                {editingLessonId === lesson.id ? (
                                  <div className="grid gap-2 md:grid-cols-2">
                                    <input
                                      value={editingLessonDraft.title}
                                      onChange={(event) => setEditingLessonDraft((previous) => ({ ...previous, title: event.target.value }))}
                                      className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                    />
                                    <div className="flex gap-2 md:col-span-2">
                                      <Button size="sm" className="h-8 rounded-lg bg-blue-600 text-white shadow-none hover:bg-blue-700" onClick={() => void handleSaveLesson(lesson.id)}>
                                        Enregistrer
                                      </Button>
                                      <Button size="sm" variant="outline" className="h-8 rounded-lg" onClick={() => setEditingLessonId(null)}>
                                        Annuler
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{lesson.title}</p>
                                      <p className="text-xs text-slate-500 dark:text-white/40">{lesson.duration}s</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 rounded-lg text-xs"
                                        onClick={() => moveLesson(chapter.id, lesson.id, 'up')}
                                        disabled={lessonIndex === 0 || reorderLessons.isPending}
                                      >
                                        <ArrowUp size={12} />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 rounded-lg text-xs"
                                        onClick={() => moveLesson(chapter.id, lesson.id, 'down')}
                                        disabled={lessonIndex === chapter.lessons.length - 1 || reorderLessons.isPending}
                                      >
                                        <ArrowDown size={12} />
                                      </Button>
                                      <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs" onClick={() => startLessonEdit(lesson)}>
                                        <Edit3 size={12} />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 rounded-lg border-red-200 text-xs text-red-600 hover:bg-red-50"
                                        onClick={() => setDeleteTarget({ kind: 'lesson', id: lesson.id })}
                                      >
                                        <Trash2 size={12} />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          <div className="mt-3 p-3 border border-dashed border-slate-300 rounded-xl dark:border-white/20">
                            <input
                              value={readNewLessonDraft(chapter.id).title}
                              onChange={(event) => patchNewLessonDraft(chapter.id, { title: event.target.value })}
                              placeholder="Titre de la leçon"
                              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white mb-2"
                            />
                            <Button
                              size="sm"
                              className="h-8 rounded-lg bg-slate-900 text-white shadow-none hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                              onClick={() => void handleCreateLesson(chapter.id, chapter.lessons.length)}
                              disabled={createLesson.isPending}
                            >
                              <Plus size={12} className="mr-1" /> Ajouter la leçon
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        open={deleteTarget !== null}
        title="Confirmer la suppression"
        description="Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible."
        confirmLabel="Supprimer"
        isPending={deleteCourse.isPending || deleteChapter.isPending || deleteLesson.isPending}
        onConfirm={() => void confirmDeleteAction()}
        onCancel={closeDeleteModal}
      />

      {/* ==================== VISUAL LESSON EDITOR ==================== */}
      {createPortal(
        <AnimatePresence>
          {visualEditorMode && editorCourseId && courseDetail && visualEditorChapterId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[120] bg-gray-50 dark:bg-[#0b0f17]"
            >
              {/* Top bar */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3 shadow-sm dark:border-white/10 dark:bg-[#0f1219]">
                <div className="flex items-center gap-3">
                  <button
                    onClick={closeVisualEditor}
                    className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-white/70 dark:hover:bg-white/10"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Retour au studio
                  </button>
                  <div className="h-5 w-px bg-gray-200 dark:bg-white/20" />
                  <h2 className="truncate text-lg font-bold text-gray-900 dark:text-white">
                    {courseDetail.title}
                  </h2>
                </div>
                <button
                  onClick={closeVisualEditor}
                  className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
                >
                  <X className="h-5 w-5 text-gray-500 dark:text-white/60" />
                </button>
              </div>

              {/* Editor content */}
              <div className="p-6">
                <LessonEditor
                  lesson={{
                    id: visualEditorLessonId ?? undefined,
                    title: courseDetail.chapters
                      .find(c => c.id === visualEditorChapterId)
                      ?.lessons.find(l => l.id === visualEditorLessonId)
                      ?.title ?? 'Nouvelle leçon',
                    content: courseDetail.chapters
                      .find(c => c.id === visualEditorChapterId)
                      ?.lessons.find(l => l.id === visualEditorLessonId)
                      ?.description ?? null,
                    video_url: courseDetail.chapters
                      .find(c => c.id === visualEditorChapterId)
                      ?.lessons.find(l => l.id === visualEditorLessonId)
                      ?.video_url ?? null,
                    blocks: courseDetail.chapters
                      .find(c => c.id === visualEditorChapterId)
                      ?.lessons.find(l => l.id === visualEditorLessonId)
                      ?.blocks ?? null,
                    duration: courseDetail.chapters
                      .find(c => c.id === visualEditorChapterId)
                      ?.lessons.find(l => l.id === visualEditorLessonId)
                      ?.duration ?? 0,
                    order: courseDetail.chapters
                      .find(c => c.id === visualEditorChapterId)
                      ?.lessons.find(l => l.id === visualEditorLessonId)
                      ?.order ?? 0,
                    is_free: courseDetail.chapters
                      .find(c => c.id === visualEditorChapterId)
                      ?.lessons.find(l => l.id === visualEditorLessonId)
                      ?.is_free ?? false,
                  }}
                  chapters={courseDetail.chapters.map(c => ({
                    id: c.id,
                    title: c.title,
                    lessons: c.lessons.map(l => ({ id: l.id, title: l.title })),
                  }))}
                  currentChapterId={visualEditorChapterId}
                  currentLessonId={visualEditorLessonId}
                  onSave={handleVisualEditorSave}
                  onDeleteLesson={handleVisualEditorDeleteLesson}
                  onNavigateLesson={(chapterId, lessonId) => {
                    setVisualEditorChapterId(chapterId)
                    setVisualEditorLessonId(lessonId)
                  }}
                  onAddLesson={handleVisualEditorAddLesson}
                  onFinishChapter={handleVisualEditorFinishChapter}
                  onAddChapter={handleVisualEditorAddChapter}
                  onUploadPdfBlock={handleVisualEditorUploadPdfBlock}
                  courseId={editorCourseId}
                  isSaving={updateLesson.isPending}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </DashboardShell>
  )
}

export default InstructorCoursesPage

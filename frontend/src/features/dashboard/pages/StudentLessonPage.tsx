import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Lock,
  PlayCircle,
  Trophy,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { StudentBlockRenderer } from '@/components/lesson-blocks/StudentBlockRenderer'
import { dashboardPaths, resolveRoleDashboardPath } from '../utils/navigation'
import { DashboardShell } from '../components/DashboardShell'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { useLesson } from '../hooks/useStudentSupplements'
import { useMarkLessonCompleted } from '../hooks/useStudentLearning'
import type { DashboardRole } from '../services/dashboard.api'

const StudentLessonPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>()
  const { lesson, course, isLoading, isError, error } = useLesson(Number(courseId), Number(lessonId))
  const markLessonCompleted = useMarkLessonCompleted()

  const [expandedChapters, setExpandedChapters] = useState<Record<number, boolean>>({})

  // Compute navigation and progress
  const allLessons = useMemo(() => course?.chapters.flatMap((chapter) => chapter.lessons) || [], [course])
  const currentIndex = useMemo(() => allLessons.findIndex((l) => l.id === Number(lessonId)), [allLessons, lessonId])
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null

  const currentChapter = useMemo(() =>
    course?.chapters.find((chapter) => chapter.lessons.some((l) => l.id === Number(lessonId))),
  [course, lessonId])

  // Initial expansion of current chapter
  useEffect(() => {
    if (currentChapter) {
      setExpandedChapters((previous) => ({ ...previous, [currentChapter.id]: true }))
    }
  }, [currentChapter])

  const chapterProgress = useMemo(() => {
    if (!course) return {}
    const stats: Record<number, { completed: number; total: number; percent: number }> = {}

    for (const chapter of course.chapters) {
      const total = chapter.lessons.length
      const completed = chapter.lessons.filter((l) => l.completed).length
      stats[chapter.id] = {
        completed,
        total,
        percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      }
    }
    return stats
  }, [course])

  const globalProgress = useMemo(() => {
    if (!allLessons.length) return 0
    const completed = allLessons.filter((l) => l.completed).length
    return Math.round((completed / allLessons.length) * 100)
  }, [allLessons])

  if (!user) return <LoadingState fullscreen />

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const handleNavigateRole = (role: DashboardRole) => {
    navigate(resolveRoleDashboardPath(role))
  }

  const toggleChapter = (chapterId: number) => {
    setExpandedChapters((previous) => ({ ...previous, [chapterId]: !previous[chapterId] }))
  }

  const handleMarkCompleted = async () => {
    if (!lesson || lesson.completed) return

    try {
      await markLessonCompleted.mutateAsync({
        lessonId: lesson.id,
        watchedSeconds: lesson.duration * 60,
      })

      // Success effect
      void confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3054ff', '#10b981', '#f59e0b'],
      })
    } catch (err: unknown) {
      console.error('Failed to mark as completed', err)
    }
  }

  const renderContent = () => {
    if (!lesson) return null

    // Render blocks-based lesson
    if (lesson.type === 'blocks' && lesson.blocks && lesson.blocks.length > 0) {
      return (
        <div className="w-full p-8 md:p-12 bg-white dark:bg-[#0B0E13]">
          <div className="max-w-3xl mx-auto space-y-2">
            {lesson.blocks.map((block) => (
              <StudentBlockRenderer key={block.id} block={block} />
            ))}
          </div>
        </div>
      )
    }

    if (lesson.type === 'video') {
      return (
        <div className="aspect-video w-full overflow-hidden bg-black shadow-2xl">
          <iframe
            src={lesson.resourceUrl || ''}
            title={lesson.title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )
    }

    if (lesson.type === 'pdf') {
      return (
        <div className="flex h-[75vh] w-full flex-col overflow-hidden bg-slate-100 dark:bg-white/5">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#0B0E13]">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                <FileText size={16} />
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{lesson.title}</span>
            </div>
            <a
              href={lesson.resourceUrl || '#'}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              Ouvrir dans un nouvel onglet
            </a>
          </div>
          <iframe src={lesson.resourceUrl || ''} title={lesson.title} className="h-full w-full border-none" />
        </div>
      )
    }

    return (
      <div className="flex h-96 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 dark:border-white/10">
        <BookOpen size={48} className="mb-4 text-slate-300 dark:text-white/20" />
        <p className="text-slate-500 dark:text-white/40">Contenu de leçon non supporté.</p>
      </div>
    )
  }

  return (
    <DashboardShell
      title={course?.title || 'Chargement...'}
      subtitle={lesson?.title || 'Leçon'}
      role="student"
      viewerRole={user.role}
      userName={`${user.first_name} ${user.last_name}`}
      userEmail={user.email}
      onLogout={handleLogout}
      onNavigateRole={handleNavigateRole}
    >
      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState message={error instanceof Error ? error.message : 'Erreur'} onRetry={() => window.location.reload()} />
      ) : !lesson || !course ? (
        <ErrorState message="Leçon non trouvée" onRetry={() => window.location.reload()} />
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Main Content Area */}
          <div className="space-y-6 lg:col-span-8">
            {/* Header & Breadcrumb */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <button
                onClick={() => navigate(dashboardPaths.studentCourseDetail(Number(courseId)))}
                className="group flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-blue-600 dark:text-white/40 dark:hover:text-white"
              >
                <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                Retour au cours
              </button>

              <div className="flex items-center gap-3">
                <div className="flex h-2 w-32 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${globalProgress}%` }}
                    className="h-full bg-blue-600"
                  />
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">{globalProgress}% complété</span>
              </div>
            </div>

            {/* Adaptive Content Player */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl dark:border-white/5 dark:bg-[#050608]"
            >
              {renderContent()}

              <div className="border-t border-slate-100 p-6 dark:border-white/5 md:p-8">
                <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest ${
                        lesson.type === 'blocks'
                          ? 'bg-purple-50 text-purple-600 dark:bg-purple-400/10 dark:text-purple-400'
                          : 'bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400'
                      }`}>
                        {lesson.type === 'blocks' ? 'Leçon interactive' : lesson.type}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-white/30">Durée : {lesson.duration} min</span>
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">{lesson.title}</h1>
                    {lesson.type !== 'blocks' && (
                      <p className="max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-white/50">
                        {lesson.description || 'Apprenez les bases et maîtrisez cette compétence à travers cette leçon détaillée.'}
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={() => void handleMarkCompleted()}
                    disabled={lesson.completed || markLessonCompleted.isPending}
                    className={`h-12 flex-shrink-0 rounded-2xl px-8 font-bold transition-all ${
                      lesson.completed
                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-400/10 dark:text-emerald-400'
                        : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700'
                    }`}
                  >
                    {lesson.completed ? (
                      <span className="flex items-center gap-2">
                        <CheckCircle2 size={18} /> Leçon terminée
                      </span>
                    ) : markLessonCompleted.isPending ? (
                      'Enregistrement...'
                    ) : (
                      'Marquer comme terminé'
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Bottom Navigation */}
            <div className="grid grid-cols-2 gap-4">
              {prevLesson ? (
                <button
                  onClick={() => navigate(dashboardPaths.studentLesson(Number(courseId), prevLesson.id))}
                  className="group flex flex-1 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-blue-600/30 hover:bg-slate-50 dark:border-white/5 dark:bg-white/5 dark:hover:bg-white/10"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors group-hover:bg-blue-600 group-hover:text-white dark:bg-white/10">
                    <ChevronLeft size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20">Précédent</p>
                    <p className="line-clamp-1 text-sm font-bold text-slate-900 dark:text-white">{prevLesson.title}</p>
                  </div>
                </button>
              ) : (
                <div />
              )}

              {nextLesson ? (
                <button
                  onClick={() => (nextLesson.locked ? undefined : navigate(dashboardPaths.studentLesson(Number(courseId), nextLesson.id)))}
                  disabled={nextLesson.locked}
                  className={`group flex flex-1 items-center justify-end gap-4 rounded-2xl border p-4 transition-all ${
                    nextLesson.locked
                      ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-50 dark:border-white/5 dark:bg-white/5'
                      : 'border-slate-200 bg-white hover:border-blue-600/30 hover:bg-slate-50 dark:border-white/5 dark:bg-white/5 dark:hover:bg-white/10'
                  }`}
                >
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20">Suivant</p>
                    <p className="line-clamp-1 text-sm font-bold text-slate-900 dark:text-white">{nextLesson.title}</p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                    nextLesson.locked ? 'bg-slate-200 text-slate-400' : 'bg-blue-600 text-white'
                  }`}>
                    {nextLesson.locked ? <Lock size={18} /> : <ChevronRight size={20} />}
                  </div>
                </button>
              ) : (
                <div />
              )}
            </div>
          </div>

          {/* Course Content Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-8 space-y-4">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-white/5 dark:bg-[#050608]">
                <div className="border-b border-slate-100 bg-slate-50/50 p-5 dark:border-white/5 dark:bg-white/5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Contenu du cours</h3>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600">
                      <Trophy size={16} />
                    </div>
                  </div>
                </div>

                <div className="max-h-[calc(100vh-250px)] overflow-y-auto p-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
                  <div className="space-y-2">
                    {course.chapters.map((chapter) => {
                      const stats = chapterProgress[chapter.id]
                      const isExpanded = expandedChapters[chapter.id]

                      return (
                        <div key={chapter.id} className="overflow-hidden rounded-2xl border border-slate-100 dark:border-white/5">
                          <button
                            onClick={() => toggleChapter(chapter.id)}
                            className={`flex w-full items-center justify-between p-4 text-left transition-colors ${
                              isExpanded ? 'bg-slate-50 dark:bg-white/5' : 'hover:bg-slate-50 dark:hover:bg-white/5'
                            }`}
                          >
                            <div className="flex-1">
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white">{chapter.title}</h4>
                              <div className="mt-1 flex items-center gap-2">
                                <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                                  <div className="h-full bg-emerald-500" style={{ width: `${stats?.percent || 0}%` }} />
                                </div>
                                <span className="text-[10px] font-bold text-slate-400">{stats?.percent || 0}%</span>
                              </div>
                            </div>
                            <ChevronDown
                              size={16}
                              className={`ml-3 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                            />
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="space-y-1 bg-white p-2 dark:bg-transparent"
                              >
                                {chapter.lessons.map((l) => (
                                  <button
                                    key={l.id}
                                    onClick={() => !l.locked && navigate(dashboardPaths.studentLesson(Number(courseId), l.id))}
                                    disabled={l.locked}
                                    className={`group flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all ${
                                      l.id === Number(lessonId)
                                        ? 'bg-blue-600 text-white'
                                        : l.locked
                                          ? 'cursor-not-allowed opacity-40'
                                          : 'hover:bg-slate-50 dark:hover:bg-white/5'
                                    }`}
                                  >
                                    <div
                                      className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-colors ${
                                        l.id === Number(lessonId)
                                          ? 'bg-white/20'
                                          : l.completed
                                            ? 'bg-emerald-500/10 text-emerald-500'
                                            : 'bg-slate-100 text-slate-400 dark:bg-white/10'
                                      }`}
                                    >
                                      {l.completed ? (
                                        <CheckCircle2 size={14} />
                                      ) : l.locked ? (
                                        <Lock size={14} />
                                      ) : l.type === 'video' ? (
                                        <PlayCircle size={14} />
                                      ) : (
                                        <FileText size={14} />
                                      )}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                      <p
                                        className={`truncate text-xs font-semibold ${
                                          l.id === Number(lessonId) ? 'text-white' : 'text-slate-600 dark:text-white/70'
                                        }`}
                                      >
                                        {l.title}
                                      </p>
                                      <p
                                        className={`text-[10px] ${
                                          l.id === Number(lessonId) ? 'text-white/60' : 'text-slate-400'
                                        }`}
                                      >
                                        {l.duration} min
                                      </p>
                                    </div>
                                    {l.id === Number(lessonId) && (
                                      <motion.div layoutId="activeLesson" className="h-1.5 w-1.5 rounded-full bg-white" />
                                    )}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Course Support Card */}
              <div className="rounded-3xl bg-slate-900 p-6 text-white dark:bg-blue-600">
                <h4 className="mb-2 text-sm font-bold">Besoin d'aide ?</h4>
                <p className="mb-4 text-xs text-white/70">
                  Si vous avez des questions sur ce chapitre, n'hésitez pas à contacter votre instructeur.
                </p>
                <Button
                  variant="outline"
                  className="w-full border-white/20 bg-transparent text-white hover:bg-white hover:text-slate-900"
                  onClick={() => navigate(dashboardPaths.studentMessages)}
                >
                  Envoyer un message
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}

export default StudentLessonPage

import { ArrowLeft, PlayCircle, FileText, CheckCircle2, ChevronRight, ChevronLeft, Lock } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { resolveRoleDashboardPath, dashboardPaths } from '../utils/navigation'
import { DashboardShell } from '../components/DashboardShell'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { Button } from '@/components/ui/button'
import { useLesson } from '../hooks/useStudentSupplements'
import type { DashboardRole } from '../services/dashboard.api'

const StudentLessonPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>()
  const { lesson, course, isLoading } = useLesson(Number(courseId), Number(lessonId))

  if (!user) return <LoadingState fullscreen />

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const handleNavigateRole = (role: DashboardRole) => {
    navigate(resolveRoleDashboardPath(role))
  }

  // Find current lesson index and siblings
  const allLessons = course?.chapters.flatMap(c => c.lessons) || []
  const currentIndex = allLessons.findIndex(l => l.id === Number(lessonId))
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null

  const currentChapter = course?.chapters.find(c => c.lessons.some(l => l.id === Number(lessonId)))

  return (
    <DashboardShell
      title={lesson?.title || 'Leçon'}
      subtitle={currentChapter?.title || ''}
      role='student'
      viewerRole={user.role}
      userName={`${user.first_name} ${user.last_name}`}
      userEmail={user.email}
      onLogout={handleLogout}
      onNavigateRole={handleNavigateRole}
    >
      {isLoading ? <LoadingState /> : !lesson || !course ? <ErrorState message="Leçon non trouvée" /> : (
        <div className="space-y-6">
          {/* Breadcrumb & Back */}
          <div className="flex items-center gap-3 text-sm">
            <button
              onClick={() => navigate(dashboardPaths.studentCourseDetail(Number(courseId)))}
              className="flex items-center gap-2 text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
              Retour au cours
            </button>
            <span className="text-slate-300 dark:text-white/10">/</span>
            <span className="text-slate-600 dark:text-white/60">{currentChapter?.title}</span>
            <span className="text-slate-300 dark:text-white/10">/</span>
            <span className="text-slate-900 dark:text-white font-bold">{lesson.title}</span>
          </div>

          {/* Content Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#0a0a0a]"
          >
            {/* Video or PDF Player */}
            <div className="aspect-video bg-black relative">
              {lesson.type === 'video' ? (
                <iframe
                  src={lesson.resourceUrl || ''}
                  title={lesson.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-20 h-20 rounded-full bg-purple-500/10 flex items-center justify-center mb-6">
                    <FileText size={36} className="text-purple-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{lesson.title}</h3>
                  <p className="text-white/40 text-sm mb-8 max-w-md">{lesson.description}</p>
                  <Button className="bg-purple-500 hover:bg-purple-600 text-white px-8 h-12 rounded-xl font-bold">
                    <FileText size={18} className="mr-2" />
                    Télécharger le PDF
                  </Button>
                  <p className="text-white/20 text-xs mt-4">Le PDF s'ouvrira dans un nouvel onglet</p>
                </div>
              )}
            </div>

            {/* Lesson Info */}
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {lesson.type === 'video' ? (
                      <PlayCircle size={16} className="text-blue-500" />
                    ) : (
                      <FileText size={16} className="text-purple-500" />
                    )}
                    <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-widest ${
                      lesson.type === 'video' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'
                    }`}>
                      {lesson.type === 'video' ? 'Vidéo' : 'Document PDF'}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-white/20 flex items-center gap-1">
                      <FileText size={12} />{lesson.duration} min
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{lesson.title}</h2>
                  <p className="text-sm text-slate-400 dark:text-white/40 mt-1">{lesson.description}</p>
                </div>
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 h-10 rounded-xl font-bold text-sm flex-shrink-0">
                  <CheckCircle2 size={16} className="mr-2" />
                  Marquer comme terminé
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            {prevLesson ? (
              <button
                onClick={() => navigate(dashboardPaths.studentLesson(Number(courseId), prevLesson.id))}
                className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:border-[#3054ff]/30 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#3054ff]/10 flex items-center justify-center">
                  <ChevronLeft size={18} className="text-[#3054ff]" />
                </div>
                <div className="text-left">
                  <div className="text-[10px] text-slate-400 dark:text-white/30 uppercase tracking-widest font-bold">Précédent</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#3054ff] transition-colors line-clamp-1">{prevLesson.title}</div>
                </div>
              </button>
            ) : <div />}

            {nextLesson ? (
              <button
                onClick={() => nextLesson.locked ? undefined : navigate(dashboardPaths.studentLesson(Number(courseId), nextLesson.id))}
                disabled={nextLesson.locked}
                className={`flex items-center gap-3 p-4 rounded-2xl border transition-all group ${
                  nextLesson.locked
                    ? 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5 opacity-40 cursor-not-allowed'
                    : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5 hover:border-[#3054ff]/30'
                }`}
              >
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 dark:text-white/30 uppercase tracking-widest font-bold">Suivant</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#3054ff] transition-colors line-clamp-1">{nextLesson.title}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#3054ff]/10 flex items-center justify-center">
                  {nextLesson.locked ? <Lock size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-[#3054ff]" />}
                </div>
              </button>
            ) : <div />}
          </div>

          {/* Lesson List Sidebar */}
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Contenu du chapitre</h3>
            <div className="space-y-1">
              {currentChapter?.lessons.map((l, idx) => (
                <button
                  key={l.id}
                  onClick={() => !l.locked && navigate(dashboardPaths.studentLesson(Number(courseId), l.id))}
                  disabled={l.locked}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                    l.id === lesson.id
                      ? 'bg-[#3054ff] text-white'
                      : l.locked
                        ? 'opacity-40 cursor-not-allowed'
                        : 'hover:bg-white dark:hover:bg-white/5'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-xs ${
                    l.completed && l.id !== lesson.id
                      ? 'bg-emerald-500/20 text-emerald-500'
                      : l.id === lesson.id
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-white/10 text-slate-400 dark:text-white/30'
                  }`}>
                    {l.completed ? <CheckCircle2 size={12} /> : idx + 1}
                  </div>
                  <span className={`text-xs font-bold truncate ${
                    l.id === lesson.id ? 'text-white' : l.completed ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-600 dark:text-white/60'
                  }`}>
                    {l.title}
                  </span>
                  <span className={`text-[10px] ml-auto flex-shrink-0 ${
                    l.id === lesson.id ? 'text-white/60' : 'text-slate-400 dark:text-white/20'
                  }`}>
                    {l.type === 'video' ? 'Vidéo' : 'PDF'} · {l.duration}min
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}

export default StudentLessonPage

import { BookOpen, PlayCircle, Lock, CheckCircle2, Clock, Users, Award, FileText } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { resolveRoleDashboardPath, dashboardPaths } from '../utils/navigation'
import { resolveCourseThumbnail } from '../utils/courseThumbnail'
import { DashboardShell } from '../components/DashboardShell'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { useCourseDetail } from '../hooks/useStudentSupplements'
import type { DashboardRole } from '../services/dashboard.api'
import type { Lesson } from '../hooks/useStudentSupplements'

const StudentCourseDetailPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { courseId } = useParams<{ courseId: string }>()
  const { data: course, isLoading, isError, error } = useCourseDetail(Number(courseId))
  const [expandedChapter, setExpandedChapter] = useState<number | null>(1)

  if (!user) return <LoadingState fullscreen />

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const handleNavigateRole = (role: DashboardRole) => {
    navigate(resolveRoleDashboardPath(role))
  }

  const allLessons = course?.chapters.flatMap(c => c.lessons) || []
  const completedLessons = allLessons.filter(l => l.completed).length
  const progressPercent = allLessons.length > 0 ? Math.round((completedLessons / allLessons.length) * 100) : 0

  const handleLessonClick = (lesson: Lesson) => {
    if (lesson.locked) return
    navigate(dashboardPaths.studentLesson(Number(courseId), lesson.id))
  }

  return (
    <DashboardShell
      title={course?.title || 'Détail du cours'}
      subtitle={course?.instructor || ''}
      role='student'
      viewerRole={user.role}
      userName={`${user.first_name} ${user.last_name}`}
      userEmail={user.email}
      onLogout={handleLogout}
      onNavigateRole={handleNavigateRole}
    >
      {isLoading ? <LoadingState /> : isError ? <ErrorState message={error instanceof Error ? error.message : 'Erreur'} onRetry={() => window.location.reload()} /> : !course ? <ErrorState message="Cours non trouve" onRetry={() => window.location.reload()} /> : (
        <div className="space-y-8">
          {/* Course Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-[2rem] overflow-hidden aspect-[21/9] min-h-[250px]"
          >
            <img src={resolveCourseThumbnail(course.thumbnail, '')} className="absolute inset-0 w-full h-full object-cover" alt={course.title} />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-end">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 rounded-full bg-[#3054ff] text-[10px] font-black uppercase tracking-widest text-white">{course.level}</span>
                <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-white">{course.enrolledStudents} inscrits</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-serif italic text-white mb-3">{course.title}</h2>
              <p className="text-white/60 text-sm max-w-xl line-clamp-2">{course.description || 'Aucune description disponible.'}</p>
              <div className="flex items-center gap-6 mt-4">
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <Users size={16} className="text-[#3054ff]" />
                  <span>{course.instructor}</span>
                </div>
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <BookOpen size={16} className="text-[#3054ff]" />
                  <span>{course.chapters.length} chapitres · {allLessons.length} leçons</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Progress Bar */}
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Award className="text-[#3054ff]" size={20} />
                <span className="text-sm font-bold text-slate-900 dark:text-white">Votre progression</span>
              </div>
              <span className="text-sm font-bold text-[#3054ff]">{progressPercent}%</span>
            </div>
            <div className="h-2 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1 }}
                className="h-full bg-gradient-to-r from-[#3054ff] to-[#9791fe]"
              />
            </div>
            <div className="text-xs text-slate-400 dark:text-white/30 mt-2">{completedLessons}/{allLessons.length} leçons complétées</div>
          </div>

          {/* Chapters & Lessons */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <BookOpen className="text-[#3054ff]" />
              Contenu du cours
            </h3>

            <AnimatePresence>
              {course.chapters.map((chapter, idx) => {
                const isExpanded = expandedChapter === chapter.id
                const completedInChapter = chapter.lessons.filter(l => l.completed).length
                return (
                  <motion.div
                    key={chapter.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 overflow-hidden"
                  >
                    {/* Chapter Header */}
                    <button
                      onClick={() => setExpandedChapter(isExpanded ? null : chapter.id)}
                      className="w-full p-6 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-4 text-left">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${
                          completedInChapter === chapter.lessons.length
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-[#3054ff]/10 text-[#3054ff]'
                        }`}>
                          {completedInChapter === chapter.lessons.length ? <CheckCircle2 size={18} /> : chapter.id}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white">{chapter.title}</h4>
                          <p className="text-xs text-slate-400 dark:text-white/30">{chapter.lessons.length} leçons · {completedInChapter}/{chapter.lessons.length} terminées</p>
                        </div>
                      </div>
                      <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} className="text-slate-400">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                      </motion.div>
                    </button>

                    {/* Lessons List */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-4 space-y-2">
                            {chapter.lessons.map((lesson) => (
                              <button
                                key={lesson.id}
                                onClick={() => handleLessonClick(lesson)}
                                disabled={lesson.locked}
                                className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left group ${
                                  lesson.locked
                                    ? 'opacity-40 cursor-not-allowed'
                                    : 'hover:bg-white dark:hover:bg-white/5 cursor-pointer'
                                }`}
                              >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  lesson.completed
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : lesson.type === 'video'
                                      ? 'bg-blue-500/10 text-blue-500'
                                      : 'bg-purple-500/10 text-purple-500'
                                }`}>
                                  {lesson.completed ? <CheckCircle2 size={14} /> : lesson.type === 'video' ? <PlayCircle size={14} /> : <FileText size={14} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-sm font-bold ${lesson.completed ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                                      {lesson.title}
                                    </span>
                                    {lesson.type === 'pdf' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-500 font-bold">PDF</span>}
                                    {lesson.type === 'video' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 font-bold">VIDÉO</span>}
                                  </div>
                                  <p className="text-xs text-slate-400 dark:text-white/30 truncate">{lesson.description}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {lesson.locked ? <Lock size={14} className="text-slate-400 dark:text-white/20" /> : (
                                    <span className="text-[10px] text-slate-400 dark:text-white/20 font-bold flex items-center gap-1">
                                      <Clock size={12} />{lesson.duration}min
                                    </span>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}

export default StudentCourseDetailPage

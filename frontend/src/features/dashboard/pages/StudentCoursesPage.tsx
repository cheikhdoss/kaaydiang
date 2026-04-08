import { BookOpen, Layers, Sparkles, PlayCircle, Clock, ChevronRight, ArrowUpRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { dashboardPaths, resolveRoleDashboardPath } from '../utils/navigation'
import { DashboardShell } from '../components/DashboardShell'
import { ErrorState } from '../components/ErrorState'
import { LoadingState } from '../components/LoadingState'
import { useStudentMyCourses } from '../hooks/useStudentLearning'
import { useStudentModules } from '../hooks/useStudentModules'
import type { DashboardRole } from '../services/dashboard.api'

const StudentCoursesPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { data: myCourses = [], isLoading, isError, error, refetch } = useStudentMyCourses()
  const { data: modulesData } = useStudentModules()

  if (!user) {
    return <LoadingState fullscreen />
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const handleNavigateRole = (role: DashboardRole) => {
    navigate(resolveRoleDashboardPath(role))
  }

  const errorMessage = error instanceof Error ? error.message : 'Impossible de charger vos cours.'

  // Helper to find detailed progress from modulesData
  const getProgress = (courseId: number) => {
    const course = modulesData?.modules.my_courses.find(c => c.id === courseId)
    return course?.progress_percent ?? 0
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <DashboardShell
      title='Mes Apprentissages'
      subtitle='Gérez votre progression et vos cours actifs'
      role='student'
      viewerRole={user.role}
      userName={`${user.first_name} ${user.last_name}`}
      userEmail={user.email}
      onLogout={handleLogout}
      onNavigateRole={handleNavigateRole}
    >
      {isLoading ? <LoadingState /> : null}
      {!isLoading && isError ? <ErrorState message={errorMessage} onRetry={() => void refetch()} /> : null}

      {!isLoading && !isError && (
        <div className="space-y-8">
          {myCourses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className='rounded-[2.5rem] border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 p-16 text-center backdrop-blur-xl'
            >
              <div className="w-20 h-20 bg-[#3054ff]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className='h-10 w-10 text-[#3054ff]' />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Aucun cours trouvé</h3>
              <p className='text-sm text-slate-400 dark:text-white/40 max-w-md mx-auto mb-8'>
                Vous n'êtes inscrit à aucun cours pour le moment. Explorez notre catalogue pour commencer votre voyage.
              </p>
              <Button
                className='bg-[#3054ff] hover:bg-[#1943f2] text-white px-8 h-12 rounded-xl font-bold'
                onClick={() => navigate(dashboardPaths.studentCatalog)}
              >
                Explorer le catalogue
              </Button>
            </motion.div>
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            >
              {myCourses.map((courseItem) => {
                const progress = getProgress(courseItem.course.id)
                return (
                  <motion.div
                    key={courseItem.enrollment_id}
                    variants={item}
                    whileHover={{ y: -5 }}
                    className='group rounded-[2rem] border border-slate-200 dark:border-white/5 bg-white dark:bg-white/5 overflow-hidden flex flex-col hover:border-[#3054ff]/30 transition-all duration-500 shadow-sm dark:shadow-none'
                  >
                    <div className="aspect-video relative overflow-hidden">
                      <img
                        src={courseItem.course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80'}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-80 group-hover:opacity-100"
                        alt={courseItem.course.title}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute top-4 right-4">
                        <span className='rounded-full bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white'>
                          {courseItem.course.level}
                        </span>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center justify-between text-[10px] font-black text-white/80 uppercase tracking-widest mb-2">
                          <span>Progression</span>
                          <span className="text-[#3054ff]">{progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-[#3054ff]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                      <h3
                        className='text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-[#3054ff] transition-colors cursor-pointer'
                        onClick={() => navigate(dashboardPaths.studentCourseDetail(courseItem.course.id))}
                      >
                        {courseItem.course.title}
                      </h3>
                      <p className='text-xs text-slate-400 dark:text-white/40 mb-6 line-clamp-2 leading-relaxed'>
                        {courseItem.course.description || 'Apprenez les fondamentaux et maîtrisez ce domaine avec expertise.'}
                      </p>

                      <div className="mt-auto pt-6 border-t border-slate-200 dark:border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                            <Layers size={14} className="text-[#3054ff]" />
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-white/40">
                            <div className="font-bold text-slate-600 dark:text-white/60">INSCRIT</div>
                            <div>{courseItem.enrolled_at ? new Date(courseItem.enrolled_at).toLocaleDateString('fr-FR') : '-'}</div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="bg-slate-100 dark:bg-white/5 hover:bg-[#3054ff] text-slate-900 dark:text-white border border-slate-200 dark:border-white/5 hover:border-[#3054ff] hover:text-white transition-all rounded-xl"
                          onClick={() => navigate(dashboardPaths.studentCourseDetail(courseItem.course.id))}
                        >
                          <PlayCircle size={16} className="mr-2" />
                          Reprendre
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </div>
      )}
    </DashboardShell>
  )
}

export default StudentCoursesPage

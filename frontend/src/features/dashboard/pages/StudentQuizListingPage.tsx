import { HelpCircle, Brain, Target, ArrowUpRight, Play, CheckCircle, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { resolveRoleDashboardPath } from '../utils/navigation'
import { resolveCourseThumbnail } from '../utils/courseThumbnail'
import { DashboardShell } from '../components/DashboardShell'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { useDashboardData } from '../hooks/useDashboardData'
import { useStudentMyCourses } from '../hooks/useStudentLearning'
import { useStudentQuizzes } from '../hooks/useStudentQuiz'
import { Button } from '@/components/ui/button'
import type { DashboardRole } from '../services/dashboard.api'

const StudentQuizListingPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { data, isLoading, isError, error, refetch } = useDashboardData('student')
  const { data: myCourses = [] } = useStudentMyCourses()
  const { data: quizzes = [], isLoading: quizzesLoading } = useStudentQuizzes()

  if (!user) return <LoadingState fullscreen />

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const handleNavigateRole = (role: DashboardRole) => {
    navigate(resolveRoleDashboardPath(role))
  }

  if (isLoading || quizzesLoading) return <LoadingState fullscreen />
  if (isError) return <ErrorState message={error instanceof Error ? error.message : 'Erreur'} onRetry={() => void refetch()} />
  if (!data || data.role !== 'student') return <ErrorState message="Données invalides" onRetry={() => void refetch()} />

  const quizModule = data.modules.find(m => m.key === 'quiz')

  const quizzesByCourse = quizzes.reduce<Record<number, typeof quizzes>>((acc, quiz) => {
    acc[quiz.course_id] = acc[quiz.course_id] ? [...acc[quiz.course_id], quiz] : [quiz]
    return acc
  }, {})

  return (
    <DashboardShell
      title='Mes Quiz'
      subtitle='Testez vos connaissances et validez vos acquis'
      role='student'
      viewerRole={user.role}
      userName={`${user.first_name} ${user.last_name}`}
      userEmail={user.email}
      onLogout={handleLogout}
      onNavigateRole={handleNavigateRole}
    >
      <div className="space-y-10">
        {/* Quiz Summary Hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-10 rounded-[2.5rem] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 backdrop-blur-xl relative overflow-hidden"
        >
          <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] bg-[#3054ff]/10 blur-[100px] rounded-full" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="w-24 h-24 rounded-3xl bg-[#3054ff] flex items-center justify-center shadow-[0_20px_40px_rgba(48,84,255,0.4)]">
              <Brain size={48} className="text-white" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Performance Globale</h2>
              <p className="text-slate-400 dark:text-white/40 text-sm max-w-xl">{quizModule?.description}</p>
            </div>
            <div className="flex gap-4">
              <div className="text-center p-4 bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 min-w-[100px]">
                <div className="text-2xl font-black text-[#3054ff]">+{data.stats.weekly_growth}%</div>
                <div className="text-[10px] font-bold text-slate-400 dark:text-white/20 uppercase tracking-widest mt-1">Évolution</div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Courses with Pending Quizzes */}
          <div className="lg:col-span-8 space-y-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3 px-2">
              <HelpCircle className="text-[#3054ff]" />
              Quiz par cours
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myCourses.map((item, idx) => (
                <motion.div
                  key={item.enrollment_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="p-6 rounded-[2rem] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:border-[#3054ff]/30 transition-all group"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center overflow-hidden">
                      <img src={resolveCourseThumbnail(item.course.thumbnail, '')} className="w-full h-full object-cover opacity-50" alt={item.course.title} />
                    </div>
                    <div className="px-2 py-1 rounded-md bg-slate-100 dark:bg-white/5 text-[8px] font-black text-slate-400 dark:text-white/40 uppercase tracking-widest">
                      {item.course.level}
                    </div>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2 line-clamp-1 group-hover:text-[#3054ff] transition-colors">{item.course.title}</h4>
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-white/20 uppercase tracking-widest">
                      <Clock size={12} />
                      <span>{quizzesByCourse[item.course.id]?.length ?? 0} quiz disponible(s)</span>
                    </div>

                    {quizzesByCourse[item.course.id]?.length ? (
                      quizzesByCourse[item.course.id].slice(0, 2).map((quiz) => (
                        <div key={quiz.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/5">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-slate-800 dark:text-white">{quiz.title}</p>
                            <p className="text-[10px] text-slate-500 dark:text-white/40">
                              {quiz.question_count} questions · seuil {quiz.pass_score}%
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 rounded-lg border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white hover:bg-[#3054ff] hover:border-[#3054ff] hover:text-white transition-all group/btn"
                            onClick={() => navigate(`/dashboard/student/quiz/${quiz.id}`)}
                          >
                            Lancer <Play size={11} className="ml-1 group-hover/btn:fill-white" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-white/40">Aucun quiz publie pour ce cours pour le moment.</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Recent Results Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="p-8 rounded-[2.5rem] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 backdrop-blur-xl">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Derniers résultats</h3>
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="p-4 rounded-2xl bg-white dark:bg-black/40 border border-slate-200 dark:border-white/5 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Quiz Design System</div>
                      <div className="text-[10px] text-slate-400 dark:text-white/20 mt-1 uppercase tracking-widest">Il y a 2 jours</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-500 dark:text-emerald-400 font-black text-lg">95%</span>
                      <CheckCircle size={14} className="text-emerald-500 dark:text-emerald-400" />
                    </div>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-6 bg-slate-900 dark:bg-white/5 hover:bg-slate-800 dark:hover:bg-white/10 text-white text-[10px] h-10 font-black uppercase tracking-widest border border-slate-700 dark:border-white/5 rounded-xl">
                Historique complet
              </Button>
            </div>

            <div className="p-8 rounded-[2.5rem] bg-[#3054ff] text-white overflow-hidden relative group cursor-pointer shadow-[0_20px_40px_rgba(48,84,255,0.3)]">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-[40px] group-hover:scale-125 transition-transform duration-700" />
              <div className="relative z-10">
                <Target size={32} className="mb-4 text-white/40" />
                <h3 className="text-xl font-bold mb-2">Défi du jour</h3>
                <p className="text-sm text-white/80 leading-relaxed">Répondez à 5 questions rapides pour doubler votre série de points aujourd'hui.</p>
                <div className="mt-6 flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                  <span>Relever le défi</span>
                  <ArrowUpRight size={14} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}

export default StudentQuizListingPage

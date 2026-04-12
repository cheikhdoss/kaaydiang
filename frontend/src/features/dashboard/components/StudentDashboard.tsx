import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Award,
  BookOpen,
  Clock,
  Flame,
  PlayCircle,
  Sparkles,
  ChevronRight,
  Target,
  Search,
  ArrowUpRight,
  Trophy,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { dashboardPaths } from '../utils/navigation'
import { resolveCourseThumbnail } from '../utils/courseThumbnail'
import { ActionFeedback } from './ActionFeedback'
import { useEnrollInCourse, useStudentCatalog, useStudentMyCourses } from '../hooks/useStudentLearning'
import { useStudentModules } from '../hooks/useStudentModules'
import {
  useStudentSupplementCertificates,
  useStudentSupplementNextLesson,
} from '../hooks/useStudentSupplements'
import { StatCards } from './StatCards'
import type { StudentDashboardPayload } from '../services/dashboard.api'

interface StudentDashboardProps {
  data: StudentDashboardPayload
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ data }) => {
  const navigate = useNavigate()
  const { data: catalog = [] } = useStudentCatalog()
  useStudentMyCourses()
  const enrollMutation = useEnrollInCourse()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const { data: modulesData } = useStudentModules()
  const courseModules = useMemo(() => modulesData?.modules.my_courses ?? [], [modulesData?.modules.my_courses])

  const { data: supplementCertificates = [] } = useStudentSupplementCertificates()
  const { data: nextLessonPayload } = useStudentSupplementNextLesson()
  const nextLesson = nextLessonPayload?.next_lesson

  const statData = [
    {
      icon: BookOpen,
      value: data.stats.active_courses,
      title: 'Cours actifs',
      desc: `Vous êtes inscrit à ${data.stats.active_courses} cours cette session.`,
      cta: 'Voir mes cours',
      color: 'bg-blue-600',
      link: dashboardPaths.studentCourses,
      svgBackground: (
        <svg className="absolute right-0 top-0 w-32 h-32 pointer-events-none" viewBox="0 0 200 200" fill="none">
          <circle cx="160" cy="80" r="60" fill="#fff" fillOpacity="0.06" />
          <circle cx="190" cy="40" r="40" fill="#fff" fillOpacity="0.08" />
          <circle cx="140" cy="150" r="30" fill="#fff" fillOpacity="0.05" />
        </svg>
      ),
    },
    {
      icon: Award,
      value: supplementCertificates.length || data.stats.certificates,
      title: 'Certificats',
      desc: 'Certifications obtenues et reconnues par des professionnels.',
      cta: 'Voir les diplômes',
      color: 'bg-purple-600',
      link: dashboardPaths.studentCourses,
      svgBackground: (
        <svg className="absolute right-0 top-0 w-32 h-32 pointer-events-none" viewBox="0 0 200 200" fill="none">
          <defs>
            <filter id="blur-purple-stat" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="10" />
            </filter>
          </defs>
          <ellipse cx="170" cy="60" rx="30" ry="14" fill="#fff" fillOpacity="0.10" filter="url(#blur-purple-stat)" />
          <rect x="120" y="20" width="50" height="16" rx="6" fill="#fff" fillOpacity="0.07" />
          <circle cx="180" cy="100" r="10" fill="#fff" fillOpacity="0.12" />
        </svg>
      ),
    },
    {
      icon: Clock,
      value: data.stats.learning_hours,
      title: "Heures d'apprentissage",
      desc: 'Temps total passé sur la plateforme. Continuez !',
      cta: 'Voir le planning',
      color: 'bg-emerald-600',
      link: dashboardPaths.studentCourses,
      suffix: 'h',
      svgBackground: (
        <svg className="absolute right-0 top-0 w-32 h-32 pointer-events-none" viewBox="0 0 200 200" fill="none">
          <rect x="130" y="0" width="60" height="60" rx="25" fill="#fff" fillOpacity="0.06" />
          <ellipse cx="170" cy="70" rx="22" ry="10" fill="#fff" fillOpacity="0.09" />
          <polygon points="200,0 200,50 150,0" fill="#fff" fillOpacity="0.05" />
          <circle cx="150" cy="25" r="8" fill="#fff" fillOpacity="0.12" />
        </svg>
      ),
    },
  ]

  return (
    <div className="space-y-10 pb-20">
      {feedback && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <ActionFeedback type={feedback.type} message={feedback.message} />
        </motion.div>
      )}

      {/* Stats Grid */}
      <StatCards stats={statData} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area - Left (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Continue Learning Hero */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-[2.5rem] overflow-hidden group aspect-[21/9] min-h-[300px]"
          >
            <img
              src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1600&q=80"
              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000"
              alt="Learning"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent" />

            <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-end">
              <div className="flex items-center gap-3 mb-4">
                <div className="px-3 py-1 rounded-full bg-[#3054ff] text-[10px] font-black uppercase tracking-widest text-white">En cours</div>
                <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-white">
                  {nextLesson?.course.title || 'Mon parcours'}
                </div>
              </div>
              <h2 className="text-3xl md:text-5xl font-serif italic text-white mb-4 leading-tight">
                {nextLesson ? nextLesson.lesson_title : 'Continuez votre ascension'}
              </h2>
              <div className="flex flex-wrap items-center gap-6 mb-8">
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <Clock size={16} className="text-[#3054ff]" />
                  <span>{nextLesson ? `${Math.round(nextLesson.duration / 60)} minutes restantes` : 'Reprenez où vous étiez'}</span>
                </div>
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <Target size={16} className="text-[#3054ff]" />
                  <span>{data.progress.completed_lessons}/{data.progress.total_lessons} Leçons</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => navigate(dashboardPaths.studentCourses)}
                  className="bg-[#3054ff] hover:bg-[#1943f2] text-white px-8 h-14 rounded-2xl font-bold group"
                >
                  <PlayCircle className="mr-3 group-hover:scale-110 transition-transform" />
                  Reprendre maintenant
                </Button>
                <div className="h-14 w-[2px] bg-white/10 hidden sm:block"></div>
                <div className="hidden sm:block">
                  <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Progression Globale</div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(data.progress.completed_lessons / data.progress.total_lessons) * 100}%` }}
                        className="h-full bg-gradient-to-r from-[#3054ff] to-[#9791fe]"
                      />
                    </div>
                    <span className="text-xs font-bold text-white">{Math.round((data.progress.completed_lessons / data.progress.total_lessons) * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* My Courses Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold tracking-tight flex items-center gap-3 text-slate-900 dark:text-white">
                <BookOpen className="text-[#3054ff]" />
                Mes cours récents
              </h3>
              <Button variant="link" className="text-[#3054ff] hover:text-[#1943f2] transition-colors p-0" onClick={() => navigate(dashboardPaths.studentCourses)}>
                Voir tout <ChevronRight size={16} />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courseModules.slice(0, 4).map((course, idx) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="group p-5 rounded-[2rem] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:border-[#3054ff]/30 transition-all duration-500 flex flex-col gap-4"
                >
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-white/5">
                      <img
                        src={resolveCourseThumbnail(course.thumbnail)}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        alt={course.title}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-[#3054ff] transition-colors">{course.title}</h4>
                      <p className="text-xs text-slate-400 dark:text-white/40 mt-1 uppercase tracking-wider">{course.instructor || 'Instructeur Pro'}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <ArrowUpRight className="text-slate-300 dark:text-white/20 group-hover:text-[#3054ff] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" size={20} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-slate-400 dark:text-white/40 uppercase tracking-widest">Progression</span>
                      <span className="text-[#3054ff]">{course.progress_percent}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${course.progress_percent}%` }}
                        className="h-full bg-[#3054ff]"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Area - Right (4 cols) */}
        <div className="lg:col-span-4 space-y-8">
          {/* Daily Goal Card */}
          <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-[#3054ff] to-[#1943f2] text-white relative overflow-hidden shadow-[0_20px_50px_rgba(48,84,255,0.3)]">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-[40px]" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="p-3 rounded-2xl bg-white/20">
                  <Flame className="fill-white" size={24} />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black">{data.progress.streak_days}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">Jours de série</div>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">Objectif Quotidien</h3>
              <p className="text-sm text-white/70 mb-6 leading-relaxed">Continuez sur votre lancée ! Plus que 3 leçons pour atteindre votre but.</p>
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-black uppercase tracking-tighter">
                  <span>Progression</span>
                  <span>75%</span>
                </div>
                <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Section */}
          <div className="p-8 rounded-[2.5rem] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="text-[#3054ff]" size={18} />
                Pour vous
              </h3>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full bg-slate-100 dark:bg-white/5">
                <Search size={14} className="text-slate-400 dark:text-white/40" />
              </Button>
            </div>

            <div className="space-y-6">
              {catalog.slice(0, 3).map((course) => (
                <div key={course.id} className="flex gap-4 group cursor-pointer">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-white/5 flex-shrink-0">
                    <img
                      src={resolveCourseThumbnail(course.thumbnail)}
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                      alt={course.title}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-[#3054ff] transition-colors">{course.title}</h4>
                    <p className="text-[10px] text-slate-400 dark:text-white/40 uppercase font-black mt-1 tracking-widest">Niveau {course.level}</p>
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 rounded-lg border-slate-200 dark:border-white/10 hover:bg-[#3054ff] hover:border-[#3054ff] hover:text-white transition-all"
                    onClick={() => {
                      setFeedback(null)
                      enrollMutation.mutateAsync(course.id)
                        .then(() => setFeedback({ type: 'success', message: `${course.title} ajouté !` }))
                        .catch(() => setFeedback({ type: 'error', message: 'Erreur d\'inscription' }))
                    }}
                  >
                    <ArrowUpRight size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Certificates Preview */}
          <div className="p-8 rounded-[2.5rem] bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Award className="text-purple-500 dark:text-purple-400" size={18} />
              Certificats
            </h3>
            {supplementCertificates.length > 0 ? (
              <div className="space-y-4">
                {supplementCertificates.slice(0, 2).map(cert => (
                  <div key={cert.id} className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{cert.course.title}</div>
                    <div className="text-[10px] text-slate-400 dark:text-white/40 mt-1 uppercase tracking-widest">{cert.certificate_code}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <Trophy className="text-slate-300 dark:text-white/10" size={20} />
                </div>
                <p className="text-xs text-slate-400 dark:text-white/40 leading-relaxed">Aucun certificat pour le moment. Continuez d'apprendre !</p>
              </div>
            )}
            <Button className="w-full mt-6 bg-slate-900 dark:bg-white/5 hover:bg-slate-800 dark:hover:bg-white/10 text-white text-[10px] h-10 font-black uppercase tracking-widest border border-slate-700 dark:border-white/5">
              Voir tous les diplômes
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

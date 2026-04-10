import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen,
  CheckCircle2,
  FileText,
  TrendingUp,
  Sparkles,
  ChevronRight,
  ArrowUpRight,
  Plus,
  Eye,
  Edit3,
  Send,
  Clock,
  Users,
  Star,
  BarChart3,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { dashboardPaths } from '../utils/navigation'
import { ActionFeedback } from './ActionFeedback'
import { useCreateInstructorCourse, useInstructorCourses, usePublishInstructorCourse } from '../hooks/useInstructorCourses'
import type { InstructorDashboardPayload } from '../services/dashboard.api'

interface InstructorDashboardProps {
  data: InstructorDashboardPayload
}

export const InstructorDashboard: React.FC<InstructorDashboardProps> = ({ data }) => {
  const navigate = useNavigate()
  const { data: courses = [] } = useInstructorCourses()
  const createCourse = useCreateInstructorCourse()
  const publishCourse = usePublishInstructorCourse()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const stats = [
    { icon: BookOpen, label: 'Cours créés', value: data.stats.courses_created, color: 'bg-blue-600' },
    { icon: CheckCircle2, label: 'Publiés', value: data.stats.courses_published, color: 'bg-emerald-600' },
    { icon: FileText, label: 'Chapitres', value: data.stats.chapters, color: 'bg-purple-600' },
    { icon: TrendingUp, label: 'Engagement', value: `${data.stats.engagement_rate}%`, color: 'bg-amber-600' },
  ]

  return (
    <div className="space-y-10 pb-20">
      {feedback && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <ActionFeedback type={feedback.type} message={feedback.message} />
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="relative p-6 rounded-[2rem] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 overflow-hidden group hover:border-blue-500/20 dark:hover:border-blue-400/10 transition-all duration-500"
          >
            <div className={`absolute top-4 right-4 w-12 h-12 rounded-xl ${stat.color} opacity-10`} />
            <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center mb-4`}>
              <stat.icon size={22} className="text-white" />
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</div>
            <div className="text-xs text-slate-500 dark:text-white/40 mt-1 font-semibold uppercase tracking-wider">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area - Left (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Pipeline Hero */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-[2.5rem] overflow-hidden bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 p-8 md:p-12"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-serif italic text-slate-900 dark:text-white mb-2 leading-tight">
                  Pipeline de publication
                </h2>
                <p className="text-sm text-slate-500 dark:text-white/40">
                  Suivez l'avancement de vos cours du brouillon à la publication
                </p>
              </div>
              <Button
                onClick={() => {
                  setFeedback(null)
                  createCourse
                    .mutateAsync({
                      title: `Nouveau cours ${new Date().toLocaleDateString('fr-FR')}`,
                      description: 'Cours créé depuis le dashboard instructeur',
                      level: 'beginner',
                      price: 0,
                    })
                    .then(() => setFeedback({ type: 'success', message: 'Cours créé avec succès.' }))
                    .catch((err: unknown) => {
                      const message = err instanceof Error ? err.message : 'Échec de création du cours.'
                      setFeedback({ type: 'error', message })
                    })
                }}
                disabled={createCourse.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 h-12 rounded-2xl font-bold shadow-none"
              >
                <Plus className="mr-2" size={18} />
                {createCourse.isPending ? 'Création...' : 'Créer un cours'}
              </Button>
            </div>

            {/* Pipeline Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Brouillons', value: data.pipeline.drafts, color: 'bg-amber-500', icon: Edit3 },
                { label: 'Prêts à publier', value: data.pipeline.ready_to_publish, color: 'bg-blue-600', icon: Send },
                { label: 'En review', value: data.pipeline.pending_reviews, color: 'bg-purple-600', icon: Eye },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  className="p-6 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 text-center"
                >
                  <div className={`w-14 h-14 rounded-xl ${item.color} flex items-center justify-center mx-auto mb-4`}>
                    <item.icon size={24} className="text-white" />
                  </div>
                  <div className="text-4xl font-black text-slate-900 dark:text-white">{item.value}</div>
                  <div className="text-xs text-slate-500 dark:text-white/40 mt-2 font-semibold uppercase tracking-wider">{item.label}</div>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                className="border-slate-200 dark:border-white/10 bg-transparent text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 h-12 rounded-xl font-semibold px-6"
                onClick={() => navigate(dashboardPaths.instructorCourses)}
              >
                <Eye className="mr-2" size={16} />
                Ouvrir le studio
              </Button>
            </div>
          </motion.div>

          {/* My Courses Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold tracking-tight flex items-center gap-3 text-slate-900 dark:text-white">
                <BookOpen className="text-blue-600" />
                Mes cours récents
              </h3>
              <Button variant="link" className="text-blue-600 hover:text-blue-700 transition-colors p-0" onClick={() => navigate(dashboardPaths.instructorCourses)}>
                Voir tout <ChevronRight size={16} />
              </Button>
            </div>

            {courses.length === 0 ? (
              <div className="p-12 rounded-[2rem] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/10 flex items-center justify-center mx-auto mb-4">
                  <BookOpen size={28} className="text-slate-300 dark:text-white/20" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Aucun cours pour le moment</h4>
                <p className="text-sm text-slate-500 dark:text-white/40 mb-6">Créez votre premier cours pour commencer.</p>
                <Button
                  onClick={() => {
                    setFeedback(null)
                    createCourse
                      .mutateAsync({
                        title: `Nouveau cours ${new Date().toLocaleDateString('fr-FR')}`,
                        description: 'Cours cree depuis le dashboard instructeur',
                        level: 'beginner',
                        price: 0,
                      })
                      .then(() => setFeedback({ type: 'success', message: 'Cours cree avec succes.' }))
                      .catch((err: unknown) => {
                        const message = err instanceof Error ? err.message : 'Echec de creation du cours.'
                        setFeedback({ type: 'error', message })
                      })
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 h-12 rounded-2xl font-bold shadow-none"
                >
                  <Plus className="mr-2" size={18} />
                  Créer un cours
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courses.slice(0, 4).map((course, idx) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group p-5 rounded-[2rem] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:border-blue-500/30 transition-all duration-500 flex flex-col gap-4"
                  >
                    <div className="flex gap-4">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-white/10 flex items-center justify-center">
                        <BookOpen size={24} className="text-slate-400 dark:text-white/30" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{course.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            course.is_published
                              ? 'bg-emerald-50 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-amber-50 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400'
                          }`}>
                            {course.is_published ? 'Publié' : 'Brouillon'}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-white/40 uppercase tracking-wider">{course.level}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <ArrowUpRight className="text-slate-300 dark:text-white/20 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" size={20} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-white/40">
                        <span className="flex items-center gap-1"><FileText size={12} /> {course.chapters_count} chapitres</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className={`h-8 rounded-lg text-xs font-semibold px-3 ${
                          course.is_published
                            ? 'border-amber-200 dark:border-amber-400/20 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-400/10'
                            : 'border-emerald-200 dark:border-emerald-400/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-400/10'
                        }`}
                        onClick={() => {
                          setFeedback(null)
                          publishCourse
                            .mutateAsync({ courseId: course.id, isPublished: !course.is_published })
                            .then(() => setFeedback({ type: 'success', message: course.is_published ? 'Cours dépublié.' : 'Cours publié !' }))
                            .catch((err: unknown) => {
                              const message = err instanceof Error ? err.message : 'Échec.'
                              setFeedback({ type: 'error', message })
                            })
                        }}
                        disabled={publishCourse.isPending}
                      >
                        {course.is_published ? 'Dépublier' : 'Publier'}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Area - Right (4 cols) */}
        <div className="lg:col-span-4 space-y-8">
          {/* Engagement Card */}
          <div className="p-8 rounded-[2.5rem] bg-blue-600 text-white relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-[40px]" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 rounded-2xl bg-white/20">
                  <TrendingUp size={24} className="text-white" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black">{data.stats.engagement_rate}%</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">Taux d'engagement</div>
                </div>
              </div>
              <h3 className="text-lg font-bold mb-2">Performance des cours</h3>
              <p className="text-sm text-white/70 mb-6 leading-relaxed">
                {data.stats.engagement_rate >= 70
                  ? 'Excellent ! Vos cours captivent vos apprenants.'
                  : 'Continuez à améliorer vos contenus pour augmenter l\'engagement.'}
              </p>
              <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${data.stats.engagement_rate}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-full bg-white rounded-full"
                />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-8 rounded-[2.5rem] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="text-blue-600" size={18} />
                Actions rapides
              </h3>
            </div>

            <div className="space-y-3">
              {[
                { icon: Plus, label: 'Mes cours', action: () => navigate(dashboardPaths.instructorCourses), color: 'bg-blue-600' },
                { icon: Users, label: 'Voir les étudiants', action: () => navigate(dashboardPaths.instructorStudents), color: 'bg-purple-600' },
                { icon: BarChart3, label: 'Statistiques', action: () => navigate(dashboardPaths.instructorStats), color: 'bg-emerald-600' },
                { icon: Clock, label: 'Messages récents', action: () => navigate(dashboardPaths.instructorMessages), color: 'bg-amber-600' },
              ].map((item, idx) => (
                <motion.button
                  key={item.label}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  onClick={item.action}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:border-blue-500/30 dark:hover:border-blue-400/20 transition-all group text-left"
                >
                  <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center flex-shrink-0`}>
                    <item.icon size={18} className="text-white" />
                  </div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.label}</span>
                  <ArrowUpRight size={16} className="ml-auto text-slate-300 dark:text-white/20 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Modules */}
          <div className="p-8 rounded-[2.5rem] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Star className="text-amber-500" size={18} />
              Modules instructeur
            </h3>
            <div className="space-y-4">
              {data.modules.map((module, idx) => (
                <motion.div
                  key={module.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-4 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:border-blue-500/20 dark:hover:border-blue-400/10 transition-colors"
                >
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{module.title}</div>
                  <div className="text-xs text-slate-500 dark:text-white/40 mt-1">{module.description}</div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 h-8 rounded-lg text-xs font-semibold border-slate-200 dark:border-white/10 text-slate-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-400/10 hover:border-blue-300 dark:hover:border-blue-400/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all px-3"
                    onClick={() => {
                      const modulePathByKey: Record<string, string> = {
                        'course-studio': dashboardPaths.instructorCourses,
                        'content-quality': dashboardPaths.instructorStats,
                        learners: dashboardPaths.instructorStudents,
                      }

                      navigate(modulePathByKey[module.key] ?? dashboardPaths.instructorCourses)
                    }}
                  >
                    {module.cta}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

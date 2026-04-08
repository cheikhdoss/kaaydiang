import { motion } from 'framer-motion'
import { BookOpen, CheckCircle2, FileText, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Gauge } from '@/components/ui/gauge'
import { dashboardPaths } from '../utils/navigation'
import { ActionFeedback } from './ActionFeedback'
import type { InstructorDashboardPayload } from '../services/dashboard.api'
import { useCreateInstructorCourse, useInstructorCourses, usePublishInstructorCourse } from '../hooks/useInstructorCourses'

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
    { icon: BookOpen, label: 'Cours crees', value: data.stats.courses_created },
    { icon: CheckCircle2, label: 'Publies', value: data.stats.courses_published },
    { icon: FileText, label: 'Chapitres', value: data.stats.chapters },
    { icon: TrendingUp, label: 'Engagement', value: `${data.stats.engagement_rate}%` },
  ]

  return (
    <>
      {feedback ? <div className='mb-4'><ActionFeedback type={feedback.type} message={feedback.message} /></div> : null}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
          <Gauge
            value={data.stats.engagement_rate}
            size="large"
            showValue
            colors={{
              primary: '#4e6eff',
              secondary: 'rgba(255,255,255,0.18)',
            }}
          />
          <p className="mt-4 text-center text-xs text-white/60">Engagement apprenants</p>
        </div>

        <div className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-5 lg:col-span-2">
          <h4 className="text-sm font-semibold text-white/85">Pipeline publication</h4>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
              <p className="text-2xl font-bold text-white">{data.pipeline.drafts}</p>
              <p className="text-xs text-white/65">Brouillons</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
              <p className="text-2xl font-bold text-white">{data.pipeline.ready_to_publish}</p>
              <p className="text-xs text-white/65">Prets a publier</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
              <p className="text-2xl font-bold text-white">{data.pipeline.pending_reviews}</p>
              <p className="text-xs text-white/65">Reviews en attente</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              className="bg-[#3054ff] text-white hover:bg-[#2445e8]"
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
              disabled={createCourse.isPending}
            >
              {createCourse.isPending ? 'Creation...' : 'Creer un cours'}
            </Button>
            <Button
              variant="outline"
              className="border-white/20 bg-transparent text-white hover:bg-white/10"
              onClick={() => {
                setFeedback({ type: 'success', message: 'Studio instructeur actif sur cette page.' })
                navigate(dashboardPaths.instructor)
              }}
            >
              Ouvrir studio
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-8 mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (index + 1) }}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#3054ff]/20">
              <stat.icon className="h-6 w-6 text-[#8ea0ff]" />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-white/65">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {data.modules.map((module) => (
          <div key={module.key} className="rounded-2xl border border-white/10 bg-black/35 p-5">
            <h4 className="mb-2 text-sm font-semibold text-white">{module.title}</h4>
            <p className="mb-4 text-xs text-white/65">{module.description}</p>
            <Button
              className="w-full bg-[#3054ff]/90 text-white hover:bg-[#2445e8]"
              onClick={() => {
                if (module.key === 'course-studio') {
                  setFeedback({ type: 'success', message: 'Studio cours pret pour vos nouvelles publications.' })
                  navigate(dashboardPaths.instructor)
                  return
                }
                if (module.key === 'content-quality') {
                  setFeedback({ type: 'success', message: 'Analyse qualite disponible dans les metriques du dashboard.' })
                  navigate(dashboardPaths.instructor)
                  return
                }
                if (module.key === 'learners') {
                  setFeedback({ type: 'success', message: 'Cohortes accessibles depuis votre espace instructeur.' })
                  navigate(dashboardPaths.instructor)
                  return
                }
                setFeedback({ type: 'success', message: `${module.cta} disponible dans l'espace instructeur.` })
              }}
            >
              {module.cta}
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-black/35 p-5">
        <h4 className="mb-4 text-sm font-semibold text-white/90">Mes cours (gestion rapide)</h4>
        <div className="space-y-3">
          {courses.length === 0 ? (
            <p className="text-sm text-white/60">Aucun cours disponible pour le moment.</p>
          ) : (
            courses.slice(0, 5).map((course) => (
              <div
                key={course.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{course.title}</p>
                  <p className="text-xs text-white/60">
                    Niveau: {course.level} | Chapitres: {course.chapters_count}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-white/20 bg-transparent text-white hover:bg-white/10"
                  onClick={() => {
                    setFeedback(null)
                    publishCourse
                      .mutateAsync({
                        courseId: course.id,
                        isPublished: !course.is_published,
                      })
                      .then(() => setFeedback({ type: 'success', message: 'Etat de publication mis a jour.' }))
                      .catch((err: unknown) => {
                        const message = err instanceof Error ? err.message : 'Echec de publication.'
                        setFeedback({ type: 'error', message })
                      })
                  }}
                  disabled={publishCourse.isPending}
                >
                  {course.is_published ? 'Depublier' : 'Publier'}
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}

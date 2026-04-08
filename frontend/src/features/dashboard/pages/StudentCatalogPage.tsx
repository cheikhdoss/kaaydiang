import { useState } from 'react'
import { Search, GraduationCap, Users, Clock, ArrowUpRight, Filter, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { resolveRoleDashboardPath } from '../utils/navigation'
import { DashboardShell } from '../components/DashboardShell'
import { ErrorState } from '../components/ErrorState'
import { LoadingState } from '../components/LoadingState'
import { ActionFeedback } from '../components/ActionFeedback'
import { useEnrollInCourse, useStudentCatalog } from '../hooks/useStudentLearning'
import type { DashboardRole } from '../services/dashboard.api'

const StudentCatalogPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { data: catalog = [], isLoading, isError, error, refetch } = useStudentCatalog()
  const enrollMutation = useEnrollInCourse()
  const [query, setQuery] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  if (!user) {
    return <LoadingState fullscreen />
  }

  const filtered = catalog.filter((course) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (
      course.title.toLowerCase().includes(q) ||
      (course.description ?? '').toLowerCase().includes(q) ||
      course.instructor.toLowerCase().includes(q)
    )
  })

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const handleNavigateRole = (role: DashboardRole) => {
    navigate(resolveRoleDashboardPath(role))
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  const errorMessage = error instanceof Error ? error.message : 'Impossible de charger le catalogue.'

  return (
    <DashboardShell
      title='Catalogue des cours'
      subtitle='Explorez et découvrez de nouvelles compétences'
      role='student'
      viewerRole={user.role}
      userName={`${user.first_name} ${user.last_name}`}
      userEmail={user.email}
      onLogout={handleLogout}
      onNavigateRole={handleNavigateRole}
    >
      <div className="space-y-8">
        {/* Search & Filter Header */}
        <div className='flex flex-col md:flex-row items-center gap-4 bg-slate-50 dark:bg-white/5 p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 backdrop-blur-xl'>
          <div className='relative flex-1 group'>
            <Search className='absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-white/20 group-focus-within:text-[#3054ff] transition-colors' />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className='h-14 w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/40 pl-12 pr-4 text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400 dark:placeholder:text-white/20 focus:border-[#3054ff] transition-all'
              placeholder='Rechercher un cours, un instructeur ou une compétence...'
            />
          </div>
          <Button variant="outline" className="h-14 px-6 rounded-2xl border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-white/10 hidden sm:flex items-center gap-2">
            <Filter size={18} />
            Filtres
          </Button>
        </div>

        {feedback && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <ActionFeedback type={feedback.type} message={feedback.message} />
          </motion.div>
        )}

        {isLoading ? <LoadingState /> : null}
        {!isLoading && isError ? <ErrorState message={errorMessage} onRetry={() => void refetch()} /> : null}

        {!isLoading && !isError && (
          <>
            {filtered.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200 dark:border-white/5">
                  <Search size={24} className="text-slate-400 dark:text-white/20" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Aucun résultat</h3>
                <p className="text-slate-400 dark:text-white/40 text-sm">Nous n'avons trouvé aucun cours correspondant à votre recherche.</p>
              </div>
            ) : (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className='grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3'
              >
                {filtered.map((course) => (
                  <motion.div
                    key={course.id}
                    variants={item}
                    whileHover={{ y: -5 }}
                    className='group rounded-[2.5rem] border border-slate-200 dark:border-white/5 bg-white dark:bg-white/5 overflow-hidden flex flex-col hover:border-[#3054ff]/30 transition-all duration-500 shadow-sm dark:shadow-none'
                  >
                    <div className="aspect-[16/10] relative overflow-hidden">
                      <img
                        src={course.thumbnail || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80'}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform duration-1000"
                        alt={course.title}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute top-4 left-4">
                        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#3054ff] text-[10px] font-black uppercase tracking-widest text-white shadow-lg">
                          <Sparkles size={10} />
                          Nouveau
                        </div>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                        <div className="px-3 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/80">
                          {course.level}
                        </div>
                        <div className="text-lg font-black text-white">
                          {typeof course.price === 'number' ? `${course.price}€` : course.price}
                        </div>
                      </div>
                    </div>

                    <div className='p-8 flex-1 flex flex-col'>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-full bg-[#3054ff]/20 flex items-center justify-center">
                          <GraduationCap size={12} className="text-[#3054ff]" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-widest">Technologie</span>
                      </div>

                      <h3 className='text-xl font-bold text-slate-900 dark:text-white mb-3 line-clamp-2 group-hover:text-[#3054ff] transition-colors'>
                        {course.title}
                      </h3>
                      <p className='text-sm text-slate-400 dark:text-white/40 mb-6 line-clamp-2 leading-relaxed'>
                        {course.description || 'Maîtrisez ces compétences avec notre parcours pédagogique complet et structuré.'}
                      </p>

                      <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest">
                          <Users size={14} />
                          <span>Instructeur: {course.instructor}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest justify-end">
                          <Clock size={14} />
                          <span>{course.chapters_count || 0} Chapitres</span>
                        </div>
                      </div>

                      <Button
                        className='w-full h-12 bg-slate-50 dark:bg-white/5 hover:bg-[#3054ff] text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 hover:border-[#3054ff] hover:text-white transition-all rounded-xl font-bold group'
                        disabled={enrollMutation.isPending}
                        onClick={() => {
                          setFeedback(null)
                          enrollMutation
                            .mutateAsync(course.id)
                            .then(() => {
                              setFeedback({ type: 'success', message: `${course.title} ajouté à vos cours.` })
                            })
                            .catch((err: unknown) => {
                              const message = err instanceof Error ? err.message : "Échec de l'inscription."
                              setFeedback({ type: 'error', message })
                            })
                        }}
                      >
                        {enrollMutation.isPending ? 'Chargement...' : 'Rejoindre le cours'}
                        <ArrowUpRight size={18} className="ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  )
}

export default StudentCatalogPage

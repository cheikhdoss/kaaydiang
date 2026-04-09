import { useState, useMemo } from 'react'
import { Search, GraduationCap, ArrowUpRight, Sparkles, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { resolveRoleDashboardPath } from '../utils/navigation'
import { DashboardShell } from '../components/DashboardShell'
import { ErrorState } from '../components/ErrorState'
import { LoadingState } from '../components/LoadingState'
import { ActionFeedback } from '../components/ActionFeedback'
import { useEnrollInCourse, useStudentCatalog } from '../hooks/useStudentLearning'
import type { DashboardRole } from '../services/dashboard.api'

type LevelFilter = 'all' | 'beginner' | 'intermediate' | 'advanced'

const StudentCatalogPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { data: catalog = [], isLoading, isError, refetch } = useStudentCatalog()
  const enrollMutation = useEnrollInCourse()
  
  const [query, setQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const filtered = useMemo(() => {
    return catalog.filter((course) => {
      const q = query.trim().toLowerCase()
      const matchesQuery = !q || 
        course.title.toLowerCase().includes(q) ||
        (course.description ?? '').toLowerCase().includes(q) ||
        course.instructor.toLowerCase().includes(q)
      
      const matchesLevel = levelFilter === 'all' || course.level === levelFilter
      
      return matchesQuery && matchesLevel
    })
  }, [catalog, query, levelFilter])

  if (!user) return <LoadingState fullscreen />

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

  return (
    <DashboardShell
      title='Catalogue'
      subtitle='Découvrez votre prochain défi'
      role='student'
      viewerRole={user.role}
      userName={`${user.first_name} ${user.last_name}`}
      userEmail={user.email}
      onLogout={handleLogout}
      onNavigateRole={handleNavigateRole}
    >
      <div className="space-y-8">
        {/* Search & Filter Section */}
        <div className="space-y-4">
          <div className='flex flex-col lg:flex-row items-stretch lg:items-center gap-4'>
            <div className='relative flex-1 group'>
              <Search className='absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors' />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className='h-16 w-full rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] pl-14 pr-12 text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all shadow-sm'
                placeholder='Que voulez-vous apprendre aujourd’hui ?'
              />
              {query && (
                <button 
                  onClick={() => setQuery('')}
                  className="absolute right-5 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                  <X size={14} className="text-slate-400" />
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-white/5 rounded-[1.5rem] border border-slate-200 dark:border-white/5">
              {(['all', 'beginner', 'intermediate', 'advanced'] as LevelFilter[]).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLevelFilter(lvl)}
                  className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    levelFilter === lvl 
                      ? 'bg-white dark:bg-white/10 text-blue-600 dark:text-white shadow-sm' 
                      : 'text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {lvl === 'all' ? 'Tous' : lvl === 'beginner' ? 'Débutant' : lvl === 'intermediate' ? 'Inter' : 'Avancé'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {feedback && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <ActionFeedback type={feedback.type} message={feedback.message} />
          </motion.div>
        )}

        {isLoading ? <LoadingState /> : isError ? <ErrorState message="Erreur de chargement" onRetry={() => void refetch()} /> : (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                {filtered.length} cours disponibles
              </h3>
            </div>

            {filtered.length === 0 ? (
              <div className="py-32 text-center rounded-[3rem] border border-dashed border-slate-200 dark:border-white/10">
                <Search size={40} className="mx-auto mb-4 text-slate-300 dark:text-white/10" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Aucun cours trouvé</h3>
                <p className="text-slate-400 dark:text-white/40 text-sm">Ajustez vos filtres ou votre recherche.</p>
              </div>
            ) : (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className='grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3'
              >
                {filtered.map((course) => (
                  <motion.div
                    key={course.id}
                    variants={item}
                    className='group flex flex-col bg-white dark:bg-[#050608] rounded-[2.5rem] border border-slate-200 dark:border-white/5 overflow-hidden hover:border-blue-600/30 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/5'
                  >
                    {/* Thumbnail Zone */}
                    <div className="aspect-[16/10] relative overflow-hidden">
                      {course.thumbnail ? (
                        <img
                          src={`${import.meta.env.VITE_API_URL.replace('/api', '')}/storage/${course.thumbnail}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          alt={course.title}
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                          <GraduationCap size={48} className="text-slate-300 dark:text-white/10" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                      
                      <div className="absolute top-4 left-4 flex gap-2">
                        <span className="px-3 py-1 rounded-full bg-white/90 dark:bg-black/60 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">
                          {course.level}
                        </span>
                      </div>

                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-blue-600 text-white shadow-xl">
                          <Sparkles size={12} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Nouveau</span>
                        </div>
                        <div className="text-xl font-black text-white drop-shadow-lg">
                          {course.price === 0 ? 'GRATUIT' : `${course.price.toLocaleString('fr-FR')} FCFA`}
                        </div>
                      </div>
                    </div>

                    <div className='p-8 flex-1 flex flex-col'>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-600/10 flex items-center justify-center">
                          <GraduationCap size={14} className="text-blue-600" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-widest">Masterclass</span>
                      </div>

                      <h3 className='text-xl font-black text-slate-900 dark:text-white mb-3 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors'>
                        {course.title}
                      </h3>
                      
                      <p className='text-sm text-slate-500 dark:text-white/40 mb-8 line-clamp-2 leading-relaxed'>
                        {course.description || 'Apprenez les meilleures pratiques avec cet instructeur certifié.'}
                      </p>

                      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/5 mb-8">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center font-black text-[10px] text-slate-500">
                            {course.instructor.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest">Instructeur</p>
                            <p className="text-xs font-bold text-slate-700 dark:text-white/70">{course.instructor}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest">Contenu</p>
                          <p className="text-xs font-bold text-slate-700 dark:text-white/70">{course.chapters_count} chapitres</p>
                        </div>
                      </div>

                      <Button
                        className='w-full h-14 bg-slate-900 dark:bg-blue-600 hover:bg-blue-700 text-white transition-all rounded-[1.25rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/10'
                        disabled={enrollMutation.isPending}
                        onClick={() => {
                          setFeedback(null)
                          enrollMutation
                            .mutateAsync(course.id)
                            .then(() => {
                              setFeedback({ type: 'success', message: `${course.title} ajouté à votre dashboard.` })
                            })
                            .catch((err: unknown) => {
                              const message = err instanceof Error ? err.message : "Erreur d'inscription."
                              setFeedback({ type: 'error', message })
                            })
                        }}
                      >
                        {enrollMutation.isPending ? 'Action...' : 'S\'inscrire maintenant'}
                        <ArrowUpRight size={18} className="ml-2" />
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

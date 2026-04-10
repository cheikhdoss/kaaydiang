import { LifeBuoy, MessageSquare, Book, Mail, ChevronRight, Search, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { resolveRoleDashboardPath } from '../utils/navigation'
import { DashboardShell } from '../components/DashboardShell'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { useDashboardData } from '../hooks/useDashboardData'
import type { DashboardRole } from '../services/dashboard.api'

const StudentHelpPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { data, isLoading, isError, error, refetch } = useDashboardData('student')

  if (!user) return <LoadingState fullscreen />

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const handleNavigateRole = (role: DashboardRole) => {
    navigate(resolveRoleDashboardPath(role))
  }

  if (isLoading) return <LoadingState fullscreen />
  if (isError) return <ErrorState message={error instanceof Error ? error.message : 'Erreur'} onRetry={() => void refetch()} />
  if (!data || data.role !== 'student') return <ErrorState message="Données invalides" onRetry={() => void refetch()} />

  const faqs = [
    { q: 'Comment accéder à un cours?', a: 'Rendez-vous dans "Mes Cours" et cliquez sur le cours souhaité. Vous pouvez aussi parcourir le catalogue pour vous inscrire à de nouveaux cours.' },
    { q: 'Comment télécharger un certificat?', a: 'Une fois un cours terminé avec succès, rendez-vous dans "Certificats" et cliquez sur "Télécharger" à côté du certificat souhaité.' },
    { q: 'Comment soumettre un devoir?', a: 'Dans la page devoirs, cliquez sur "Soumettre" à côté du devoir en question. Vous pouvez joindre un fichier PDF ou ZIP.' },
    { q: 'Comment contacter un instructeur?', a: 'Utilisez la section "Messages" pour envoyer un message direct à votre instructeur depuis la page du cours ou la liste des conversations.' },
    { q: 'Comment suivre ma progression?', a: 'Rendez-vous dans "Progression" pour voir vos statistiques détaillées, barres de progression par cours, et graphiques d\'activité.' },
    { q: 'Comment changer mon mot de passe?', a: 'Allez dans "Profil" puis la section "Sécurité". Cliquez sur "Modifier" à côté de "Mot de passe" et suivez les instructions.' },
  ]

  return (
    <DashboardShell
      title="Centre d'Aide"
      subtitle="Besoin d'assistance? Nous sommes là pour vous aider"
      role="student"
      viewerRole={user.role}
      userName={`${user.first_name} ${user.last_name}`}
      userEmail={user.email}
      onLogout={handleLogout}
      onNavigateRole={handleNavigateRole}
    >
      <div className="max-w-4xl space-y-10">
        {/* Search */}
        <div className="relative">
          <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30" />
          <input
            type="text"
            placeholder="Rechercher une question, un problème..."
            className="w-full pl-14 pr-6 py-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-500 transition-all text-base"
          />
        </div>

        {/* Quick Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: MessageSquare, label: 'Chat en direct', desc: 'Réponse sous 5 min', color: 'from-blue-500 to-indigo-600' },
            { icon: Mail, label: 'Email', desc: 'support@kaydjangue.com', color: 'from-emerald-500 to-teal-600' },
            { icon: Book, label: 'Documentation', desc: 'Guides et tutoriels', color: 'from-purple-500 to-pink-600' },
          ].map((item, i) => (
            <motion.button
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-left hover:border-blue-500/30 dark:hover:border-blue-400/20 transition-all group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 shadow-lg`}>
                <item.icon size={22} className="text-white" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">{item.label}</h4>
              <p className="text-xs text-slate-500 dark:text-white/40 mt-1">{item.desc}</p>
            </motion.button>
          ))}
        </div>

        {/* FAQ */}
        <div className="rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-white/5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <LifeBuoy size={20} className="text-blue-600" />
              Questions fréquentes
            </h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="p-6 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-400/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{i + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{faq.q}</h4>
                      <ChevronRight size={16} className="text-slate-400 dark:text-white/20 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex-shrink-0 transition-all group-hover:translate-x-1" />
                    </div>
                    <p className="text-sm text-slate-500 dark:text-white/50 mt-2">{faq.a}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Contact Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative p-8 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2">Vous n'avez pas trouvé votre réponse?</h3>
            <p className="text-blue-100 text-sm mb-6 max-w-md">Notre équipe de support est disponible 7j/7 pour vous aider. Envoyez-nous un message et nous vous répondrons dans les plus brefs délais.</p>
            <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-blue-600 text-sm font-bold hover:bg-blue-50 transition-colors">
              <Mail size={16} />
              Contacter le support
              <ExternalLink size={14} />
            </button>
          </div>
        </motion.div>
      </div>
    </DashboardShell>
  )
}

export default StudentHelpPage

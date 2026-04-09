import { User, Mail, Phone, MapPin, Calendar, Camera, Lock, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { resolveRoleDashboardPath } from '../utils/navigation'
import { DashboardShell } from '../components/DashboardShell'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { useDashboardData } from '../hooks/useDashboardData'
import type { DashboardRole } from '../services/dashboard.api'

const StudentProfilePage: React.FC = () => {
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

  const stats = data.stats

  return (
    <DashboardShell
      title="Mon Profil"
      subtitle="Gérez vos informations personnelles"
      role="student"
      viewerRole={user.role}
      userName={`${user.first_name} ${user.last_name}`}
      userEmail={user.email}
      onLogout={handleLogout}
      onNavigateRole={handleNavigateRole}
    >
      <div className="max-w-4xl space-y-8">
        {/* Profile Header */}
        <div className="relative p-8 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-bold border-2 border-white/30">
                {user.first_name?.[0]}{user.last_name?.[0]}
              </div>
              <button className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-white text-blue-600 flex items-center justify-center shadow-lg hover:bg-blue-50 transition-colors">
                <Camera size={14} />
              </button>
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold">{user.first_name} {user.last_name}</h2>
              <p className="text-blue-100 text-sm">{user.email}</p>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-medium">Étudiant</span>
                <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-medium">Inscrit depuis {user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <User size={20} className="text-blue-600" />
            Informations personnelles
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { icon: User, label: 'Prénom', value: user.first_name || 'Non renseigné' },
              { icon: User, label: 'Nom', value: user.last_name || 'Non renseigné' },
              { icon: Mail, label: 'Email', value: user.email },
              { icon: Phone, label: 'Téléphone', value: '+221 7X XXX XX XX' },
              { icon: MapPin, label: 'Localisation', value: 'Dakar, Sénégal' },
              { icon: Calendar, label: 'Date d\'inscription', value: user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : '-' },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <item.icon size={14} className="text-slate-400 dark:text-white/40" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 dark:text-white/30 uppercase tracking-wider">{item.label}</div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white mt-0.5">{item.value}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Shield size={20} className="text-blue-600" />
            Statistiques
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Cours inscrits', value: stats.totalEnrollments ?? stats.active_courses },
              { label: 'Cours terminés', value: stats.completedCourses ?? data.progress.completed_lessons },
              { label: 'Certificats', value: stats.totalCertificates ?? stats.certificates },
              { label: 'Quiz réussis', value: stats.totalQuizzes ?? data.progress.total_lessons },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-4 rounded-xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5"
              >
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stat.value}</div>
                <div className="text-xs text-slate-500 dark:text-white/40 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Lock size={20} className="text-blue-600" />
            Sécurité
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5">
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">Mot de passe</div>
                <div className="text-xs text-slate-500 dark:text-white/40">Dernière modification il y a 30 jours</div>
              </div>
              <button className="px-4 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-400/10 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-400/20 transition-colors">
                Modifier
              </button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5">
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">Authentification à deux facteurs</div>
                <div className="text-xs text-slate-500 dark:text-white/40">Non activée</div>
              </div>
              <button className="px-4 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-400/10 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-400/20 transition-colors">
                Activer
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}

export default StudentProfilePage

import { Award, Trophy, Download, Share2, ShieldCheck, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { resolveRoleDashboardPath } from '../utils/navigation'
import { DashboardShell } from '../components/DashboardShell'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { useStudentSupplementCertificates, useDownloadCertificate } from '../hooks/useStudentSupplements'
import { Button } from '@/components/ui/button'
import type { DashboardRole } from '../services/dashboard.api'

const StudentCertificatesPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { data: certificates = [], isLoading, isError, error, refetch } = useStudentSupplementCertificates()
  const downloadCertificate = useDownloadCertificate()

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

  const handleDownload = async (certId: number) => {
    try {
      await downloadCertificate.mutateAsync(certId)
    } catch {
      // fallback: open verification page
      window.open(`/api/student/certificates/${certId}/view`, '_blank')
    }
  }

  return (
    <DashboardShell
      title='Mes Certificats'
      subtitle='Célébrez vos réussites et partagez vos diplômes'
      role='student'
      viewerRole={user.role}
      userName={`${user.first_name} ${user.last_name}`}
      userEmail={user.email}
      onLogout={handleLogout}
      onNavigateRole={handleNavigateRole}
    >
      <div className="space-y-10">
        {/* Certificate Hero Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-10 rounded-[2.5rem] bg-gradient-to-br from-[#3054ff]/10 via-[#9791fe]/5 to-transparent border border-slate-200 dark:border-white/5 backdrop-blur-xl relative overflow-hidden"
        >
          <div className="absolute top-[-10%] right-[-5%] w-64 h-64 bg-[#3054ff]/10 blur-[80px] rounded-full" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="w-20 h-20 rounded-full bg-white dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/10">
              <Trophy size={40} className="text-[#3054ff]" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{certificates.length} Certificats Obtenus</h2>
              <p className="text-slate-400 dark:text-white/40 text-sm max-w-xl">Chaque certificat témoigne de votre expertise et de votre engagement dans votre parcours d'apprentissage.</p>
            </div>
            <Button className="bg-[#3054ff] hover:bg-[#1943f2] text-white px-8 h-12 rounded-xl font-bold">
              Partager mon profil
            </Button>
          </div>
        </motion.div>

        {certificates.length === 0 ? (
          <div className="py-20 text-center bg-slate-50 dark:bg-white/5 rounded-[2.5rem] border border-slate-200 dark:border-white/5 border-dashed">
            <div className="w-16 h-16 bg-white dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-200 dark:border-white/5">
              <Award size={32} className="text-slate-300 dark:text-white/10" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Pas encore de certificats</h3>
            <p className="text-slate-400 dark:text-white/40 text-sm max-w-xs mx-auto mb-8">Terminez vos cours et réussissez vos examens pour débloquer vos premiers diplômes.</p>
            <Button variant="outline" className="border-slate-200 dark:border-white/10 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl h-12 px-8">
              Continuer mes cours
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {certificates.map((cert, idx) => (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -8 }}
                className="group relative rounded-[2rem] bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/5 overflow-hidden transition-all hover:border-[#3054ff]/50 shadow-sm dark:shadow-none"
              >
                {/* Visual Representation of Certificate */}
                <div className="aspect-[1.4/1] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-[#1a1a1a] dark:to-black p-8 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(48,84,255,0.05),transparent_70%)]" />
                  <Award size={64} className="text-[#3054ff]/20 mb-4 group-hover:scale-110 transition-transform duration-700" />
                  <div className="text-center relative z-10">
                    <div className="text-[10px] font-black text-[#3054ff] uppercase tracking-[0.3em] mb-2">KayyDiang Certified</div>
                    <div className="text-xs font-bold text-slate-700 dark:text-white/80 line-clamp-2 px-4">{cert.course.title}</div>
                  </div>
                  <div className="absolute bottom-4 left-0 right-0 px-6 flex justify-between items-center opacity-40">
                    <div className="text-[8px] font-mono text-slate-500 dark:text-white/50">{cert.certificate_code}</div>
                    <ShieldCheck size={12} className="text-emerald-500" />
                  </div>
                </div>

                <div className="p-6">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1 group-hover:text-[#3054ff] transition-colors line-clamp-1">{cert.course.title}</h4>
                  <p className="text-[10px] text-slate-400 dark:text-white/40 uppercase tracking-widest font-black mb-6">Délivré le {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString('fr-FR') : 'N/A'}</p>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 h-10 rounded-xl border-slate-200 dark:border-white/5 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#3054ff] hover:border-[#3054ff] hover:text-white transition-all"
                      onClick={() => handleDownload(cert.id)}
                      disabled={downloadCertificate.isPending}
                    >
                      <Download size={14} className="mr-2" />
                      {downloadCertificate.isPending ? '...' : 'PDF'}
                    </Button>
                    <Button variant="outline" className="w-10 h-10 rounded-xl border-slate-200 dark:border-white/5 bg-white dark:bg-white/5 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-white/10 transition-all p-0">
                      <Share2 size={14} />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Verification Banner */}
        <div className="p-8 rounded-[2rem] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <ShieldCheck className="text-emerald-500" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Vérification Officielle</h3>
              <p className="text-xs text-slate-400 dark:text-white/40">Tous nos certificats sont vérifiables via un code unique et infalsifiable.</p>
            </div>
          </div>
          <div className="relative w-full md:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20 group-focus-within:text-[#3054ff] transition-colors" size={14} />
            <input
              placeholder="Code de vérification..."
              className="w-full h-10 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 text-[10px] text-slate-900 dark:text-white outline-none focus:border-[#3054ff] transition-all placeholder:text-slate-400 dark:placeholder:text-white/20"
            />
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}

export default StudentCertificatesPage

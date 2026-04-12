import { Clock, AlertCircle, CheckCircle2, FileText, ArrowUpRight, Upload, X, Paperclip, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { resolveRoleDashboardPath } from '../utils/navigation'
import { DashboardShell } from '../components/DashboardShell'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { useStudentSupplementDeadlines, useSubmitAssignment } from '../hooks/useStudentSupplements'
import { Button } from '@/components/ui/button'
import type { DashboardRole } from '../services/dashboard.api'

const ACCEPTED_ASSIGNMENT_MIME_TYPES = new Set([
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
])

const ACCEPTED_ASSIGNMENT_EXTENSIONS = ['.pdf', '.zip']

const configuredMaxFileMb = Number(import.meta.env.VITE_ASSIGNMENT_MAX_FILE_MB ?? 2)
const MAX_ASSIGNMENT_FILE_MB = Number.isFinite(configuredMaxFileMb) && configuredMaxFileMb > 0
  ? configuredMaxFileMb
  : 2
const MAX_ASSIGNMENT_FILE_BYTES = MAX_ASSIGNMENT_FILE_MB * 1024 * 1024
const MAX_ASSIGNMENT_FILE_LABEL = Number.isInteger(MAX_ASSIGNMENT_FILE_MB)
  ? String(MAX_ASSIGNMENT_FILE_MB)
  : MAX_ASSIGNMENT_FILE_MB.toFixed(1)

const isAcceptedAssignmentFile = (file: File) => {
  const lowerName = file.name.toLowerCase()
  return ACCEPTED_ASSIGNMENT_MIME_TYPES.has(file.type) || ACCEPTED_ASSIGNMENT_EXTENSIONS.some((ext) => lowerName.endsWith(ext))
}

const StudentAssignmentsPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { data: assignments = [], isLoading, isError, error, refetch } = useStudentSupplementDeadlines()
  const submitAssignment = useSubmitAssignment()

  const [selectedAssignment, setSelectedAssignment] = useState<number | null>(null)
  const [viewingSubmission, setViewingSubmission] = useState<{
    title: string
    course_title: string | null
    status: string
    submitted_at: string | null
    score: number | null
    feedback: string | null
  } | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [note, setNote] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const pending = assignments.filter(a => a.status === 'pending')
  const submitted = assignments.filter(a => a.status !== 'pending')

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return
    setSubmitError(null)
    const incomingFiles = Array.from(files)

    const invalidTypeFiles = incomingFiles.filter((file) => !isAcceptedAssignmentFile(file))
    const oversizedFiles = incomingFiles.filter((file) => file.size > MAX_ASSIGNMENT_FILE_BYTES)
    const validFiles = incomingFiles.filter((file) => isAcceptedAssignmentFile(file) && file.size <= MAX_ASSIGNMENT_FILE_BYTES)

    if (invalidTypeFiles.length > 0 || oversizedFiles.length > 0) {
      const errors: string[] = []

      if (invalidTypeFiles.length > 0) {
        errors.push('Formats autorisés: PDF ou ZIP.')
      }

      if (oversizedFiles.length > 0) {
        errors.push(`Taille max par fichier: ${MAX_ASSIGNMENT_FILE_LABEL} Mo.`)
      }

      setSubmitError(errors.join(' '))
    }

    if (validFiles.length === 0) {
      return
    }

    setSelectedFiles(prev => [...prev, ...validFiles])
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (assignmentId: number | null) => {
    if (!assignmentId) {
      setSubmitError('Aucun devoir sélectionné.')
      return
    }

    if (!selectedFiles.length) {
      setSubmitError('Ajoutez au moins un fichier PDF ou ZIP avant d\'envoyer.')
      return
    }

    setSubmitError(null)

    try {
      await submitAssignment.mutateAsync({
        assignmentId,
        files: selectedFiles,
        note: note || undefined,
      })
      setSelectedFiles([])
      setNote('')
      setSelectedAssignment(null)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Impossible d\'envoyer la soumission.')
    }
  }

  return (
    <DashboardShell
      title='Mes Devoirs'
      subtitle='Gérez vos soumissions et consultez vos retours'
      role='student'
      viewerRole={user.role}
      userName={`${user.first_name} ${user.last_name}`}
      userEmail={user.email}
      onLogout={handleLogout}
      onNavigateRole={handleNavigateRole}
    >
      <div className="space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            <section className="space-y-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <AlertCircle className="text-orange-500 dark:text-orange-400" />
                À rendre prochainement
              </h3>
              {pending.length === 0 ? (
                <div className="p-10 rounded-[2rem] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 border-dashed text-center">
                  <CheckCircle2 className="mx-auto mb-4 text-emerald-500/20 dark:text-emerald-400/20" size={40} />
                  <p className="text-slate-400 dark:text-white/40 text-sm">Bravo ! Vous n'avez aucun devoir en attente.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pending.map((a, idx) => (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-6 rounded-[2rem] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:border-orange-400/30 transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-orange-400/10 flex items-center justify-center">
                          <FileText className="text-orange-500 dark:text-orange-400" size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors">{a.title}</h4>
                          <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-slate-400 dark:text-white/20 uppercase tracking-widest">
                            <span>{a.course_title}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-white/10" />
                            <span className="text-orange-400/60">Échéance: {a.due_date ? new Date(a.due_date).toLocaleDateString('fr-FR') : 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white border-0 rounded-xl text-xs h-10 px-6 shadow-none"
                        onClick={() => setSelectedAssignment(a.id)}
                      >
                        Soumettre
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <CheckCircle2 className="text-emerald-500 dark:text-emerald-400" />
                Historique des soumissions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {submitted.map((a) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-5 rounded-[2rem] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex flex-col justify-between min-h-[160px]"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ${
                          a.status === 'reviewed' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                        }`}>
                          {a.status === 'reviewed' ? 'Corrigé' : 'En attente'}
                        </div>
                        {a.submitted_at && <span className="text-[9px] text-slate-400 dark:text-white/20 font-bold">{new Date(a.submitted_at).toLocaleDateString()}</span>}
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">{a.title}</h4>
                      <p className="text-[10px] text-slate-400 dark:text-white/40 mt-1">{a.course_title}</p>
                    </div>
                    <Button
                      variant="link"
                      className="text-blue-600 p-0 h-auto self-start text-xs font-bold mt-4 hover:text-blue-700"
                      onClick={() => setViewingSubmission({
                        title: a.title,
                        course_title: a.course_title,
                        status: a.status,
                        submitted_at: a.submitted_at,
                        score: (a as any).score ?? null,
                        feedback: (a as any).feedback ?? null,
                      })}
                    >
                      Voir les détails <ArrowUpRight size={14} className="ml-1" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            </section>
          </div>

          {/* Guidelines Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="p-8 rounded-[2.5rem] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 backdrop-blur-xl">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Instructions</h3>
              <ul className="space-y-4">
                {[
                  'Respectez les formats PDF ou ZIP uniquement.',
                  `Taille maximale des fichiers : ${MAX_ASSIGNMENT_FILE_LABEL} Mo.`,
                  'Une seule soumission autorisée par devoir.',
                  'Consultez les critères de notation avant de valider.'
                ].map((text, i) => (
                  <li key={i} className="flex gap-3 text-xs text-slate-400 dark:text-white/40 leading-relaxed">
                    <span className="text-blue-600 font-black">{i + 1}.</span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-8 rounded-[2.5rem] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <Clock className="text-slate-300 dark:text-white/10" size={40} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Besoin d'aide ?</h3>
              <p className="text-xs text-slate-400 dark:text-white/40 leading-relaxed mb-6">Si vous rencontrez des difficultés techniques pour soumettre votre travail, contactez le support.</p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-10 text-xs shadow-none">
                Contacter un mentor
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Submission Modal */}
      <AnimatePresence>
        {selectedAssignment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => { setSelectedAssignment(null); setSelectedFiles([]); setNote(''); setSubmitError(null) }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/5 rounded-3xl p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Soumettre le devoir</h3>
                <button onClick={() => { setSelectedAssignment(null); setSelectedFiles([]); setNote(''); setSubmitError(null) }} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                  <X size={18} className="text-slate-400" />
                </button>
              </div>

              {/* Drop Zone */}
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-400/5' : 'border-slate-200 dark:border-white/10 hover:border-blue-400'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.zip"
                  multiple
                  className="hidden"
                  onChange={e => handleFileSelect(e.target.files)}
                />
                <Upload size={32} className="mx-auto mb-3 text-slate-400 dark:text-white/20" />
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Glissez vos fichiers ici</p>
                <p className="text-xs text-slate-400 dark:text-white/30 mt-1">ou cliquez pour parcourir</p>
                <p className="text-[10px] text-slate-400 dark:text-white/20 mt-2">PDF ou ZIP — Max {MAX_ASSIGNMENT_FILE_LABEL} Mo</p>
              </div>

              {/* File List */}
              {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {selectedFiles.map((file, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                      <Paperclip size={14} className="text-blue-600" />
                      <span className="text-xs font-medium text-slate-900 dark:text-white flex-1 truncate">{file.name}</span>
                      <span className="text-[10px] text-slate-400">{(file.size / 1024 / 1024).toFixed(1)} Mo</span>
                      <button onClick={() => removeFile(i)} className="p-1 hover:bg-red-50 dark:hover:bg-red-400/10 rounded">
                        <X size={14} className="text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Note */}
              <div className="mt-4">
                <label className="text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider">Note (optionnel)</label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={3}
                  placeholder="Ajouter un message à l'instructeur..."
                  className="w-full mt-2 px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                />
              </div>

              {submitError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
                  {submitError}
                </div>
              )}

              {/* Submit */}
              <Button
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold h-12 shadow-none"
                onClick={() => handleSubmit(selectedAssignment)}
                disabled={selectedFiles.length === 0 || submitAssignment.isPending}
              >
                <Send size={16} className="mr-2" />
                {submitAssignment.isPending ? 'Envoi...' : 'Envoyer la soumission'}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {viewingSubmission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setViewingSubmission(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/5 rounded-3xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Détails du devoir</h3>
                <button onClick={() => setViewingSubmission(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                  <X size={18} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 dark:text-white/30 uppercase tracking-wider">Devoir</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{viewingSubmission.title}</p>
                  <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">{viewingSubmission.course_title ?? '—'}</p>
                </div>

                {/* Status Badge */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 dark:text-white/30 uppercase tracking-wider">Statut</p>
                  <div className="mt-1">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      viewingSubmission.status === 'reviewed'
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : viewingSubmission.status === 'rejected'
                        ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                        : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                    }`}>
                      {viewingSubmission.status === 'reviewed' ? (
                        <><CheckCircle2 size={12} /> Corrigé</>
                      ) : viewingSubmission.status === 'rejected' ? (
                        <><AlertCircle size={12} /> Refusé</>
                      ) : (
                        <><Clock size={12} /> En attente</>
                      )}
                    </span>
                  </div>
                </div>

                {/* Score */}
                {viewingSubmission.status === 'reviewed' && viewingSubmission.score !== null && (
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-400/10 border border-emerald-200 dark:border-emerald-400/20">
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Note</p>
                    <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{viewingSubmission.score}<span className="text-lg text-emerald-500 dark:text-emerald-500">/100</span></p>
                  </div>
                )}

                {/* Submitted At */}
                {viewingSubmission.submitted_at && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 dark:text-white/30 uppercase tracking-wider">Soumis le</p>
                    <p className="text-sm text-slate-700 dark:text-white/70 mt-1">
                      {new Date(viewingSubmission.submitted_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                )}

                {/* Feedback */}
                {viewingSubmission.status === 'reviewed' && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                    <p className="text-xs font-semibold text-slate-400 dark:text-white/30 uppercase tracking-wider mb-2">Commentaire instructeur</p>
                    <p className="text-xs text-slate-600 dark:text-white/50">
                      {viewingSubmission.feedback || "Aucun commentaire ajouté."}
                    </p>
                  </div>
                )}
              </div>

              <Button
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold h-12 shadow-none"
                onClick={() => setViewingSubmission(null)}
              >
                Fermer
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardShell>
  )
}

export default StudentAssignmentsPage

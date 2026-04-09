import { ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, Trophy, Target, Timer, Flag, Layers, X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useCallback, useEffect, useMemo } from 'react'
import confetti from 'canvas-confetti'
import { useAuth } from '@/hooks/useAuth'
import { resolveRoleDashboardPath } from '../utils/navigation'
import { DashboardShell } from '../components/DashboardShell'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { Button } from '@/components/ui/button'
import { useStudentQuiz, useSubmitStudentQuiz } from '../hooks/useStudentQuiz'
import type { DashboardRole, StudentQuizSubmitAnswer } from '../services/dashboard.api'

const StudentQuizPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { quizId } = useParams<{ quizId: string }>()
  const numericQuizId = Number(quizId)

  const { data: quiz, isLoading, isError, error, refetch } = useStudentQuiz(numericQuizId)
  const submitStudentQuiz = useSubmitStudentQuiz()

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, { selected_option_ids?: number[]; value?: string; text?: string }>>({})
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  
  // Timer State
  const [secondsElapsed, setSecondsElapsed] = useState(0)
  const [isQuizStarted, setIsQuizStarted] = useState(false)

  if (!user) return <LoadingState fullscreen />

  useEffect(() => {
    if (quiz && !isQuizStarted) {
      setIsQuizStarted(true)
    }
  }, [quiz, isQuizStarted])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined
    if (isQuizStarted) {
      interval = setInterval(() => {
        setSecondsElapsed(prev => prev + 1)
      }, 1000)
    }
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isQuizStarted])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const handleNavigateRole = (role: DashboardRole) => {
    navigate(resolveRoleDashboardPath(role))
  }

  const handleBack = () => {
    navigate(-1)
  }

  const questions = useMemo(() => quiz?.questions ?? [], [quiz])
  const currentQuestion = questions[currentQuestionIndex]
  const totalQuestions = questions.length

  const handleAnswerChange = useCallback((questionId: number, answerData: { selected_option_ids?: number[]; value?: string; text?: string }) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerData }))
    setSubmitError(null)
  }, [])

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const validateAllAnswers = (): string | null => {
    for (const q of questions) {
      const ans = answers[q.id]
      if (!ans) return `La question "${q.question_text.substring(0, 30)}..." n'a pas de réponse.`
      if (q.question_type === 'multiple_choice') {
        if (!ans.selected_option_ids || ans.selected_option_ids.length === 0) {
          return `Sélectionnez au moins une option pour la question ${questions.indexOf(q) + 1}.`
        }
      } else if (q.question_type === 'true_false') {
        if (!ans.value) return `Répondez par Vrai ou Faux à la question ${questions.indexOf(q) + 1}.`
      } else if (q.question_type === 'short_answer') {
        if (!ans.text || ans.text.trim().length === 0) {
          return `Rédigez une réponse pour la question ${questions.indexOf(q) + 1}.`
        }
      }
    }
    return null
  }

  const handleSubmit = async () => {
    const validationError = validateAllAnswers()
    if (validationError) {
      setSubmitError(validationError)
      setShowConfirmModal(false)
      return
    }

    setShowConfirmModal(false)
    setSubmitError(null)

    const payloadAnswers: StudentQuizSubmitAnswer[] = questions.map(q => {
      const ans = answers[q.id]
      return {
        question_id: q.id,
        answer_data: {
          selected_option_ids: ans?.selected_option_ids,
          value: ans?.value,
          text: ans?.text,
        },
      }
    })

    try {
      await submitStudentQuiz.mutateAsync({
        quizId: numericQuizId,
        payload: { answers: payloadAnswers },
      })
      
      void confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      })

      navigate(`/dashboard/student/quiz/${quizId}/result`, { replace: true })
    } catch {
      setSubmitError('Erreur lors de la soumission du quiz. Veuillez réessayer.')
    }
  }

  const progressPercent = totalQuestions > 0 ? Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100) : 0

  if (isLoading) return <LoadingState fullscreen />
  if (isError) return <ErrorState message={error instanceof Error ? error.message : 'Erreur lors du chargement du quiz'} onRetry={() => void refetch()} />
  if (!quiz) return <ErrorState message="Quiz non trouvé" onRetry={() => void refetch()} />

  return (
    <DashboardShell
      title={quiz.title}
      subtitle={`Quiz d'évaluation · Question ${currentQuestionIndex + 1} sur ${totalQuestions}`}
      role="student"
      viewerRole={user.role}
      userName={`${user.first_name} ${user.last_name}`}
      userEmail={user.email}
      onLogout={handleLogout}
      onNavigateRole={handleNavigateRole}
    >
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Quiz Area */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Immersive Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-white/5 p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-xl shadow-blue-500/5">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBack}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/40 hover:text-blue-600 dark:hover:text-white transition-all"
                >
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white line-clamp-1">{quiz.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 dark:bg-blue-400/10 dark:text-blue-400 px-2 py-0.5 rounded-full">En cours</span>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-white/20">• Question {currentQuestionIndex + 1} / {totalQuestions}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-900 text-white dark:bg-blue-600 px-4 py-2.5 rounded-2xl shadow-lg">
                <Timer size={18} className="text-blue-400 dark:text-white/70" />
                <span className="text-sm font-black font-mono">{formatTime(secondsElapsed)}</span>
              </div>
            </div>

            {/* Question Progress Bar */}
            <div className="px-2 space-y-2">
               <div className="h-2.5 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden border border-slate-300/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                />
              </div>
            </div>

            {/* Question Card */}
            <AnimatePresence mode="wait">
              {currentQuestion && (
                <motion.div
                  key={currentQuestion.id}
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.02, y: -10 }}
                  className="p-8 md:p-12 rounded-[2.5rem] bg-white dark:bg-[#050608] border border-slate-200 dark:border-white/5 shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Trophy size={120} className="text-blue-600" />
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                       <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${
                        currentQuestion.question_type === 'multiple_choice'
                          ? 'bg-blue-600 text-white'
                          : currentQuestion.question_type === 'true_false'
                            ? 'bg-purple-600 text-white'
                            : 'bg-amber-500 text-white'
                      }`}>
                        {currentQuestion.question_type === 'multiple_choice' ? 'Choix multiples' : currentQuestion.question_type === 'true_false' ? 'Vrai ou Faux' : 'Réponse courte'}
                      </span>
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-400 dark:text-white/20">
                        <Target size={14} /> {currentQuestion.points} pts
                      </div>
                    </div>

                    <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-10 leading-snug">
                      {currentQuestion.question_text}
                    </h3>

                    {/* Interaction Zone */}
                    <div className="space-y-4">
                      {currentQuestion.question_type === 'multiple_choice' && (
                        <div className="grid grid-cols-1 gap-3">
                          {currentQuestion.options.map((option, idx) => {
                            const optId = Number(option.id)
                            const isSelected = (answers[currentQuestion.id]?.selected_option_ids ?? []).includes(optId)
                            return (
                              <motion.label
                                key={option.id}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                className={`flex items-center gap-4 p-5 rounded-3xl border-2 cursor-pointer transition-all ${
                                  isSelected
                                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-600/10 shadow-lg shadow-blue-500/10'
                                    : 'border-slate-100 dark:border-white/5 hover:border-blue-300 dark:hover:border-white/20 bg-slate-50/50 dark:bg-white/5'
                                }`}
                              >
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs transition-all ${
                                  isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-white/30'
                                }`}>
                                  {String.fromCharCode(65 + idx)}
                                </div>
                                <input
                                  type="checkbox"
                                  className="sr-only"
                                  checked={isSelected}
                                  onChange={() => {
                                    const current = answers[currentQuestion.id]?.selected_option_ids ?? []
                                    const updated = current.includes(optId) ? current.filter(id => id !== optId) : [...current, optId]
                                    handleAnswerChange(currentQuestion.id, { selected_option_ids: updated })
                                  }}
                                />
                                <span className={`text-sm font-bold ${isSelected ? 'text-blue-900 dark:text-white' : 'text-slate-600 dark:text-white/60'}`}>
                                  {option.option_text}
                                </span>
                                {isSelected && <CheckCircle2 size={18} className="ml-auto text-blue-600" />}
                              </motion.label>
                            )
                          })}
                        </div>
                      )}

                      {currentQuestion.question_type === 'true_false' && (
                        <div className="flex gap-4">
                          {[
                            { label: 'Vrai', value: 'true', color: 'emerald' },
                            { label: 'Faux', value: 'false', color: 'red' },
                          ].map(opt => {
                            const isSelected = answers[currentQuestion.id]?.value === opt.value
                            return (
                              <motion.label
                                key={opt.value}
                                whileHover={{ y: -4 }}
                                whileTap={{ scale: 0.95 }}
                                className={`flex-1 flex flex-col items-center justify-center gap-4 p-8 rounded-[2rem] border-4 cursor-pointer transition-all ${
                                  isSelected
                                    ? opt.value === 'true' 
                                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                      : 'border-red-500 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                                    : 'border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 text-slate-400 dark:text-white/20 hover:border-slate-200'
                                }`}
                              >
                                <input
                                  type="radio"
                                  className="sr-only"
                                  checked={isSelected}
                                  onChange={() => handleAnswerChange(currentQuestion.id, { value: opt.value })}
                                />
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isSelected ? 'bg-white shadow-md' : 'bg-slate-200 dark:bg-white/10'}`}>
                                  {opt.value === 'true' ? <CheckCircle2 size={24} /> : <X size={24} />}
                                </div>
                                <span className="text-xl font-black uppercase tracking-widest">{opt.label}</span>
                              </motion.label>
                            )
                          })}
                        </div>
                      )}

                      {currentQuestion.question_type === 'short_answer' && (
                        <textarea
                          value={answers[currentQuestion.id]?.text ?? ''}
                          onChange={e => handleAnswerChange(currentQuestion.id, { text: e.target.value })}
                          placeholder="Tapez votre réponse ici..."
                          rows={6}
                          className="w-full p-6 rounded-[2rem] border-2 border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-600 focus:bg-white dark:focus:bg-white/10 transition-all outline-none font-bold"
                        />
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4">
               <Button
                variant="ghost"
                onClick={handlePrev}
                disabled={currentQuestionIndex === 0}
                className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs"
              >
                <ArrowLeft size={16} className="mr-2" /> Précédent
              </Button>

              {currentQuestionIndex < totalQuestions - 1 ? (
                <Button
                  onClick={handleNext}
                  className="h-14 px-10 rounded-2xl bg-slate-900 text-white dark:bg-blue-600 font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/20"
                >
                  Suivant <ArrowRight size={16} className="ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={() => setShowConfirmModal(true)}
                  className="h-14 px-10 rounded-2xl bg-emerald-500 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/20"
                >
                  <Flag size={16} className="mr-2" /> Terminer le quiz
                </Button>
              )}
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-white/5 p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-xl">
               <h4 className="text-sm font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Layers size={16} className="text-blue-600" /> Progression
              </h4>
              <div className="grid grid-cols-4 gap-2">
                {questions.map((q, i) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(i)}
                    className={`aspect-square rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                      i === currentQuestionIndex 
                        ? 'bg-blue-600 text-white scale-110 shadow-lg' 
                        : answers[q.id] 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-white/20 hover:bg-slate-200'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 dark:bg-blue-700 p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
                <Target size={100} />
              </div>
              <h4 className="text-lg font-black mb-2">Objectif : {quiz.pass_score}%</h4>
              <p className="text-xs text-white/60 leading-relaxed">
                Répondez correctement à un maximum de questions pour obtenir votre certificat. Prenez votre temps, la précision compte !
              </p>
            </div>

            {submitError && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20"
              >
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1">
                  <AlertTriangle size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Attention</span>
                </div>
                <p className="text-xs font-bold text-red-700 dark:text-red-300">{submitError}</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Modern Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-[#0f1118] p-10 rounded-[3rem] shadow-2xl border border-slate-200 dark:border-white/10"
            >
              <div className="w-20 h-20 rounded-3xl bg-blue-600 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-500/40">
                <Flag size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white text-center mb-4">Bravo, vous avez fini !</h3>
              <p className="text-sm text-slate-500 dark:text-white/40 text-center mb-10 leading-relaxed">
                Vous avez répondu à {Object.keys(answers).length} questions sur {totalQuestions}. Voulez-vous soumettre vos réponses maintenant ?
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => void handleSubmit()}
                  disabled={submitStudentQuiz.isPending}
                  className="h-14 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/30"
                >
                  {submitStudentQuiz.isPending ? 'Analyse en cours...' : 'Oui, soumettre mes réponses'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowConfirmModal(false)}
                  className="h-14 rounded-2xl font-black uppercase tracking-widest text-xs"
                >
                  Continuer à réviser
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardShell>
  )
}

export default StudentQuizPage

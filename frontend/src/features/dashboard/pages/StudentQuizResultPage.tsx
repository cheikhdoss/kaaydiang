import { ArrowLeft, CheckCircle2, XCircle, Trophy, Award, BookOpen, Target, RotateCcw, ChevronRight } from 'lucide-react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { resolveRoleDashboardPath, dashboardPaths } from '../utils/navigation'
import { DashboardShell } from '../components/DashboardShell'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { useStudentQuizResult } from '../hooks/useStudentQuiz'
import type { DashboardRole } from '../services/dashboard.api'
import type { StudentQuizAnswerDetail } from '../services/dashboard.api'

const StudentQuizResultPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { quizId } = useParams<{ quizId: string }>()
  const [searchParams] = useSearchParams()
  const attemptIdParam = searchParams.get('attemptId')
  const numericQuizId = Number(quizId)
  const numericAttemptId = attemptIdParam ? Number(attemptIdParam) : undefined

  const { data: result, isLoading, isError, error, refetch } = useStudentQuizResult(numericQuizId, numericAttemptId)

  const [expandedAnswer, setExpandedAnswer] = useState<number | null>(null)

  if (!user) return <LoadingState fullscreen />

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const handleNavigateRole = (role: DashboardRole) => {
    navigate(resolveRoleDashboardPath(role))
  }

  const handleRetry = () => {
    navigate(`/dashboard/student/quiz/${quizId}`, { replace: true })
  }

  const handleBackToCourse = () => {
    navigate(dashboardPaths.studentCourses, { replace: true })
  }

  if (isLoading) return <LoadingState fullscreen />
  if (isError) return <ErrorState message={error instanceof Error ? error.message : 'Erreur lors du chargement du resultat'} onRetry={() => void refetch()} />
  if (!result) return <ErrorState message="Resultat non trouve" onRetry={() => void refetch()} />

  const { quiz, attempt, summary, answers } = result
  const scorePercent = summary.total_questions > 0 ? Math.round((summary.correct_answers / summary.total_questions) * 100) : 0
  const isPassed = attempt.is_passed

  return (
    <DashboardShell
      title="Resultat du quiz"
      subtitle={quiz.title}
      role="student"
      viewerRole={user.role}
      userName={`${user.first_name} ${user.last_name}`}
      userEmail={user.email}
      onLogout={handleLogout}
      onNavigateRole={handleNavigateRole}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-white/40 hover:text-[#3054ff] dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Retour
        </button>

        {/* Score Hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-10 rounded-[2.5rem] border relative overflow-hidden ${
            isPassed
              ? 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20'
              : 'bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20'
          }`}
        >
          <div className={`absolute top-[-20%] right-[-10%] w-[400px] h-[400px] blur-[100px] rounded-full ${
            isPassed ? 'bg-emerald-500/10' : 'bg-red-500/10'
          }`} />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            {/* Score Circle */}
            <div className="relative w-36 h-36 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="currentColor"
                  className="text-slate-200 dark:text-white/10"
                  strokeWidth="8"
                />
                <motion.circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="currentColor"
                  className={isPassed ? 'text-emerald-500' : 'text-red-500'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: 327 }}
                  animate={{ strokeDashoffset: 327 - (327 * scorePercent) / 100 }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  strokeDasharray={327}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-black ${isPassed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {scorePercent}%
                </span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest">Score</span>
              </div>
            </div>

            {/* Result Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">{quiz.title}</h2>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${
                  isPassed
                    ? 'bg-emerald-500 text-white'
                    : 'bg-red-500 text-white'
                }`}>
                  {isPassed ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                  {isPassed ? 'Reussi' : 'Non reussi'}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-white/40 mb-4">
                Tente le {attempt.attempted_at ? new Date(attempt.attempted_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'date inconnue'}
                {attempt.id ? ` — Tentative #${attempt.id}` : ''}
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-white/70">{summary.correct_answers} correctes</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <XCircle size={14} className="text-red-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-white/70">{summary.incorrect_answers} incorrectes</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <Award size={14} className="text-[#3054ff]" />
                  <span className="text-xs font-bold text-slate-700 dark:text-white/70">{summary.total_points_earned}/{summary.total_points_possible} pts</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: 'Questions totales',
              value: summary.total_questions,
              icon: BookOpen,
              color: 'from-blue-500 to-indigo-600',
            },
            {
              label: 'Score de passage',
              value: `${quiz.pass_score}%`,
              icon: Target,
              color: isPassed ? 'from-emerald-500 to-teal-500' : 'from-red-500 to-rose-500',
            },
            {
              label: 'Points obtenus',
              value: `${summary.total_points_earned}/${summary.total_points_possible}`,
              icon: Trophy,
              color: 'from-amber-500 to-orange-500',
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                <stat.icon size={18} className="text-white" />
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white">{stat.value}</div>
              <div className="text-xs text-slate-500 dark:text-white/40 mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Detailed Answer Review */}
        <div className="rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Correction detaillee</h3>
          <div className="space-y-4">
            <AnimatePresence>
              {answers.map((answer: StudentQuizAnswerDetail, idx: number) => {
                const isExpanded = expandedAnswer === idx
                return (
                  <motion.div
                    key={answer.question_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-white/5"
                  >
                    {/* Question Header */}
                    <button
                      onClick={() => setExpandedAnswer(isExpanded ? null : idx)}
                      className="w-full p-5 flex items-center gap-4 text-left hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        answer.is_correct
                          ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                      }`}>
                        {answer.is_correct ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400 dark:text-white/30">Q{idx + 1}</span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{answer.question_text}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            answer.question_type === 'multiple_choice'
                              ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                              : answer.question_type === 'true_false'
                                ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400'
                                : 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                          }`}>
                            {answer.question_type === 'multiple_choice'
                              ? 'Choix multiples'
                              : answer.question_type === 'true_false'
                                ? 'Vrai/Faux'
                                : 'Reponse courte'}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-white/30 font-bold">
                            {answer.points_earned}/{answer.points_possible} pts
                          </span>
                        </div>
                      </div>
                      <ChevronRight
                        size={18}
                        className={`text-slate-400 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      />
                    </button>

                    {/* Expanded Answer Detail */}
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 space-y-4 border-t border-slate-100 dark:border-white/5 pt-4">
                          {/* Student's Answer */}
                          <div>
                            <div className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest mb-2">Votre reponse</div>
                            {answer.question_type === 'multiple_choice' && answer.all_options && (
                              <div className="space-y-2">
                                {answer.all_options.map(opt => (
                                  <div
                                    key={opt.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg text-sm font-medium ${
                                      opt.was_selected && opt.is_correct
                                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20'
                                        : opt.was_selected && !opt.is_correct
                                          ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/20'
                                          : !opt.was_selected && opt.is_correct
                                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20'
                                            : 'bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-white/40 border border-slate-100 dark:border-white/5'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 flex-1">
                                      {opt.was_selected ? (
                                        opt.is_correct
                                          ? <CheckCircle2 size={14} className="text-emerald-500" />
                                          : <XCircle size={14} className="text-red-500" />
                                      ) : opt.is_correct ? (
                                        <CheckCircle2 size={14} className="text-emerald-500" />
                                      ) : (
                                        <div className="w-3.5 h-3.5 rounded border border-slate-300 dark:border-white/20" />
                                      )}
                                      <span>{opt.text}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] font-bold">
                                      {opt.was_selected && !opt.is_correct && (
                                        <span className="text-red-500">Votre choix</span>
                                      )}
                                      {!opt.was_selected && opt.is_correct && (
                                        <span className="text-emerald-500">Correct</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {answer.question_type === 'true_false' && (
                              <div className="flex gap-3">
                                <div className={`flex-1 p-3 rounded-lg text-center text-sm font-bold ${
                                  answer.your_answer?.value === 'true'
                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20'
                                    : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/20'
                                }`}>
                                  {answer.your_answer?.value === 'true' ? 'Vrai' : 'Faux'} — Votre choix
                                </div>
                                {answer.correct_answer && (
                                  <div className="flex-1 p-3 rounded-lg text-center text-sm font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20">
                                    {answer.correct_answer === 'true' ? 'Vrai' : 'Faux'} — Reponse correcte
                                  </div>
                                )}
                              </div>
                            )}
                            {answer.question_type === 'short_answer' && (
                              <div className="space-y-3">
                                <div className="p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-700 dark:text-white/70">
                                  {String(answer.your_answer?.text ?? answer.your_answer?.value ?? '—')}
                                </div>
                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Correction manuelle requise</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Correct Answer (if wrong and not short_answer) */}
                          {!answer.is_correct && answer.question_type !== 'short_answer' && answer.correct_options && answer.correct_options.length > 0 && (
                            <div>
                              <div className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest mb-2">Reponse correcte</div>
                              <div className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                                {answer.correct_options.map(o => o.text).join(', ')}
                              </div>
                            </div>
                          )}

                          {answer.note && (
                            <div className="text-xs text-slate-400 dark:text-white/30 italic border-l-2 border-slate-200 dark:border-white/10 pl-3">
                              {answer.note}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pb-8">
          <button
            onClick={handleRetry}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-sm bg-[#3054ff] text-white hover:bg-[#1943f2] transition-all shadow-[0_4px_12px_rgba(48,84,255,0.3)]"
          >
            <RotateCcw size={16} />
            Retenter le quiz
          </button>
          <button
            onClick={handleBackToCourse}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-sm border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/70 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
          >
            Retour au cours
          </button>
        </div>
      </div>
    </DashboardShell>
  )
}

export default StudentQuizResultPage

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchStudentQuizzes,
  fetchStudentQuiz,
  submitStudentQuiz,
  fetchStudentQuizResult,
  type StudentQuizSubmitPayload,
} from '../services/dashboard.api'

export const useStudentQuizzes = () =>
  useQuery({
    queryKey: ['student-quizzes'],
    queryFn: fetchStudentQuizzes,
    staleTime: 30_000,
    retry: 1,
  })

export const useStudentQuiz = (quizId: number | null) =>
  useQuery({
    queryKey: ['student-quiz', quizId],
    queryFn: () => fetchStudentQuiz(quizId as number),
    enabled: typeof quizId === 'number' && quizId > 0,
    staleTime: 0, // Never cache — always fresh for quiz taking
    retry: 1,
  })

export const useSubmitStudentQuiz = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ quizId, payload }: { quizId: number; payload: StudentQuizSubmitPayload }) =>
      submitStudentQuiz(quizId, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['student-quiz', variables.quizId] })
      void queryClient.invalidateQueries({ queryKey: ['student-quiz-result', variables.quizId] })
      void queryClient.invalidateQueries({ queryKey: ['student-supplements', 'grades'] })
      void queryClient.invalidateQueries({ queryKey: ['student-supplements', 'notifications'] })
    },
  })
}

export const useStudentQuizResult = (quizId: number | null, attemptId?: number) =>
  useQuery({
    queryKey: ['student-quiz-result', quizId, attemptId],
    queryFn: () => fetchStudentQuizResult(quizId as number, attemptId),
    enabled: typeof quizId === 'number' && quizId > 0,
    staleTime: 0,
    retry: 1,
  })

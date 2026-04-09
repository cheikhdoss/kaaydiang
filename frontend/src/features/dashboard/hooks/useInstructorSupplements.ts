import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createInstructorQuiz,
  deleteInstructorQuiz,
  fetchInstructorCalendar,
  fetchInstructorQuizzes,
  fetchInstructorAssignments,
  fetchInstructorAssignmentSubmissions,
  fetchInstructorStudents,
  fetchInstructorMessages,
  fetchInstructorMessageThread,
  gradeInstructorAssignmentSubmission,
  markInstructorThreadRead,
  sendInstructorMessage,
  updateInstructorQuiz,
  fetchInstructorStats,
  fetchInstructorNotifications,
  fetchInstructorProfile,
  fetchQuizQuestions,
  createQuizQuestion,
  updateQuizQuestion,
  deleteQuizQuestion,
  createQuizOption,
  updateQuizOption,
  deleteQuizOption,
  createInstructorAssignment,
  updateInstructorAssignment,
  deleteInstructorAssignment,
  type InstructorAssignmentFilters,
  type InstructorAssignmentSubmissionFilters,
  type InstructorQuizFilters,
  type CreateInstructorQuizPayload,
  type GradeInstructorSubmissionPayload,
  type UpdateInstructorQuizPayload,
  type CreateQuizQuestionPayload,
  type UpdateQuizQuestionPayload,
  type CreateQuizOptionPayload,
  type UpdateQuizOptionPayload,
  type CreateInstructorAssignmentPayload,
  type UpdateInstructorAssignmentPayload,
} from '../services/dashboard.api'

export const useInstructorCalendar = () =>
  useQuery({
    queryKey: ['instructor-supplements', 'calendar'],
    queryFn: fetchInstructorCalendar,
    staleTime: 30_000,
    retry: 1,
  })

export const useInstructorQuizzes = (filters?: InstructorQuizFilters) =>
  useQuery({
    queryKey: ['instructor-supplements', 'quizzes', filters ?? {}],
    queryFn: () => fetchInstructorQuizzes(filters),
    staleTime: 60_000,
    retry: 1,
  })

export const useInstructorAssignments = (filters?: InstructorAssignmentFilters) =>
  useQuery({
    queryKey: ['instructor-supplements', 'assignments', filters ?? {}],
    queryFn: () => fetchInstructorAssignments(filters),
    staleTime: 30_000,
    retry: 1,
  })

export const useInstructorAssignmentSubmissions = (
  assignmentId: number | null,
  filters?: InstructorAssignmentSubmissionFilters,
) =>
  useQuery({
    queryKey: ['instructor-supplements', 'assignments', assignmentId, 'submissions', filters ?? {}],
    queryFn: () => fetchInstructorAssignmentSubmissions(assignmentId as number, filters),
    enabled: typeof assignmentId === 'number' && assignmentId > 0,
    staleTime: 20_000,
    retry: 1,
  })

export const useInstructorStudents = () =>
  useQuery({
    queryKey: ['instructor-supplements', 'students'],
    queryFn: fetchInstructorStudents,
    staleTime: 60_000,
    retry: 1,
  })

export const useInstructorMessages = () =>
  useQuery({
    queryKey: ['instructor-supplements', 'messages'],
    queryFn: fetchInstructorMessages,
    staleTime: 30_000,
    retry: 1,
  })

export const useInstructorMessageThread = (studentId: number | null) =>
  useQuery({
    queryKey: ['instructor-supplements', 'messages', 'thread', studentId],
    queryFn: () => fetchInstructorMessageThread(studentId as number),
    enabled: typeof studentId === 'number' && studentId > 0,
    staleTime: 20_000,
    retry: 1,
  })

export const useSendInstructorMessage = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: sendInstructorMessage,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['instructor-supplements', 'messages'] })
      void queryClient.invalidateQueries({
        queryKey: ['instructor-supplements', 'messages', 'thread', variables.studentId],
      })
    },
  })
}

export const useMarkInstructorThreadRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (studentId: number) => markInstructorThreadRead(studentId),
    onSuccess: (_data, studentId) => {
      void queryClient.invalidateQueries({ queryKey: ['instructor-supplements', 'messages'] })
      void queryClient.invalidateQueries({ queryKey: ['instructor-supplements', 'messages', 'thread', studentId] })
    },
  })
}

export const useInstructorStats = () =>
  useQuery({
    queryKey: ['instructor-supplements', 'stats'],
    queryFn: fetchInstructorStats,
    staleTime: 30_000,
    retry: 1,
  })

export const useCreateInstructorQuiz = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateInstructorQuizPayload) => createInstructorQuiz(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['instructor-supplements', 'quizzes'] })
      void queryClient.invalidateQueries({ queryKey: ['instructor-supplements', 'calendar'] })
      void queryClient.invalidateQueries({ queryKey: ['instructor-supplements', 'notifications'] })
    },
  })
}

export const useUpdateInstructorQuiz = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ quizId, payload }: { quizId: number; payload: UpdateInstructorQuizPayload }) => updateInstructorQuiz(quizId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['instructor-supplements', 'quizzes'] })
      void queryClient.invalidateQueries({ queryKey: ['instructor-supplements', 'calendar'] })
      void queryClient.invalidateQueries({ queryKey: ['instructor-supplements', 'notifications'] })
    },
  })
}

export const useDeleteInstructorQuiz = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (quizId: number) => deleteInstructorQuiz(quizId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['instructor-supplements', 'quizzes'] })
      void queryClient.invalidateQueries({ queryKey: ['instructor-supplements', 'calendar'] })
      void queryClient.invalidateQueries({ queryKey: ['instructor-supplements', 'notifications'] })
    },
  })
}

export const useGradeInstructorAssignmentSubmission = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      assignmentId,
      submissionId,
      payload,
    }: {
      assignmentId: number
      submissionId: number
      payload: GradeInstructorSubmissionPayload
    }) => gradeInstructorAssignmentSubmission(assignmentId, submissionId, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['instructor-supplements', 'assignments', variables.assignmentId, 'submissions'],
      })
      void queryClient.invalidateQueries({ queryKey: ['instructor-supplements', 'assignments'] })
      void queryClient.invalidateQueries({ queryKey: ['instructor-supplements', 'messages'] })
      void queryClient.invalidateQueries({ queryKey: ['instructor-supplements', 'notifications'] })
      void queryClient.invalidateQueries({ queryKey: ['student-supplements', 'messages'] })
      void queryClient.invalidateQueries({ queryKey: ['student-supplements', 'grades'] })
      void queryClient.invalidateQueries({ queryKey: ['student-supplements', 'notifications'] })
    },
  })
}

export const useInstructorNotifications = () =>
  useQuery({
    queryKey: ['instructor-supplements', 'notifications'],
    queryFn: fetchInstructorNotifications,
    staleTime: 30_000,
    retry: 1,
  })

export const useInstructorProfile = () =>
  useQuery({
    queryKey: ['instructor-supplements', 'profile'],
    queryFn: fetchInstructorProfile,
    staleTime: 60_000,
    retry: 1,
  })

// ==================== QUIZ QUESTIONS ====================

export const useQuizQuestions = (quizId: number | null) =>
  useQuery({
    queryKey: ['instructor-supplements', 'quiz-questions', quizId],
    queryFn: () => fetchQuizQuestions(quizId as number),
    enabled: typeof quizId === 'number' && quizId > 0,
    staleTime: 10_000,
    retry: 1,
  })

export const useCreateQuizQuestion = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ quizId, payload }: { quizId: number; payload: CreateQuizQuestionPayload }) =>
      createQuizQuestion(quizId, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['instructor-supplements', 'quiz-questions', variables.quizId],
      })
      void queryClient.invalidateQueries({ queryKey: ['instructor-supplements', 'quizzes'] })
    },
  })
}

export const useUpdateQuizQuestion = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ questionId, payload }: { questionId: number; payload: UpdateQuizQuestionPayload }) =>
      updateQuizQuestion(questionId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['instructor-supplements', 'quiz-questions'] })
      void queryClient.invalidateQueries({ queryKey: ['instructor-supplements', 'quizzes'] })
    },
  })
}

export const useDeleteQuizQuestion = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (questionId: number) => deleteQuizQuestion(questionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['instructor-supplements', 'quiz-questions'] })
      void queryClient.invalidateQueries({ queryKey: ['instructor-supplements', 'quizzes'] })
    },
  })
}

export const useCreateQuizOption = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ questionId, payload }: { questionId: number; payload: CreateQuizOptionPayload }) =>
      createQuizOption(questionId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['instructor-supplements', 'quiz-questions'] })
    },
  })
}

export const useUpdateQuizOption = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ optionId, payload }: { optionId: number; payload: UpdateQuizOptionPayload }) =>
      updateQuizOption(optionId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['instructor-supplements', 'quiz-questions'] })
    },
  })
}

export const useDeleteQuizOption = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (optionId: number) => deleteQuizOption(optionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['instructor-supplements', 'quiz-questions'] })
    },
  })
}

// ==================== ASSIGNMENTS CRUD ====================

export const useCreateInstructorAssignment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateInstructorAssignmentPayload) => createInstructorAssignment(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['instructor-supplements', 'assignments'] })
      void queryClient.invalidateQueries({ queryKey: ['instructor-supplements', 'calendar'] })
    },
  })
}

export const useUpdateInstructorAssignment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ assignmentId, payload }: { assignmentId: number; payload: UpdateInstructorAssignmentPayload }) =>
      updateInstructorAssignment(assignmentId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['instructor-supplements', 'assignments'] })
    },
  })
}

export const useDeleteInstructorAssignment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (assignmentId: number) => deleteInstructorAssignment(assignmentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['instructor-supplements', 'assignments'] })
    },
  })
}

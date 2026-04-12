import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import api from '@/services/api'
import {
  fetchStudentCalendar,
  fetchStudentCourseDetail,
  fetchStudentGrades,
  fetchStudentMessageThread,
  fetchStudentMessages,
  markStudentMessageThreadRead,
  markAllStudentNotificationsRead,
  markStudentNotificationRead,
  sendStudentMessage,
  fetchStudentNotifications,
  fetchStudentSupplementCertificates,
  fetchStudentSupplementDeadlines,
  fetchStudentSupplementNextLesson,
  type StudentCourseDetailPayload,
  type StudentMessageItem,
  type LessonBlock,
} from '../services/dashboard.api'

interface ConversationMessage {
  id: string
  sender: 'me' | 'instructor'
  text: string
  date: string
}

export const useStudentCalendar = () =>
  useQuery({
    queryKey: ['student-supplements', 'calendar'],
    queryFn: fetchStudentCalendar,
    staleTime: 30_000,
    retry: 1,
  })

export const useStudentMessages = () => {
  const messagesQuery = useQuery({
    queryKey: ['student-supplements', 'messages'],
    queryFn: fetchStudentMessages,
    staleTime: 30_000,
    retry: 1,
  })

  const messages = messagesQuery.data ?? []

  const [selectedMessage, setSelectedMessage] = useState<StudentMessageItem | null>(null)

  const threadQuery = useQuery({
    queryKey: ['student-supplements', 'messages', 'thread', selectedMessage?.id ?? null],
    queryFn: () => fetchStudentMessageThread(selectedMessage?.id as number),
    enabled: !!selectedMessage,
    staleTime: 20_000,
    retry: 1,
  })

  const conversation: ConversationMessage[] = useMemo(() => {
    if (!selectedMessage || !threadQuery.data) {
      return []
    }

    return threadQuery.data.messages.map((msg) => ({
      id: msg.id,
      sender: msg.sender,
      text: msg.text,
      date: msg.date ? new Date(msg.date).toLocaleDateString('fr-FR') : 'Aujourd\'hui',
    }))
  }, [selectedMessage, threadQuery.data])

  const selectMessage = (message: StudentMessageItem) => {
    setSelectedMessage(message)
  }

  const clearSelectedMessage = () => {
    setSelectedMessage(null)
  }

  return {
    messages,
    conversation,
    isMessagesLoading: messagesQuery.isLoading,
    isThreadLoading: !!selectedMessage && threadQuery.isLoading,
    isError: messagesQuery.isError || threadQuery.isError,
    error: messagesQuery.error ?? threadQuery.error,
    selectedMessage,
    selectMessage,
    clearSelectedMessage,
    participant: threadQuery.data?.participant ?? null,
    course: threadQuery.data?.course ?? null,
    refetchThread: threadQuery.refetch,
  }
}

export const useSendStudentMessage = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ conversationId, message }: { conversationId: number; message: string }) =>
      sendStudentMessage({ conversationId, message }),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['student-supplements', 'messages'] })
      void queryClient.invalidateQueries({ queryKey: ['student-supplements', 'messages', 'thread', variables.conversationId] })
    },
  })
}

export const useMarkStudentMessageThreadRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (conversationId: number) => markStudentMessageThreadRead(conversationId),
    onSuccess: (_data, conversationId) => {
      void queryClient.invalidateQueries({ queryKey: ['student-supplements', 'messages'] })
      void queryClient.invalidateQueries({ queryKey: ['student-supplements', 'messages', 'thread', conversationId] })
    },
  })
}

export const useStudentSupplementCertificates = () =>
  useQuery({
    queryKey: ['student-supplements', 'certificates'],
    queryFn: fetchStudentSupplementCertificates,
    staleTime: 60_000,
    retry: 1,
  })

export const useStudentSupplementDeadlines = () =>
  useQuery({
    queryKey: ['student-supplements', 'deadlines'],
    queryFn: fetchStudentSupplementDeadlines,
    staleTime: 30_000,
    retry: 1,
  })

export const useStudentSupplementNextLesson = () =>
  useQuery({
    queryKey: ['student-supplements', 'next-lesson'],
    queryFn: fetchStudentSupplementNextLesson,
    staleTime: 30_000,
    retry: 1,
  })

export const useStudentGrades = () =>
  useQuery({
    queryKey: ['student-supplements', 'grades'],
    queryFn: fetchStudentGrades,
    staleTime: 30_000,
    retry: 1,
  })

export const useStudentNotifications = () =>
  useQuery({
    queryKey: ['student-supplements', 'notifications'],
    queryFn: fetchStudentNotifications,
    staleTime: 30_000,
    retry: 1,
  })

export const useMarkStudentNotificationRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) => markStudentNotificationRead(notificationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['student-supplements', 'notifications'] })
    },
  })
}

export const useMarkAllStudentNotificationsRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markAllStudentNotificationsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['student-supplements', 'notifications'] })
    },
  })
}

export const useDownloadCertificate = () => {
  return useMutation({
    mutationFn: async (certificateId: number) => {
      const response = await api.get(`/student/certificates/${certificateId}/download`, {
        responseType: 'blob',
      })

      return response.data as Blob
    },
    onSuccess: (blob, certificateId) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `certificat-${certificateId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    },
  })
}

export interface AssignmentSubmissionPayload {
  assignmentId: number
  files: File[]
  note?: string
}

export const useSubmitAssignment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ assignmentId, files, note }: AssignmentSubmissionPayload) => {
      const formData = new FormData()
      files.forEach((file) => {
        console.log('Appending file:', file.name, file.size, file.type)
        formData.append('files[]', file)
      })
      if (note) {
        formData.append('note', note)
      }

      for (const [key, value] of formData.entries()) {
        console.log('FormData entry:', key, value)
      }

      try {
        const response = await api.post(`/student/assignments/${assignmentId}/submit`, formData)

        return response.data
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const responseData = error.response?.data as {
            message?: string
            errors?: Record<string, string[]>
          } | undefined

          const firstValidationError = responseData?.errors
            ? Object.values(responseData.errors).flat()[0]
            : undefined

          throw new Error(firstValidationError ?? responseData?.message ?? 'La soumission a echoue.')
        }

        throw error
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['student-supplements', 'deadlines'] })
      void queryClient.invalidateQueries({ queryKey: ['student-supplements', 'messages'] })
      void queryClient.invalidateQueries({ queryKey: ['student-supplements', 'calendar'] })
    },
  })
}

export interface Lesson {
  id: number
  title: string
  type: 'video' | 'pdf' | 'blocks'
  duration: number
  completed: boolean
  locked: boolean
  resourceUrl?: string | null
  description: string | null
  blocks?: LessonBlock[] | null
}

interface Chapter {
  id: number
  title: string
  description: string | null
  lessons: Lesson[]
}

interface CourseDetail {
  id: number
  title: string
  description: string | null
  thumbnail: string | null
  instructor: string
  level: string
  enrolledStudents: number
  chapters: Chapter[]
}

const mapCourseDetail = (data: StudentCourseDetailPayload): CourseDetail => ({
  ...data,
  chapters: data.chapters.map((chapter) => ({
    ...chapter,
    lessons: chapter.lessons.map((lesson) => ({
      ...lesson,
      resourceUrl: lesson.resourceUrl ?? null,
      description: lesson.description ?? null,
      blocks: lesson.blocks ?? null,
    })),
  })),
})

export const useCourseDetail = (courseId: number) => {
  const query = useQuery({
    queryKey: ['student-course-detail', courseId],
    queryFn: () => fetchStudentCourseDetail(courseId),
    enabled: Number.isFinite(courseId) && courseId > 0,
    staleTime: 30_000,
    retry: 1,
  })

  return {
    data: query.data ? mapCourseDetail(query.data) : null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  }
}

export const useLesson = (courseId: number, lessonId: number) => {
  const courseQuery = useCourseDetail(courseId)
  const course = courseQuery.data
  const lesson =
    course?.chapters.flatMap((chapter) => chapter.lessons).find((item) => item.id === lessonId) ?? null

  return {
    lesson,
    course,
    isLoading: courseQuery.isLoading,
    isError: courseQuery.isError,
    error: courseQuery.error,
  }
}

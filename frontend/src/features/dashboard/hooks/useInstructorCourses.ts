import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createInstructorChapter,
  createInstructorCourse,
  createInstructorLesson,
  deleteInstructorChapter,
  deleteInstructorCourse,
  deleteInstructorLesson,
  fetchInstructorCourseDetail,
  fetchInstructorCourses,
  publishInstructorCourse,
  reorderInstructorChapters,
  reorderInstructorLessons,
  uploadInstructorLessonBlockPdf,
  uploadInstructorChapterAsset,
  updateInstructorChapter,
  updateInstructorCourse,
  updateInstructorLesson,
  type CreateCoursePayload,
  type ReorderChapterPayload,
  type ReorderLessonPayload,
  type UpdateCoursePayload,
  type UpsertChapterPayload,
  type UpsertLessonPayload,
} from '../services/dashboard.api'

export const useInstructorCourses = () =>
  useQuery({
    queryKey: ['instructor-courses'],
    queryFn: fetchInstructorCourses,
    staleTime: 30_000,
  })

export const useInstructorCourseDetail = (courseId: number | null) =>
  useQuery({
    queryKey: ['instructor-course-detail', courseId],
    queryFn: () => fetchInstructorCourseDetail(courseId as number),
    enabled: Number.isFinite(courseId) && (courseId ?? 0) > 0,
    staleTime: 10_000,
  })

export const useCreateInstructorCourse = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateCoursePayload) => createInstructorCourse(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['instructor-courses'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard-data', 'instructor'] })
    },
  })
}

export const useUploadInstructorLessonBlockPdf = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (variables: {
      lessonId: number
      blockId: string
      file: File
      courseId: number
      onProgress?: (progressPercent: number) => void
    }) => uploadInstructorLessonBlockPdf(variables.lessonId, variables.blockId, variables.file, variables.onProgress),
    onSuccess: (_, variables) => {
      invalidateInstructorCourseQueries(queryClient, variables.courseId)
    },
  })
}

export const usePublishInstructorCourse = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ courseId, isPublished }: { courseId: number; isPublished: boolean }) =>
      publishInstructorCourse(courseId, isPublished),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['instructor-courses'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard-data', 'instructor'] })
      void queryClient.invalidateQueries({ queryKey: ['instructor-course-detail', variables.courseId] })
    },
  })
}

const invalidateInstructorCourseQueries = (queryClient: ReturnType<typeof useQueryClient>, courseId?: number) => {
  void queryClient.invalidateQueries({ queryKey: ['instructor-courses'] })
  void queryClient.invalidateQueries({ queryKey: ['dashboard-data', 'instructor'] })

  if (courseId) {
    void queryClient.invalidateQueries({ queryKey: ['instructor-course-detail', courseId] })
  }
}

export const useUpdateInstructorCourse = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ courseId, payload }: { courseId: number; payload: UpdateCoursePayload }) =>
      updateInstructorCourse(courseId, payload),
    onSuccess: (_, variables) => {
      invalidateInstructorCourseQueries(queryClient, variables.courseId)
    },
  })
}

export const useDeleteInstructorCourse = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ courseId }: { courseId: number }) => deleteInstructorCourse(courseId),
    onSuccess: (_, variables) => {
      invalidateInstructorCourseQueries(queryClient, variables.courseId)
      void queryClient.removeQueries({ queryKey: ['instructor-course-detail', variables.courseId] })
    },
  })
}

export const useCreateInstructorChapter = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ courseId, payload }: { courseId: number; payload: UpsertChapterPayload }) =>
      createInstructorChapter(courseId, payload),
    onSuccess: (_, variables) => {
      invalidateInstructorCourseQueries(queryClient, variables.courseId)
    },
  })
}

export const useUpdateInstructorChapter = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (variables: { chapterId: number; courseId: number; payload: UpsertChapterPayload }) =>
      updateInstructorChapter(variables.chapterId, variables.payload),
    onSuccess: (_, variables) => {
      invalidateInstructorCourseQueries(queryClient, variables.courseId)
    },
  })
}

export const useDeleteInstructorChapter = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ chapterId }: { chapterId: number; courseId: number }) => deleteInstructorChapter(chapterId),
    onSuccess: (_, variables) => {
      invalidateInstructorCourseQueries(queryClient, variables.courseId)
    },
  })
}

export const useCreateInstructorLesson = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (variables: { chapterId: number; courseId: number; payload: UpsertLessonPayload }) =>
      createInstructorLesson(variables.chapterId, variables.payload),
    onSuccess: (_, variables) => {
      invalidateInstructorCourseQueries(queryClient, variables.courseId)
    },
  })
}

export const useUploadInstructorChapterAsset = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (variables: {
      chapterId: number
      courseId: number
      file: File
      onProgress?: (progressPercent: number) => void
    }) => uploadInstructorChapterAsset(variables.chapterId, variables.file, variables.onProgress),
    onSuccess: (_, variables) => {
      invalidateInstructorCourseQueries(queryClient, variables.courseId)
    },
  })
}

export const useReorderInstructorChapters = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (variables: { courseId: number; payload: ReorderChapterPayload }) =>
      reorderInstructorChapters(variables.courseId, variables.payload),
    onSuccess: (_, variables) => {
      invalidateInstructorCourseQueries(queryClient, variables.courseId)
    },
  })
}

export const useReorderInstructorLessons = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (variables: { chapterId: number; courseId: number; payload: ReorderLessonPayload }) =>
      reorderInstructorLessons(variables.chapterId, variables.payload),
    onSuccess: (_, variables) => {
      invalidateInstructorCourseQueries(queryClient, variables.courseId)
    },
  })
}

export const useUpdateInstructorLesson = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (variables: { lessonId: number; courseId: number; payload: UpsertLessonPayload }) =>
      updateInstructorLesson(variables.lessonId, variables.payload),
    onSuccess: (_, variables) => {
      invalidateInstructorCourseQueries(queryClient, variables.courseId)
    },
  })
}

export const useDeleteInstructorLesson = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ lessonId }: { lessonId: number; courseId: number }) => deleteInstructorLesson(lessonId),
    onSuccess: (_, variables) => {
      invalidateInstructorCourseQueries(queryClient, variables.courseId)
    },
  })
}

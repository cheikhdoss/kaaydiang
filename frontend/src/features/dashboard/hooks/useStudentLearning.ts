import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  enrollInCourse,
  fetchStudentCatalog,
  fetchStudentMyCourses,
  markLessonCompleted,
} from '../services/dashboard.api'

export const useStudentCatalog = () =>
  useQuery({
    queryKey: ['student-catalog'],
    queryFn: fetchStudentCatalog,
    staleTime: 60_000,
  })

export const useStudentMyCourses = () =>
  useQuery({
    queryKey: ['student-my-courses'],
    queryFn: fetchStudentMyCourses,
    staleTime: 60_000,
  })

export const useEnrollInCourse = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (courseId: number) => enrollInCourse(courseId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['student-my-courses'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard-data', 'student'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard-modules', 'student'] })
    },
  })
}

export const useMarkLessonCompleted = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ lessonId, watchedSeconds }: { lessonId: number; watchedSeconds?: number }) =>
      markLessonCompleted(lessonId, watchedSeconds),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dashboard-data', 'student'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard-modules', 'student'] })
      void queryClient.invalidateQueries({ queryKey: ['student-course-detail'] })
      void queryClient.invalidateQueries({ queryKey: ['student-supplements', 'next-lesson'] })
    },
  })
}

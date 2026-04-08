import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createInstructorCourse,
  fetchInstructorCourses,
  publishInstructorCourse,
  type CreateCoursePayload,
} from '../services/dashboard.api'

export const useInstructorCourses = () =>
  useQuery({
    queryKey: ['instructor-courses'],
    queryFn: fetchInstructorCourses,
    staleTime: 30_000,
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

export const usePublishInstructorCourse = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ courseId, isPublished }: { courseId: number; isPublished: boolean }) =>
      publishInstructorCourse(courseId, isPublished),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['instructor-courses'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard-data', 'instructor'] })
    },
  })
}

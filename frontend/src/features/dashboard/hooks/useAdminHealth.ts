import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteAdminCourse,
  fetchAdminCourses,
  fetchAdminPlatformHealth,
  toggleAdminCourseStatus,
} from '../services/dashboard.api'

export const useAdminCourses = (params?: {
  search?: string
  level?: string
  is_published?: boolean
  instructor_id?: number
  per_page?: number
  page?: number
}) =>
  useQuery({
    queryKey: ['admin-courses', params],
    queryFn: () => fetchAdminCourses(params),
    staleTime: 30_000,
    retry: 1,
  })

export const useToggleAdminCourseStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ courseId, isPublished }: { courseId: number; isPublished: boolean }) =>
      toggleAdminCourseStatus(courseId, isPublished),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-courses'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-platform-health'] })
    },
  })
}

export const useDeleteAdminCourse = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (courseId: number) => deleteAdminCourse(courseId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-courses'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-platform-health'] })
    },
  })
}

export const useAdminPlatformHealth = () =>
  useQuery({
    queryKey: ['admin-platform-health'],
    queryFn: fetchAdminPlatformHealth,
    staleTime: 60_000,
    retry: 1,
  })

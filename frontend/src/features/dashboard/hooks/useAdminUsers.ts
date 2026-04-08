import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchAdminUsers,
  updateAdminUserRole,
  updateAdminUserStatus,
  type DashboardRole,
} from '../services/dashboard.api'

export const useAdminUsers = (filters?: {
  role?: DashboardRole
  active?: '0' | '1'
  search?: string
  page?: number
}) =>
  useQuery({
    queryKey: ['admin-users', filters],
    queryFn: () => fetchAdminUsers(filters),
    staleTime: 30_000,
  })

export const useUpdateAdminUserRole = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: DashboardRole }) =>
      updateAdminUserRole(userId, role),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard-data', 'admin'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard-modules', 'admin'] })
    },
  })
}

export const useUpdateAdminUserStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: number; isActive: boolean }) =>
      updateAdminUserStatus(userId, isActive),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard-data', 'admin'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard-modules', 'admin'] })
    },
  })
}

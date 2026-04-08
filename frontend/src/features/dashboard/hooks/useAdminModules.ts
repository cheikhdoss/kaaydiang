import { useQuery } from '@tanstack/react-query'
import { fetchAdminModules, type AdminModulesPayload } from '../services/dashboard.api'

export const useAdminModules = () =>
  useQuery<AdminModulesPayload>({
    queryKey: ['dashboard-modules', 'admin'],
    queryFn: fetchAdminModules,
    staleTime: 60_000,
  })

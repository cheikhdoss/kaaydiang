import { useQuery } from '@tanstack/react-query'
import {
  fetchDashboardByRole,
  type DashboardPayload,
  type DashboardRole,
} from '../services/dashboard.api'

export const useDashboardData = (role: DashboardRole) =>
  useQuery<DashboardPayload>({
    queryKey: ['dashboard-data', role],
    queryFn: () => fetchDashboardByRole(role),
    staleTime: 60_000,
  })

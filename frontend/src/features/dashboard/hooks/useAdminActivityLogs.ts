import { useQuery } from '@tanstack/react-query'
import { fetchAdminActivityLogs, type PaginatedSystemActivityLogsPayload } from '../services/dashboard.api'

export const useAdminActivityLogs = (page: number) =>
  useQuery<PaginatedSystemActivityLogsPayload>({
    queryKey: ['admin-activity-logs', page],
    queryFn: () => fetchAdminActivityLogs(page, 20),
    staleTime: 15_000,
  })

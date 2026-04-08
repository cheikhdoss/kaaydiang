import { useQuery } from '@tanstack/react-query'
import { fetchStudentModules, type StudentModulesPayload } from '../services/dashboard.api'

export const useStudentModules = () =>
  useQuery<StudentModulesPayload>({
    queryKey: ['dashboard-modules', 'student'],
    queryFn: fetchStudentModules,
    staleTime: 60_000,
  })

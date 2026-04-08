import { resolveDashboardPath, type UserRole } from '@/hooks/useAuth'

export const dashboardPaths = {
  home: '/dashboard',
  student: '/dashboard/student',
  studentCourses: '/dashboard/student/courses',
  studentCourseDetail: (id: number) => `/dashboard/student/courses/${id}`,
  studentLesson: (courseId: number, lessonId: number) => `/dashboard/student/courses/${courseId}/lessons/${lessonId}`,
  studentCatalog: '/dashboard/student/catalog',
  studentProgress: '/dashboard/student/progress',
  studentQuiz: '/dashboard/student/quiz',
  studentAssignments: '/dashboard/student/assignments',
  studentCertificates: '/dashboard/student/certificates',
  studentCalendar: '/dashboard/student/calendar',
  studentMessages: '/dashboard/student/messages',
  instructor: '/dashboard/instructor',
  admin: '/dashboard/admin',
  adminUsers: '/dashboard/admin/users',
} as const

export const resolveRoleDashboardPath = (role: UserRole) => resolveDashboardPath(role)

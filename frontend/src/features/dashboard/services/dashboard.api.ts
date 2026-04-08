import api from '@/services/api'

export type DashboardRole = 'student' | 'instructor' | 'admin'

export interface StudentDashboardPayload {
  role: 'student'
  greeting: string
  stats: {
    active_courses: number
    certificates: number
    learning_hours: number
    weekly_growth: number
  }
  progress: {
    weekly_goal: number
    completed_lessons: number
    total_lessons: number
    streak_days: number
  }
  modules: Array<{
    key: string
    title: string
    description: string
    cta: string
  }>
}

export interface StudentCourseModuleItem {
  id: number
  title: string
  thumbnail: string | null
  level: 'beginner' | 'intermediate' | 'advanced'
  is_published: boolean
  instructor: string
  enrolled_at: string | null
  completed_lessons: number
  total_lessons: number
  progress_percent: number
}

export interface StudentDeadlineModuleItem {
  id: number
  status: 'submitted' | 'reviewed' | 'rejected'
  submitted_at: string | null
  score: number | null
  assignment: {
    id: number | null
    course_id: number | null
    title: string | null
    due_date: string | null
  }
}

export interface StudentModulesPayload {
  role: 'student'
  modules: {
    my_courses: StudentCourseModuleItem[]
    deadlines: StudentDeadlineModuleItem[]
  }
}

export interface StudentSupplementDeadlineItem {
  id: number
  title: string
  course_id: number
  course_title: string | null
  due_date: string | null
  status: 'pending' | 'submitted' | 'reviewed' | 'rejected'
  submitted_at: string | null
}

export interface StudentSupplementCertificateItem {
  id: number
  certificate_code: string
  issued_at: string | null
  course: {
    id: number | null
    title: string | null
    level: 'beginner' | 'intermediate' | 'advanced' | null
  }
}

export interface StudentSupplementNextLessonPayload {
  next_lesson: {
    lesson_id: number
    lesson_title: string
    duration: number
    order: number
    chapter: {
      id: number
      title: string
      order: number
    }
    course: {
      id: number
      title: string
    }
    progress: {
      completed_lessons: number
      total_lessons: number
      progress_percent: number
    }
  } | null
}

export interface StudentCatalogCourseItem {
  id: number
  title: string
  description: string | null
  level: 'beginner' | 'intermediate' | 'advanced'
  price: string | number
  thumbnail: string | null
  chapters_count: number
  instructor: string
}

export interface StudentMyCourseItem {
  enrollment_id: number
  enrolled_at: string | null
  course: {
    id: number
    title: string
    description: string | null
    thumbnail: string | null
    level: 'beginner' | 'intermediate' | 'advanced'
    is_published: boolean
  }
}

export interface InstructorDashboardPayload {
  role: 'instructor'
  greeting: string
  stats: {
    courses_created: number
    courses_published: number
    chapters: number
    engagement_rate: number
  }
  pipeline: {
    drafts: number
    ready_to_publish: number
    pending_reviews: number
  }
  modules: Array<{
    key: string
    title: string
    description: string
    cta: string
  }>
}

export interface AdminDashboardPayload {
  role: 'admin'
  greeting: string
  stats: {
    users: number
    students: number
    instructors: number
    published_courses: number
  }
  modules: Array<{
    key: string
    title: string
    description: string
    cta: string
  }>
}

export interface AdminRecentUserItem {
  id: number
  first_name: string
  last_name: string
  email: string
  role: DashboardRole
  created_at: string | null
}

export interface AdminRecentCourseItem {
  id: number
  title: string
  level: 'beginner' | 'intermediate' | 'advanced'
  is_published: boolean
  chapters_count: number
  created_at: string | null
  instructor: string
}

export interface AdminOpenReviewItem {
  id: number
  status: 'submitted' | 'reviewed' | 'rejected'
  submitted_at: string | null
  student: {
    id: number | null
    first_name: string | null
    last_name: string | null
    email: string | null
  }
  assignment: {
    id: number | null
    course_id: number | null
    title: string | null
  }
}

export interface AdminModulesPayload {
  role: 'admin'
  modules: {
    recent_users: AdminRecentUserItem[]
    recent_courses: AdminRecentCourseItem[]
    open_reviews: AdminOpenReviewItem[]
    role_distribution: {
      students: number
      instructors: number
      admins: number
    }
    publication_status: {
      published: number
      drafts: number
    }
  }
}

export interface PaginatedAdminUsersPayload {
  data: Array<{
    id: number
    first_name: string
    last_name: string
    email: string
    role: DashboardRole
    is_active: boolean
    created_at: string | null
  }>
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export type DashboardPayload =
  | StudentDashboardPayload
  | InstructorDashboardPayload
  | AdminDashboardPayload

export const fetchDashboardByRole = async (role: DashboardRole): Promise<DashboardPayload> => {
  const response = await api.get(`/dashboard/${role}`)
  return response.data as DashboardPayload
}

export const fetchStudentModules = async () => {
  const response = await api.get('/dashboard/student/modules')
  return response.data as StudentModulesPayload
}

export const fetchStudentSupplementDeadlines = async () => {
  const response = await api.get('/student/supplements/deadlines')
  return response.data as StudentSupplementDeadlineItem[]
}

export const fetchStudentSupplementCertificates = async () => {
  const response = await api.get('/student/supplements/certificates')
  return response.data as StudentSupplementCertificateItem[]
}

export const fetchStudentSupplementNextLesson = async () => {
  const response = await api.get('/student/supplements/next-lesson')
  return response.data as StudentSupplementNextLessonPayload
}

export const fetchAdminModules = async () => {
  const response = await api.get('/dashboard/admin/modules')
  return response.data as AdminModulesPayload
}

export const fetchStudentCatalog = async () => {
  const response = await api.get('/student/catalog')
  return response.data as StudentCatalogCourseItem[]
}

export const fetchStudentMyCourses = async () => {
  const response = await api.get('/student/my-courses')
  return response.data as StudentMyCourseItem[]
}

export const enrollInCourse = async (courseId: number) => {
  const response = await api.post(`/student/enroll/${courseId}`)
  return response.data as { message: string }
}

export const markLessonCompleted = async (lessonId: number, watchedSeconds?: number) => {
  const response = await api.post(`/student/lessons/${lessonId}/complete`, {
    watched_seconds: watchedSeconds,
  })
  return response.data as { message: string }
}

export const fetchAdminUsers = async (filters?: {
  role?: DashboardRole
  active?: '0' | '1'
  search?: string
  page?: number
}) => {
  const response = await api.get('/admin/users', { params: filters })
  return response.data as PaginatedAdminUsersPayload
}

export const updateAdminUserRole = async (userId: number, role: DashboardRole) => {
  const response = await api.patch(`/admin/users/${userId}/role`, { role })
  return response.data as { message: string }
}

export const updateAdminUserStatus = async (userId: number, isActive: boolean) => {
  const response = await api.patch(`/admin/users/${userId}/status`, { is_active: isActive })
  return response.data as { message: string }
}

export interface InstructorCourseItem {
  id: number
  title: string
  description: string | null
  level: 'beginner' | 'intermediate' | 'advanced'
  price: string | number
  is_published: boolean
  chapters_count: number
}

export interface CreateCoursePayload {
  title: string
  description?: string
  level?: 'beginner' | 'intermediate' | 'advanced'
  price?: number
}

export const fetchInstructorCourses = async () => {
  const response = await api.get('/instructor/courses')
  return response.data as InstructorCourseItem[]
}

export const createInstructorCourse = async (payload: CreateCoursePayload) => {
  const response = await api.post('/instructor/courses', payload)
  return response.data as InstructorCourseItem
}

export const publishInstructorCourse = async (courseId: number, isPublished: boolean) => {
  const response = await api.put(`/instructor/courses/${courseId}`, {
    is_published: isPublished,
  })
  return response.data as InstructorCourseItem
}

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
    totalQuizzes?: number
    totalAssignments?: number
    totalEnrollments?: number
    completedCourses?: number
    totalCertificates?: number
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

export interface StudentGradeItem {
  id: string
  title: string
  type: 'quiz' | 'assignment'
  score: number
  max_score: number
  course: string
  date: string | null
}

export interface StudentGradesPayload {
  summary: {
    average: number
    total_quizzes: number
    total_assignments: number
    best_score: number
  }
  grades: StudentGradeItem[]
}

export interface StudentNotificationItem {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  read: boolean
  date: string
}

export interface StudentCourseDetailLesson {
  id: number
  title: string
  type: 'video' | 'pdf' | 'blocks'
  duration: number
  completed: boolean
  locked: boolean
  resourceUrl?: string | null
  description: string | null
  blocks?: LessonBlock[] | null
}

export interface StudentCourseDetailChapter {
  id: number
  title: string
  description: string | null
  lessons: StudentCourseDetailLesson[]
}

export interface StudentCourseDetailPayload {
  id: number
  title: string
  description: string | null
  thumbnail: string | null
  instructor: string
  level: string
  enrolledStudents: number
  chapters: StudentCourseDetailChapter[]
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

export const fetchStudentGrades = async () => {
  const response = await api.get('/student/grades')
  return response.data as StudentGradesPayload
}

export const fetchStudentNotifications = async () => {
  const response = await api.get('/student/notifications')
  return response.data as StudentNotificationItem[]
}

export const markStudentNotificationRead = async (notificationId: string) => {
  const response = await api.post(`/student/notifications/${encodeURIComponent(notificationId)}/read`)
  return response.data as { message: string }
}

export const markAllStudentNotificationsRead = async () => {
  const response = await api.post('/student/notifications/read-all')
  return response.data as { message: string }
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

export const fetchStudentCourseDetail = async (courseId: number) => {
  const response = await api.get(`/student/courses/${courseId}`)
  return response.data as StudentCourseDetailPayload
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
  thumbnail?: string | null
  level: 'beginner' | 'intermediate' | 'advanced'
  price: string | number
  is_published: boolean
  chapters_count: number
}

export type LessonBlockType = 'text' | 'video' | 'pdf'

export interface LessonBlock {
  id: string
  type: LessonBlockType
  order: number
  // Text block fields
  content?: string
  // Video block fields
  video_url?: string
  video_title?: string
  // PDF block fields
  pdf_path?: string
  pdf_url?: string
  pdf_name?: string
  pdf_size?: number
  // Transient: local file for upload (not serialized)
  _localFile?: File | null
}

export interface InstructorCourseDetailLessonItem {
  id: number
  title: string
  description: string | null
  video_url: string | null
  blocks: LessonBlock[] | null
  duration: number
  order: number
  is_free: boolean
}

export interface InstructorCourseDetailChapterItem {
  id: number
  title: string
  description: string | null
  order: number
  asset_type: 'video' | 'pdf' | null
  asset_path: string | null
  asset_url: string | null
  asset_original_name: string | null
  asset_mime_type: string | null
  asset_size: number | null
  lessons: InstructorCourseDetailLessonItem[]
}

export interface InstructorCourseDetailPayload extends InstructorCourseItem {
  chapters: InstructorCourseDetailChapterItem[]
}

export interface CreateCoursePayload {
  title: string
  description?: string
  level?: 'beginner' | 'intermediate' | 'advanced'
  price?: number
  thumbnail?: File | null
}

export interface UpdateCoursePayload {
  title?: string
  description?: string | null
  level?: 'beginner' | 'intermediate' | 'advanced'
  price?: number
  is_published?: boolean
  thumbnail?: File | null
}

export interface UpsertChapterPayload {
  title: string
  description?: string | null
  order?: number
}

export interface UpsertLessonPayload {
  title: string
  content?: string | null
  blocks?: LessonBlock[] | null
  video_url?: string | null
  order?: number
  duration?: number
  is_free?: boolean
}

export interface ChapterAssetUploadResponse {
  id: number
  asset_type: 'video' | 'pdf'
  asset_path: string
  asset_url: string | null
  asset_original_name: string | null
  asset_mime_type: string | null
  asset_size: number
}

export interface LessonBlockPdfUploadResponse {
  block: LessonBlock
}

export interface ReorderChapterPayload {
  chapter_ids: number[]
}

export interface ReorderLessonPayload {
  lesson_ids: number[]
}

export const fetchInstructorCourses = async () => {
  const response = await api.get('/instructor/courses')
  return response.data as InstructorCourseItem[]
}

export const fetchInstructorCourseDetail = async (courseId: number) => {
  const response = await api.get(`/instructor/courses/${courseId}`)
  return response.data as InstructorCourseDetailPayload
}

export const createInstructorCourse = async (payload: CreateCoursePayload) => {
  const formData = new FormData()
  formData.append('title', payload.title)
  if (payload.description) formData.append('description', payload.description)
  if (payload.level) formData.append('level', payload.level)
  if (payload.price !== undefined) formData.append('price', String(payload.price))
  if (payload.thumbnail) formData.append('thumbnail', payload.thumbnail)

  const response = await api.post('/instructor/courses', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data as InstructorCourseItem
}

export const updateInstructorCourse = async (courseId: number, payload: UpdateCoursePayload) => {
  const formData = new FormData()
  // Laravel behavior for PUT with files: requires _method=PUT and POST request
  formData.append('_method', 'PUT')

  if (payload.title) formData.append('title', payload.title)
  if (payload.description !== undefined) formData.append('description', payload.description ?? '')
  if (payload.level) formData.append('level', payload.level)
  if (payload.price !== undefined) formData.append('price', String(payload.price))
  if (payload.is_published !== undefined) formData.append('is_published', payload.is_published ? '1' : '0')
  if (payload.thumbnail) formData.append('thumbnail', payload.thumbnail)

  const response = await api.post(`/instructor/courses/${courseId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data as InstructorCourseItem
}

export const deleteInstructorCourse = async (courseId: number) => {
  const response = await api.delete(`/instructor/courses/${courseId}`)
  return response.data as { message: string }
}

export const publishInstructorCourse = async (courseId: number, isPublished: boolean) => {
  const response = await api.put(`/instructor/courses/${courseId}`, {
    is_published: isPublished,
  })
  return response.data as InstructorCourseItem
}

export const createInstructorChapter = async (courseId: number, payload: UpsertChapterPayload) => {
  const response = await api.post(`/instructor/courses/${courseId}/chapters`, payload)
  return response.data as InstructorCourseDetailChapterItem
}

export const updateInstructorChapter = async (chapterId: number, payload: UpsertChapterPayload) => {
  const response = await api.put(`/instructor/chapters/${chapterId}`, payload)
  return response.data as InstructorCourseDetailChapterItem
}

export const deleteInstructorChapter = async (chapterId: number) => {
  const response = await api.delete(`/instructor/chapters/${chapterId}`)
  return response.data as { message: string }
}

export const uploadInstructorChapterAsset = async (
  chapterId: number,
  file: File,
  onProgress?: (progressPercent: number) => void,
) => {
  const formData = new FormData()
  formData.append('asset', file)

  const response = await api.post(`/instructor/chapters/${chapterId}/assets`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (event) => {
      if (!event.total || !onProgress) return
      const percent = Math.min(100, Math.max(0, Math.round((event.loaded / event.total) * 100)))
      onProgress(percent)
    },
  })

  return response.data as ChapterAssetUploadResponse
}

export const uploadInstructorLessonBlockPdf = async (
  lessonId: number,
  blockId: string,
  file: File,
  onProgress?: (progressPercent: number) => void,
) => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await api.post(`/instructor/lessons/${lessonId}/blocks/${encodeURIComponent(blockId)}/pdf`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (event) => {
      if (!event.total || !onProgress) return
      const percent = Math.min(100, Math.max(0, Math.round((event.loaded / event.total) * 100)))
      onProgress(percent)
    },
  })

  return response.data as LessonBlockPdfUploadResponse
}

export const reorderInstructorChapters = async (courseId: number, payload: ReorderChapterPayload) => {
  const response = await api.post(`/instructor/courses/${courseId}/chapters/reorder`, payload)
  return response.data as { message: string }
}

export const reorderInstructorLessons = async (chapterId: number, payload: ReorderLessonPayload) => {
  const response = await api.post(`/instructor/chapters/${chapterId}/lessons/reorder`, payload)
  return response.data as { message: string }
}

export const createInstructorLesson = async (chapterId: number, payload: UpsertLessonPayload) => {
  const response = await api.post(`/instructor/chapters/${chapterId}/lessons`, payload)
  return response.data as InstructorCourseDetailLessonItem
}

export const updateInstructorLesson = async (lessonId: number, payload: UpsertLessonPayload) => {
  const response = await api.put(`/instructor/lessons/${lessonId}`, payload)
  return response.data as InstructorCourseDetailLessonItem
}

export const deleteInstructorLesson = async (lessonId: number) => {
  const response = await api.delete(`/instructor/lessons/${lessonId}`)
  return response.data as { message: string }
}

// ==================== ADMIN HEALTH & MODERATION ====================

export interface AdminCourseModerationItem {
  id: number
  title: string
  description: string | null
  thumbnail: string | null
  level: 'beginner' | 'intermediate' | 'advanced'
  price: string | number
  is_published: boolean
  instructor: string
  instructor_id: number | null
  chapters_count: number
  enrollments_count: number
  created_at: string | null
}

export interface PaginatedAdminCoursesPayload {
  data: AdminCourseModerationItem[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface AdminActivityStats {
  new_users_7d: number
  new_enrollments_7d: number
  new_courses_7d: number
  lessons_completed_7d: number
}

export interface AdminTopCourseItem {
  id: number
  title: string
  level: 'beginner' | 'intermediate' | 'advanced'
  is_published: boolean
  enrollment_count: number
}

export interface AdminPlatformHealthPayload {
  total_users: number
  total_students: number
  total_instructors: number
  total_admins: number
  total_courses: number
  published_courses: number
  draft_courses: number
  total_chapters: number
  total_lessons: number
  total_enrollments: number
  total_certificates: number
  total_quizzes: number
  total_quiz_attempts: number
  total_assignments: number
  total_submissions: number
  activity: AdminActivityStats
  top_courses: AdminTopCourseItem[]
  role_distribution: Record<string, number>
  publication_status: { published: number; drafts: number }
  level_distribution: Record<string, number>
}

export const fetchAdminCourses = async (params?: {
  search?: string
  level?: string
  is_published?: boolean
  instructor_id?: number
  per_page?: number
  page?: number
}) => {
  const response = await api.get('/admin/courses', { params })
  return response.data as PaginatedAdminCoursesPayload
}

export const toggleAdminCourseStatus = async (courseId: number, isPublished: boolean) => {
  const response = await api.patch(`/admin/courses/${courseId}/status`, { is_published: isPublished })
  return response.data as { message: string; course: { id: number; title: string; is_published: boolean } }
}

export const deleteAdminCourse = async (courseId: number) => {
  const response = await api.delete(`/admin/courses/${courseId}`)
  return response.data as { message: string }
}

export const fetchAdminPlatformHealth = async () => {
  const response = await api.get('/admin/stats')
  return response.data as AdminPlatformHealthPayload
}

// ==================== STUDENT CALENDAR ====================

export interface StudentCalendarEvent {
  id: number
  title: string
  date: string
  time: string
  type: 'deadline' | 'live' | 'exam' | 'reminder'
  course_id: number | null
  course_title: string | null
  description: string
}

export const fetchStudentCalendar = async () => {
  const response = await api.get('/student/calendar')
  return response.data as StudentCalendarEvent[]
}

// ==================== STUDENT MESSAGES ====================

export interface StudentMessageItem {
  id: number
  sender: { name: string; avatar: string; role: string }
  subject: string
  preview: string
  date: string
  unread: boolean
  course: string
}

export interface MarkStudentMessageThreadReadResponse {
  message: string
}

export interface StudentMessageThreadItem {
  id: string
  sender: 'me' | 'instructor'
  text: string
  date: string | null
}

export interface StudentMessageThreadPayload {
  conversation_id: number
  participant: {
    id: number
    name: string
    role: string
  }
  course: string | null
  messages: StudentMessageThreadItem[]
}

export const fetchStudentMessages = async () => {
  const response = await api.get('/student/messages')
  return response.data as StudentMessageItem[]
}

export const fetchStudentMessageThread = async (conversationId: number) => {
  const response = await api.get(`/student/messages/${conversationId}/thread`)
  return response.data as StudentMessageThreadPayload
}

export const sendStudentMessage = async ({ conversationId, message }: { conversationId: number; message: string }) => {
  const response = await api.post(`/student/messages/${conversationId}/thread`, { message })
  return response.data as StudentMessageThreadItem
}

export const markStudentMessageThreadRead = async (conversationId: number) => {
  const response = await api.post(`/student/messages/${conversationId}/thread/read`)
  return response.data as MarkStudentMessageThreadReadResponse
}

// ==================== INSTRUCTOR SUPPLEMENTS ====================

export interface InstructorCalendarEvent {
  id: number
  title: string
  date: string
  time: string
  type: 'live' | 'deadline' | 'exam' | 'reminder'
  course_id: number | null
  course_title: string | null
  student_count: number
  description: string
}

export interface InstructorQuizItem {
  id: number
  title: string
  description: string | null
  course_id: number
  course_title: string
  question_count: number
  attempt_count: number
  average_score: number
  pass_score: number
  status: 'draft' | 'active' | 'completed'
}

export interface InstructorQuizFilters {
  search?: string
  status?: 'draft' | 'active' | 'completed'
  course_id?: number
}

export interface CreateInstructorQuizPayload {
  title: string
  description?: string | null
  course_id: number
  pass_score?: number
}

export interface UpdateInstructorQuizPayload {
  title?: string
  description?: string | null
  course_id?: number
  pass_score?: number
}

export interface InstructorAssignmentItem {
  id: number
  title: string
  course_id: number
  course_title: string
  submission_count: number
  total_students: number
  due_date: string | null
  status: 'draft' | 'active' | 'completed'
}

export interface InstructorAssignmentFilters {
  search?: string
  status?: 'draft' | 'active' | 'completed'
}

export interface InstructorAttachmentItem {
  path: string
  name: string
  mime_type: string | null
  size: number | null
  uploaded_at: string | null
  url: string
}

export interface InstructorAssignmentSubmissionItem {
  id: number
  status: 'submitted' | 'reviewed' | 'rejected'
  score: number | null
  instructor_feedback: string | null
  file_url: string | null
  student_attachments: InstructorAttachmentItem[]
  correction_attachments: InstructorAttachmentItem[]
  submitted_at: string | null
  updated_at: string | null
  student: {
    id: number | null
    name: string
    email: string | null
  }
}

export interface InstructorAssignmentSubmissionsPayload {
  assignment: {
    id: number
    title: string
    course_id: number
  }
  submissions: InstructorAssignmentSubmissionItem[]
}

export interface InstructorAssignmentSubmissionFilters {
  status?: 'submitted' | 'reviewed' | 'rejected'
  search?: string
}

export interface GradeInstructorSubmissionPayload {
  status: 'submitted' | 'reviewed' | 'rejected'
  score?: number | null
  feedback?: string | null
  correction_files?: File[]
}

export interface InstructorStudentItem {
  id: number
  first_name: string
  last_name: string
  email: string
  enrolled_courses: number
  last_active: string
  average_progress: number
}

export interface InstructorMessageItem {
  id: number
  sender_name: string
  course_title: string
  last_message: string
  created_at: string | null
  unread_count: number
}

export interface InstructorThreadMessage {
  id: string
  sender: 'student' | 'instructor'
  text: string
  course_title: string | null
  created_at: string | null
}

export interface InstructorMessageThreadPayload {
  participant: {
    id: number
    name: string
    role: 'student'
  }
  messages: InstructorThreadMessage[]
}

export interface SendInstructorMessagePayload {
  studentId: number
  message: string
  course_id?: number
}

export interface InstructorProfilePayload {
  id: number
  first_name: string
  last_name: string
  full_name: string
  email: string
  role: 'instructor'
  avatar: string | null
  bio: string | null
  created_at: string | null
  stats: {
    courses_created: number
    courses_published: number
    total_students: number
    pending_reviews: number
    average_quiz_score: number
  }
}

export interface InstructorStatsPayload {
  total_students: number
  total_courses: number
  weekly_views: number
  certificates_issued: number
  engagement_rate: number
  weekly_activity: Array<{ day: string; views: number; completions: number }>
  top_courses: Array<{ title: string; student_count: number; progress: number; rating: number }>
}

export interface InstructorNotificationItem {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  read: boolean
  date: string
}

export const fetchInstructorCalendar = async () => {
  const response = await api.get('/instructor/calendar')
  return response.data as InstructorCalendarEvent[]
}

export const fetchInstructorQuizzes = async (filters?: InstructorQuizFilters) => {
  const response = await api.get('/instructor/quizzes', { params: filters })
  return response.data as InstructorQuizItem[]
}

export const createInstructorQuiz = async (payload: CreateInstructorQuizPayload) => {
  const response = await api.post('/instructor/quizzes', payload)
  return response.data as InstructorQuizItem
}

export const updateInstructorQuiz = async (quizId: number, payload: UpdateInstructorQuizPayload) => {
  const response = await api.put(`/instructor/quizzes/${quizId}`, payload)
  return response.data as InstructorQuizItem
}

export const deleteInstructorQuiz = async (quizId: number) => {
  const response = await api.delete(`/instructor/quizzes/${quizId}`)
  return response.data as { message: string }
}

export const fetchInstructorAssignments = async (filters?: InstructorAssignmentFilters) => {
  const response = await api.get('/instructor/assignments', { params: filters })
  return response.data as InstructorAssignmentItem[]
}

export const fetchInstructorAssignmentSubmissions = async (
  assignmentId: number,
  filters?: InstructorAssignmentSubmissionFilters,
) => {
  const response = await api.get(`/instructor/assignments/${assignmentId}/submissions`, { params: filters })
  return response.data as InstructorAssignmentSubmissionsPayload
}

export const gradeInstructorAssignmentSubmission = async (
  assignmentId: number,
  submissionId: number,
  payload: GradeInstructorSubmissionPayload,
) => {
  const hasFiles = Array.isArray(payload.correction_files) && payload.correction_files.length > 0

  const response = hasFiles
    ? await api.patch(
      `/instructor/assignments/${assignmentId}/submissions/${submissionId}`,
      (() => {
        const formData = new FormData()
        formData.append('status', payload.status)
        if (typeof payload.score === 'number') formData.append('score', String(payload.score))
        if (typeof payload.feedback === 'string') formData.append('feedback', payload.feedback)
        for (const file of payload.correction_files ?? []) {
          formData.append('correction_files[]', file)
        }
        return formData
      })(),
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    )
    : await api.patch(`/instructor/assignments/${assignmentId}/submissions/${submissionId}`, {
      status: payload.status,
      score: payload.score,
      feedback: payload.feedback,
    })

  return response.data as InstructorAssignmentSubmissionItem
}

export const fetchInstructorStudents = async () => {
  const response = await api.get('/instructor/students')
  return response.data as InstructorStudentItem[]
}

export const fetchInstructorMessages = async () => {
  const response = await api.get('/instructor/messages')
  return response.data as InstructorMessageItem[]
}

export const fetchInstructorMessageThread = async (studentId: number) => {
  const response = await api.get(`/instructor/messages/${studentId}/thread`)
  return response.data as InstructorMessageThreadPayload
}

export const sendInstructorMessage = async ({ studentId, message, course_id }: SendInstructorMessagePayload) => {
  const response = await api.post(`/instructor/messages/${studentId}/thread`, {
    message,
    course_id,
  })
  return response.data as InstructorThreadMessage
}

export const markInstructorThreadRead = async (studentId: number) => {
  const response = await api.post(`/instructor/messages/${studentId}/thread/read`)
  return response.data as { message: string }
}

export const fetchInstructorStats = async () => {
  const response = await api.get('/instructor/stats')
  return response.data as InstructorStatsPayload
}

export const fetchInstructorNotifications = async () => {
  const response = await api.get('/instructor/notifications')
  return response.data as InstructorNotificationItem[]
}

export const fetchInstructorProfile = async () => {
  const response = await api.get('/instructor/profile')
  return response.data as InstructorProfilePayload
}

// ==================== QUIZ QUESTIONS & OPTIONS ====================

export interface QuizQuestionItem {
  id: number
  quiz_id: number
  question_text: string
  question_type: 'multiple_choice' | 'true_false' | 'short_answer'
  order: number
  points: number
  options: QuizOptionItem[]
}

export interface QuizOptionItem {
  id: number
  option_text: string
  is_correct: boolean
  order: number
}

export interface CreateQuizQuestionPayload {
  question_text: string
  question_type?: 'multiple_choice' | 'true_false' | 'short_answer'
  order?: number
  points?: number
  options?: Array<{
    option_text: string
    is_correct?: boolean
    order?: number
  }>
}

export interface UpdateQuizQuestionPayload {
  question_text?: string
  question_type?: 'multiple_choice' | 'true_false' | 'short_answer'
  order?: number
  points?: number
}

export interface CreateQuizOptionPayload {
  option_text: string
  is_correct?: boolean
  order?: number
}

export interface UpdateQuizOptionPayload {
  option_text?: string
  is_correct?: boolean
  order?: number
}

export const fetchQuizQuestions = async (quizId: number) => {
  const response = await api.get(`/instructor/quizzes/${quizId}/questions`)
  return response.data as QuizQuestionItem[]
}

export const createQuizQuestion = async (quizId: number, payload: CreateQuizQuestionPayload) => {
  const response = await api.post(`/instructor/quizzes/${quizId}/questions`, payload)
  return response.data as QuizQuestionItem
}

export const updateQuizQuestion = async (questionId: number, payload: UpdateQuizQuestionPayload) => {
  const response = await api.put(`/instructor/quiz-questions/${questionId}`, payload)
  return response.data as QuizQuestionItem
}

export const deleteQuizQuestion = async (questionId: number) => {
  const response = await api.delete(`/instructor/quiz-questions/${questionId}`)
  return response.data as { message: string }
}

export const createQuizOption = async (questionId: number, payload: CreateQuizOptionPayload) => {
  const response = await api.post(`/instructor/quiz-questions/${questionId}/options`, payload)
  return response.data as QuizOptionItem
}

export const updateQuizOption = async (optionId: number, payload: UpdateQuizOptionPayload) => {
  const response = await api.put(`/instructor/quiz-options/${optionId}`, payload)
  return response.data as QuizOptionItem
}

export const deleteQuizOption = async (optionId: number) => {
  const response = await api.delete(`/instructor/quiz-options/${optionId}`)
  return response.data as { message: string }
}

// ==================== ASSIGNMENTS CRUD ====================

export interface CreateInstructorAssignmentPayload {
  title: string
  description?: string | null
  course_id: number
  due_date?: string | null
}

export interface UpdateInstructorAssignmentPayload {
  title?: string
  description?: string | null
  course_id?: number
  due_date?: string | null
}

export const createInstructorAssignment = async (payload: CreateInstructorAssignmentPayload) => {
  const response = await api.post('/instructor/assignments', payload)
  return response.data as InstructorAssignmentItem
}

export const updateInstructorAssignment = async (assignmentId: number, payload: UpdateInstructorAssignmentPayload) => {
  const response = await api.put(`/instructor/assignments/${assignmentId}`, payload)
  return response.data as InstructorAssignmentItem
}

export const deleteInstructorAssignment = async (assignmentId: number) => {
  const response = await api.delete(`/instructor/assignments/${assignmentId}`)
  return response.data as { message: string }
}

// ==================== STUDENT QUIZ ====================

export interface StudentQuizQuestionOption {
  id: number | string
  option_text: string
  order: number
}

export interface StudentQuizQuestion {
  id: number
  question_text: string
  question_type: 'multiple_choice' | 'true_false' | 'short_answer'
  points: number
  options: StudentQuizQuestionOption[]
}

export interface StudentQuizPayload {
  id: number
  title: string
  description: string | null
  course_id: number
  pass_score: number
  total_questions: number
  total_points: number
  questions: StudentQuizQuestion[]
  previous_attempt: {
    id: number
    score: number
    is_passed: boolean
    attempted_at: string | null
  } | null
}

export interface StudentQuizSubmitAnswer {
  question_id: number
  answer_data: {
    selected_option_ids?: number[]
    value?: string
    text?: string
  }
}

export interface StudentQuizSubmitPayload {
  answers: StudentQuizSubmitAnswer[]
}

export interface StudentQuizResultPayload {
  message: string
  result: {
    attempt_id: number
    score: number
    is_passed: boolean
    pass_score: number
    total_questions: number
    correct_answers: number
  }
}

export interface StudentQuizAnswerDetail {
  question_id: number
  question_text: string
  question_type: string
  points_possible: number
  points_earned: number
  is_correct: boolean
  your_answer: Record<string, unknown>
  correct_options?: Array<{ id: number; text: string }>
  all_options?: Array<{ id: number; text: string; is_correct: boolean; was_selected: boolean }>
  correct_answer?: string
  note?: string
}

export interface StudentQuizDetailResult {
  quiz: {
    id: number
    title: string
    pass_score: number
  }
  attempt: {
    id: number
    score: number
    is_passed: boolean
    attempted_at: string | null
  }
  summary: {
    total_questions: number
    correct_answers: number
    incorrect_answers: number
    total_points_earned: number
    total_points_possible: number
  }
  answers: StudentQuizAnswerDetail[]
}

export const fetchStudentQuiz = async (quizId: number) => {
  const response = await api.get(`/student/quizzes/${quizId}`)
  return response.data as StudentQuizPayload
}

export const submitStudentQuiz = async (quizId: number, payload: StudentQuizSubmitPayload) => {
  const response = await api.post(`/student/quizzes/${quizId}/submit`, payload)
  return response.data as StudentQuizResultPayload
}

export const fetchStudentQuizResult = async (quizId: number, attemptId?: number) => {
  const params = attemptId ? { attempt_id: attemptId } : undefined
  const response = await api.get(`/student/quizzes/${quizId}/result`, { params })
  return response.data as StudentQuizDetailResult
}

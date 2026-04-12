import { createBrowserRouter } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import { dashboardPaths } from '../features/dashboard/utils/navigation';

const LandingPage = lazy(() => import('../features/landing/LandingPage'));
const LoginPage = lazy(() => import('../features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('../features/auth/pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../features/auth/pages/ForgotPasswordPage'));
const DashboardHomePage = lazy(() => import('../features/dashboard/pages/DashboardHomePage'));
const StudentDashboardPage = lazy(() => import('../features/dashboard/pages/StudentDashboardPage'));
const InstructorDashboardPage = lazy(() => import('../features/dashboard/pages/InstructorDashboardPage'));
const AdminDashboardPage = lazy(() => import('../features/dashboard/pages/AdminDashboardPage'));
const StudentCoursesPage = lazy(() => import('../features/dashboard/pages/StudentCoursesPage'));
const StudentCatalogPage = lazy(() => import('../features/dashboard/pages/StudentCatalogPage'));
const StudentProgressPage = lazy(() => import('../features/dashboard/pages/StudentProgressPage'));
const StudentQuizPage = lazy(() => import('../features/dashboard/pages/StudentQuizPage'))
const StudentQuizResultPage = lazy(() => import('../features/dashboard/pages/StudentQuizResultPage'))
const StudentQuizListingPage = lazy(() => import('../features/dashboard/pages/StudentQuizListingPage'));
const StudentAssignmentsPage = lazy(() => import('../features/dashboard/pages/StudentAssignmentsPage'));
const StudentCertificatesPage = lazy(() => import('../features/dashboard/pages/StudentCertificatesPage'));
const StudentCalendarPage = lazy(() => import('../features/dashboard/pages/StudentCalendarPage'));
const StudentMessagesPage = lazy(() => import('../features/dashboard/pages/StudentMessagesPage'));
const StudentGradesPage = lazy(() => import('../features/dashboard/pages/StudentGradesPage'));
const StudentNotificationsPage = lazy(() => import('../features/dashboard/pages/StudentNotificationsPage'));
const StudentProfilePage = lazy(() => import('../features/dashboard/pages/StudentProfilePage'));
const StudentHelpPage = lazy(() => import('../features/dashboard/pages/StudentHelpPage'));
const InstructorCoursesPage = lazy(() => import('../features/dashboard/pages/InstructorCoursesPage'));
const InstructorStudentsPage = lazy(() => import('../features/dashboard/pages/InstructorStudentsPage'));
const InstructorNotificationsPage = lazy(() => import('../features/dashboard/pages/InstructorNotificationsPage'));
const InstructorProfilePage = lazy(() => import('../features/dashboard/pages/InstructorProfilePage'));
const InstructorHelpPage = lazy(() => import('../features/dashboard/pages/InstructorHelpPage'));
const InstructorCalendarPage = lazy(() => import('../features/dashboard/pages/InstructorCalendarPage'));
const InstructorQuizPage = lazy(() => import('../features/dashboard/pages/InstructorQuizPage'));
const InstructorAssignmentsPage = lazy(() => import('../features/dashboard/pages/InstructorAssignmentsPage'));
const InstructorStatsPage = lazy(() => import('../features/dashboard/pages/InstructorStatsPage'));
const InstructorMessagesPage = lazy(() => import('../features/dashboard/pages/InstructorMessagesPage'));
const StudentCourseDetailPage = lazy(() => import('../features/dashboard/pages/StudentCourseDetailPage'));
const StudentLessonPage = lazy(() => import('../features/dashboard/pages/StudentLessonPage'));
const AdminUsersPage = lazy(() => import('../features/dashboard/pages/AdminUsersPage'));
const AdminModerationPage = lazy(() => import('../features/dashboard/pages/AdminModerationPage'));
const AdminHealthPage = lazy(() => import('../features/dashboard/pages/AdminHealthPage'));
const AdminActivityPage = lazy(() => import('../features/dashboard/pages/AdminActivityPage'));
const ScrollExpansionDemo = lazy(() => import('../features/demo/ScrollExpansionDemo'));
const ProjectPresentationPage = lazy(() => import('../features/presentation/ProjectPresentationPage'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-black">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3054ff]"></div>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <LandingPage />
      </Suspense>
    ),
  },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <Suspense fallback={<LoadingFallback />}>
          <LoginPage />
        </Suspense>
      </PublicRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicRoute>
        <Suspense fallback={<LoadingFallback />}>
          <RegisterPage />
        </Suspense>
      </PublicRoute>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <PublicRoute>
        <Suspense fallback={<LoadingFallback />}>
          <ForgotPasswordPage />
        </Suspense>
      </PublicRoute>
    ),
  },
  {
    path: dashboardPaths.home,
    element: (
      <ProtectedRoute>
        <Suspense fallback={<LoadingFallback />}>
          <DashboardHomePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: dashboardPaths.student,
    element: (
      <ProtectedRoute allowedRoles={['student']}>
        <Suspense fallback={<LoadingFallback />}>
          <StudentDashboardPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: dashboardPaths.studentCourses,
    element: (
      <ProtectedRoute allowedRoles={['student']}>
        <Suspense fallback={<LoadingFallback />}>
          <StudentCoursesPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: dashboardPaths.studentCatalog,
    element: (
      <ProtectedRoute allowedRoles={['student']}>
        <Suspense fallback={<LoadingFallback />}>
          <StudentCatalogPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: dashboardPaths.studentProgress,
    element: (
      <ProtectedRoute allowedRoles={['student']}>
        <Suspense fallback={<LoadingFallback />}>
          <StudentProgressPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: dashboardPaths.studentQuiz,
    element: (
      <ProtectedRoute allowedRoles={['student']}>
        <Suspense fallback={<LoadingFallback />}>
          <StudentQuizListingPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard/student/quiz/:quizId',
    element: (
      <ProtectedRoute allowedRoles={['student']}>
        <Suspense fallback={<LoadingFallback />}>
          <StudentQuizPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard/student/quiz/:quizId/result',
    element: (
      <ProtectedRoute allowedRoles={['student']}>
        <Suspense fallback={<LoadingFallback />}>
          <StudentQuizResultPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: dashboardPaths.studentAssignments,
    element: (
      <ProtectedRoute allowedRoles={['student']}>
        <Suspense fallback={<LoadingFallback />}>
          <StudentAssignmentsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: dashboardPaths.studentCertificates,
    element: (
      <ProtectedRoute allowedRoles={['student']}>
        <Suspense fallback={<LoadingFallback />}>
          <StudentCertificatesPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: dashboardPaths.studentCalendar,
    element: (
      <ProtectedRoute allowedRoles={['student']}>
        <Suspense fallback={<LoadingFallback />}>
          <StudentCalendarPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: dashboardPaths.studentMessages,
    element: (
      <ProtectedRoute allowedRoles={['student']}>
        <Suspense fallback={<LoadingFallback />}>
          <StudentMessagesPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: dashboardPaths.studentGrades,
    element: (
      <ProtectedRoute allowedRoles={['student']}>
        <Suspense fallback={<LoadingFallback />}>
          <StudentGradesPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: dashboardPaths.studentNotifications,
    element: (
      <ProtectedRoute allowedRoles={['student']}>
        <Suspense fallback={<LoadingFallback />}>
          <StudentNotificationsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: dashboardPaths.studentProfile,
    element: (
      <ProtectedRoute allowedRoles={['student']}>
        <Suspense fallback={<LoadingFallback />}>
          <StudentProfilePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: dashboardPaths.studentHelp,
    element: (
      <ProtectedRoute allowedRoles={['student']}>
        <Suspense fallback={<LoadingFallback />}>
          <StudentHelpPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard/student/courses/:courseId',
    element: (
      <ProtectedRoute allowedRoles={['student']}>
        <Suspense fallback={<LoadingFallback />}>
          <StudentCourseDetailPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard/student/courses/:courseId/lessons/:lessonId',
    element: (
      <ProtectedRoute allowedRoles={['student']}>
        <Suspense fallback={<LoadingFallback />}>
          <StudentLessonPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: dashboardPaths.instructor,
    element: (
      <ProtectedRoute allowedRoles={['instructor']}>
        <Suspense fallback={<LoadingFallback />}>
          <InstructorDashboardPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: dashboardPaths.instructorCourses,
    element: (
      <ProtectedRoute allowedRoles={['instructor']}>
        <Suspense fallback={<LoadingFallback />}>
          <InstructorCoursesPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: dashboardPaths.instructorStudents,
    element: (
      <ProtectedRoute allowedRoles={['instructor']}>
        <Suspense fallback={<LoadingFallback />}>
          <InstructorStudentsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: dashboardPaths.instructorNotifications,
    element: (
      <ProtectedRoute allowedRoles={['instructor']}>
        <Suspense fallback={<LoadingFallback />}>
          <InstructorNotificationsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: dashboardPaths.instructorProfile,
    element: (
      <ProtectedRoute allowedRoles={['instructor']}>
        <Suspense fallback={<LoadingFallback />}>
          <InstructorProfilePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: dashboardPaths.instructorHelp,
    element: (
      <ProtectedRoute allowedRoles={['instructor']}>
        <Suspense fallback={<LoadingFallback />}>
          <InstructorHelpPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: dashboardPaths.instructorCalendar,
    element: (
      <ProtectedRoute allowedRoles={['instructor']}>
        <Suspense fallback={<LoadingFallback />}>
          <InstructorCalendarPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: dashboardPaths.instructorQuiz,
    element: (
      <ProtectedRoute allowedRoles={['instructor']}>
        <Suspense fallback={<LoadingFallback />}>
          <InstructorQuizPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: dashboardPaths.instructorAssignments,
    element: (
      <ProtectedRoute allowedRoles={['instructor']}>
        <Suspense fallback={<LoadingFallback />}>
          <InstructorAssignmentsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: dashboardPaths.instructorStats,
    element: (
      <ProtectedRoute allowedRoles={['instructor']}>
        <Suspense fallback={<LoadingFallback />}>
          <InstructorStatsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: dashboardPaths.instructorMessages,
    element: (
      <ProtectedRoute allowedRoles={['instructor']}>
        <Suspense fallback={<LoadingFallback />}>
          <InstructorMessagesPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: dashboardPaths.admin,
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <Suspense fallback={<LoadingFallback />}>
          <AdminDashboardPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: dashboardPaths.adminUsers,
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <Suspense fallback={<LoadingFallback />}>
          <AdminUsersPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: dashboardPaths.adminModeration,
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <Suspense fallback={<LoadingFallback />}>
          <AdminModerationPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: dashboardPaths.adminHealth,
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <Suspense fallback={<LoadingFallback />}>
          <AdminHealthPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: dashboardPaths.adminActivity,
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <Suspense fallback={<LoadingFallback />}>
          <AdminActivityPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/demo/scroll',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <ScrollExpansionDemo />
      </Suspense>
    ),
  },
  {
    path: '/presentation',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <ProjectPresentationPage />
      </Suspense>
    ),
  },
]);

import { createBrowserRouter } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import AuthLayout from '../shared/components/layout/AuthLayout';
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
const StudentQuizPage = lazy(() => import('../features/dashboard/pages/StudentQuizPage'));
const StudentAssignmentsPage = lazy(() => import('../features/dashboard/pages/StudentAssignmentsPage'));
const StudentCertificatesPage = lazy(() => import('../features/dashboard/pages/StudentCertificatesPage'));
const StudentCalendarPage = lazy(() => import('../features/dashboard/pages/StudentCalendarPage'));
const StudentMessagesPage = lazy(() => import('../features/dashboard/pages/StudentMessagesPage'));
const StudentCourseDetailPage = lazy(() => import('../features/dashboard/pages/StudentCourseDetailPage'));
const StudentLessonPage = lazy(() => import('../features/dashboard/pages/StudentLessonPage'));
const AdminUsersPage = lazy(() => import('../features/dashboard/pages/AdminUsersPage'));
const ScrollExpansionDemo = lazy(() => import('../features/demo/ScrollExpansionDemo'));

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
        <AuthLayout>
          <Suspense fallback={<LoadingFallback />}>
            <ForgotPasswordPage />
          </Suspense>
        </AuthLayout>
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
          <StudentQuizPage />
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
    path: '/demo/scroll',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <ScrollExpansionDemo />
      </Suspense>
    ),
  },
]);

import { createBrowserRouter } from 'react-router-dom'
import { HomePage } from '../pages/HomePage'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage } from '../features/auth/pages/RegisterPage'
import { DashboardPage } from '../pages/DashboardPage'
import { StudentsPage } from '../pages/StudentsPage'
import { StudentDetailPage } from '../pages/StudentDetailPage'
import { TeachersPage } from '../pages/TeachersPage'
import { TeacherDetailPage } from '../pages/TeacherDetailPage'
import { AttendancePage } from '../pages/AttendancePage'
import { FeesPage } from '../pages/FeesPage'
import { CoursesPage } from '../pages/CoursesPage'
import { CourseDetailPage } from '../pages/CourseDetailPage'
import { ExamsPage } from '../pages/ExamsPage'
import { ExamTakerPage } from '../pages/ExamTakerPage'
import { ExamResultsPage } from '../pages/ExamResultsPage'
import { NotificationsPage } from '../pages/NotificationsPage'
import { ProfilePage } from '../pages/ProfilePage'
import { IdCardPage } from '../pages/IdCardPage'
import { IdCardsManagementPage } from '../pages/IdCardsManagementPage'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import { ResetPasswordPage } from '../features/auth/pages/ResetPasswordPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
    children: [],
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/id-cards',
    element: (
      <ProtectedRoute>
        <IdCardsManagementPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/id-card/:type/:id',
    element: (
      <ProtectedRoute>
        <IdCardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/students',
    element: (
      <ProtectedRoute>
        <StudentsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/students/:id',
    element: (
      <ProtectedRoute>
        <StudentDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/teachers',
    element: (
      <ProtectedRoute>
        <TeachersPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/teachers/:id',
    element: (
      <ProtectedRoute>
        <TeacherDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/courses',
    element: (
      <ProtectedRoute>
        <CoursesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/courses/:id',
    element: (
      <ProtectedRoute>
        <CourseDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/attendance',
    element: (
      <ProtectedRoute>
        <AttendancePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/fees',
    element: (
      <ProtectedRoute>
        <FeesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/notifications',
    element: (
      <ProtectedRoute>
        <NotificationsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/exams',
    element: (
      <ProtectedRoute>
        <ExamsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/exams/:id/attempt',
    element: (
      <ProtectedRoute>
        <ExamTakerPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/exams/:attemptId/results',
    element: (
      <ProtectedRoute>
        <ExamResultsPage />
      </ProtectedRoute>
    ),
  },
])
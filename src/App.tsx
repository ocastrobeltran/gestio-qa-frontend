"use client"

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { Suspense, lazy, useEffect, useState } from "react"
import { AuthProvider } from "./contexts/AuthContext"
import { ThemeProvider } from "./contexts/ThemeContext"
import ProtectedRoute from "./components/auth/ProtectedRoute"
import RoleRoute from "./components/auth/RoleRoute"
import Layout from "./components/layout/Layout"
import LoadingScreen from "./components/ui/LoadingScreen"
import { Toaster } from "./components/ui/toaster"

// Lazy loaded components
const LoginPage = lazy(() => import("./pages/auth/LoginPage"))
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage"))
const ResetPasswordPage = lazy(() => import("./pages/auth/ResetPasswordPage"))
const DashboardPage = lazy(() => import("./pages/dashboard/DashboardPage"))
const ProjectsPage = lazy(() => import("./pages/projects/ProjectsPage"))
const ProjectDetailPage = lazy(() => import("./pages/projects/ProjectDetailPage"))
const CreateProjectPage = lazy(() => import("./pages/projects/CreateProjectPage"))
const EditProjectPage = lazy(() => import("./pages/projects/EditProjectPage"))
const UsersPage = lazy(() => import("./pages/users/UsersPage"))
const UserDetailPage = lazy(() => import("./pages/users/UserDetailPage"))
const CreateUserPage = lazy(() => import("./pages/users/CreateUserPage"))
const EditUserPage = lazy(() => import("./pages/users/EditUserPage"))
const ReportsPage = lazy(() => import("./pages/reports/ReportsPage"))
const ProfilePage = lazy(() => import("./pages/profile/ProfilePage"))
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"))

function App() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

              {/* Protected routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/:id" element={<ProjectDetailPage />} />
                <Route
                  path="/projects/create"
                  element={
                    <RoleRoute allowedRoles={["admin", "analyst"]}>
                      <CreateProjectPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/projects/:id/edit"
                  element={
                    <RoleRoute allowedRoles={["admin", "analyst"]}>
                      <EditProjectPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <RoleRoute allowedRoles={["admin"]}>
                      <UsersPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/users/:id"
                  element={
                    <RoleRoute allowedRoles={["admin"]}>
                      <UserDetailPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/users/create"
                  element={
                    <RoleRoute allowedRoles={["admin"]}>
                      <CreateUserPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/users/:id/edit"
                  element={
                    <RoleRoute allowedRoles={["admin"]}>
                      <EditUserPage />
                    </RoleRoute>
                  }
                />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>

              {/* 404 route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
          <Toaster />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  )
}

export default App

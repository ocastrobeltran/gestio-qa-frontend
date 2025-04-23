"use client"

import type React from "react"

import { Navigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import type { User } from "../../types/user"

interface RoleRouteProps {
  children: React.ReactNode
  allowedRoles: Array<User["role"]>
}

const RoleRoute = ({ children, allowedRoles }: RoleRouteProps) => {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export default RoleRoute

"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { api } from "../services/api"
import type { User } from "../types/user"
import { useToast } from "../components/ui/use-toast"
import { jwtDecode } from "jwt-decode" // Corregido: usando importación nombrada

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

interface JwtPayload {
  userId: number
  email: string
  role: string
  full_name: string
  iat: number
  exp: number
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"))
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("token")

      if (storedToken) {
        try {
          // Decode JWT token to get user info instead of calling /auth/me
          const decoded = jwtDecode<JwtPayload>(storedToken)

          // Check if token is expired
          const currentTime = Date.now() / 1000
          if (decoded.exp < currentTime) {
            throw new Error("Token expired")
          }

          // Create user object from token payload
          const userData: User = {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            full_name: decoded.full_name,
          }

          setUser(userData)
          setToken(storedToken)
        } catch (error) {
          console.error("Error validating token:", error)
          localStorage.removeItem("token")
          setToken(null)
          setUser(null)

          // Only redirect to login if not already on a public route
          const publicRoutes = ["/login", "/forgot-password", "/reset-password"]
          const isPublicRoute = publicRoutes.some(
            (route) => location.pathname === route || location.pathname.startsWith("/reset-password/"),
          )

          if (!isPublicRoute) {
            navigate("/login")
          }
        }
      }

      setIsLoading(false)
    }

    initializeAuth()
  }, [navigate, location.pathname])

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const response = await api.post("/auth/login", { email, password })
      const { token: authToken } = response.data

      // Decode the token to get user data
      const decoded = jwtDecode<JwtPayload>(authToken)

      // Create user object from token payload
      const userData: User = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        full_name: decoded.full_name,
      }

      localStorage.setItem("token", authToken)
      setToken(authToken)
      setUser(userData)

      toast({
        title: "Inicio de sesión exitoso",
        description: `Bienvenido, ${userData.full_name}`,
      })

      navigate("/dashboard")
    } catch (error: any) {
      console.error("Login error:", error)
      const errorMessage = error.response?.data?.message || "Error al iniciar sesión"
      toast({
        variant: "destructive",
        title: "Error de autenticación",
        description: errorMessage,
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    setToken(null)
    setUser(null)
    navigate("/login")
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente",
    })
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
  }

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    isLoading,
    login,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { api } from "../services/api"
import type { User } from "../types/user"
import { useToast } from "../components/ui/use-toast"
import { jwtDecode } from "jwt-decode"

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

// Ajustada para manejar diferentes estructuras de token JWT
interface JwtPayload {
  id?: number
  userId?: number
  user_id?: number
  email: string
  role?: string
  full_name?: string
  name?: string
  username?: string
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

  const extractUserFromToken = (token: string): User => {
    try {
      console.log("Decodificando token:", token.substring(0, 20) + "...")
      const decoded = jwtDecode<JwtPayload>(token)
      console.log("Token decodificado:", decoded)

      // Aseguramos que el rol se extraiga correctamente
      let role = decoded.role || "viewer"
      
      // Normalizamos el rol a valores conocidos
      role = role.toLowerCase()
      if (role === "admin" || role === "administrator") role = "admin"
      if (role === "analyst" || role === "qa" || role === "tester") role = "analyst"
      if (role === "viewer" || role === "stakeholder" || role === "user") role = "viewer"

      // Adaptamos los campos del token a nuestra estructura User
      const userData: User = {
        id: decoded.id || decoded.userId || decoded.user_id || 0,
        email: decoded.email || "",
        role: role,
        full_name: decoded.full_name || decoded.name || decoded.username || decoded.email?.split("@")[0] || "Usuario",
      }

      console.log("Datos de usuario extraídos:", userData)
      return userData
    } catch (error) {
      console.error("Error al decodificar el token:", error)
      throw error
    }
  }

  // Función para redirigir según el rol del usuario
  const redirectBasedOnRole = (user: User) => {
    if (!user) return

    // Si ya estamos en dashboard o rutas específicas, no redirigir
    if (location.pathname === "/dashboard") return
    
    // Si estamos en una ruta protegida específica, no redirigir
    const protectedRoutes = ["/projects", "/users", "/reports", "/profile", "/configuration"]
    if (protectedRoutes.some((route) => location.pathname.startsWith(route))) return

    // Público para login y otras páginas públicas
    const publicRoutes = ["/login", "/forgot-password", "/reset-password"]
    if (publicRoutes.some((route) => location.pathname === route || 
                          location.pathname.startsWith("/reset-password/"))) {
      // Si estamos en una página pública pero ya estamos autenticados, redirigir al dashboard
      navigate("/dashboard")
      return
    }

    // Por ahora todas las redirecciones van al dashboard general
    // Aquí podrías personalizar si quieres dashboards específicos por rol
    navigate("/dashboard")
    
    console.log(`Usuario con rol '${user.role}' redirigido a /dashboard`)
  }

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("token")
      const storedUserData = localStorage.getItem("userData")
  
      if (storedToken) {
        try {
          // Verificar si el token es válido y no ha expirado
          const decoded = jwtDecode<JwtPayload>(storedToken)
  
          // Verificar expiración
          const currentTime = Date.now() / 84600
          if (decoded.exp < currentTime) {
            console.warn("Token expirado")
            throw new Error("Token expired")
          }
  
          // Primero intentar usar los datos almacenados del usuario
          let userData: User | null = null
          
          if (storedUserData) {
            try {
              userData = JSON.parse(storedUserData) as User
              console.log("Usuario recuperado de localStorage:", userData)
            } catch (e) {
              console.error("Error parseando datos de usuario almacenados:", e)
            }
          }
          
          // Si no hay datos almacenados o hay error al parsearlos, extraer del token
          if (!userData) {
            userData = extractUserFromToken(storedToken)
            console.log("Usuario extraído del token como fallback:", userData)
          }
          
          setUser(userData)
          setToken(storedToken)
  
          // Configurar el token para todas las solicitudes API
          api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`
  
          // Redirigir según el rol si es necesario
          redirectBasedOnRole(userData)
        } catch (error) {
          console.error("Error validando token:", error)
          localStorage.removeItem("token")
          localStorage.removeItem("userData")
          setToken(null)
          setUser(null)
          delete api.defaults.headers.common["Authorization"]
  
          // Solo redirigir a login si no estamos ya en una ruta pública
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

  // Modificación en AuthContext.tsx - función login

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      console.log("Intentando login con:", { email })

      const response = await api.post("/auth/login", { email, password })
      console.log("Respuesta de login:", response.data)

      // Extraer el token de la respuesta
      const authToken =
        response.data.token ||
        response.data.access_token ||
        (response.data.data && response.data.data.token) ||
        response.data

      if (!authToken || typeof authToken !== "string") {
        console.error("No se recibió un token válido:", authToken)
        throw new Error("No se recibió un token válido")
      }

      console.log("Token obtenido:", authToken.substring(0, 20) + "...")

      // En lugar de extraer datos del token, usamos los datos del usuario que vienen en la respuesta
      let userData: User

      // Verificamos si los datos del usuario vienen en la respuesta
      if (response.data.data && response.data.data.user) {
        // Usar directamente los datos del usuario de la respuesta
        const userResponse = response.data.data.user
        userData = {
          id: userResponse.id,
          email: userResponse.email || "",
          role: userResponse.role || "viewer",
          full_name: userResponse.full_name || userResponse.name || "Usuario"
        }
        console.log("Usuario obtenido de la respuesta:", userData)
      } else {
        // Si no hay datos completos en la respuesta, intentamos extraerlos del token como fallback
        try {
          userData = extractUserFromToken(authToken)
          console.log("Usuario extraído del token:", userData)
        } catch (error) {
          console.error("Error extrayendo usuario del token:", error)
          throw new Error("No se pudo obtener la información del usuario")
        }
      }

      // Guardar token y configurar headers para futuras solicitudes
      localStorage.setItem("token", authToken)
      api.defaults.headers.common["Authorization"] = `Bearer ${authToken}`

      // Almacenar los datos completos del usuario en localStorage para persistencia
      localStorage.setItem("userData", JSON.stringify(userData))

      // Actualizar estado
      setToken(authToken)
      setUser(userData)

      toast({
        title: "Inicio de sesión exitoso",
        description: `Bienvenido, ${userData.full_name}`,
      })

      // Redirigir según el rol
      redirectBasedOnRole(userData)
    } catch (error: any) {
      console.error("Error de login:", error)
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
    localStorage.removeItem("userData")
    delete api.defaults.headers.common["Authorization"]
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

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { api } from "../services/api"
import axios from "axios" // Importar axios directamente
import type { User } from "../types/user"
import { useToast } from "../components/ui/use-toast"
import { jwtDecode } from "jwt-decode"

interface AuthContextType {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
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
  id: number
  iat: number
  exp: number
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem("accessToken"))
  const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem("refreshToken"))
  const [isLoading, setIsLoading] = useState(true)
  // Eliminamos la variable refreshing que no se usa
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  // Función para obtener un nuevo access token usando el refresh token
  const getNewAccessToken = async (): Promise<string | null> => {
    if (!refreshToken) return null;
    
    try {
      // No usamos setRefreshing ya que la eliminamos
      
      // Crear una instancia de axios independiente para evitar interceptores
      const axiosInstance = axios.create({
        baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
        headers: {
          "Content-Type": "application/json",
        }
      });
      
      console.log("Solicitando nuevo token con refresh token");
      const response = await axiosInstance.post("/auth/refresh-token", { refreshToken });
      console.log("Respuesta de refresh token:", response.data);
      
      if (response.data && response.data.accessToken) {
        const newAccessToken = response.data.accessToken;
        console.log("Nuevo access token obtenido:", newAccessToken.substring(0, 20) + "...");
        
        localStorage.setItem("accessToken", newAccessToken);
        setAccessToken(newAccessToken);
        
        // Actualizar el usuario si viene en la respuesta
        if (response.data.data && response.data.data.user) {
          setUser(response.data.data.user);
          localStorage.setItem("userData", JSON.stringify(response.data.data.user));
        }
        
        return newAccessToken;
      } else {
        console.error("Respuesta de refresh token no contiene accessToken:", response.data);
        return null;
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      
      // Si hay un error 401, el refresh token no es válido
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        console.log("Refresh token inválido o expirado, cerrando sesión");
        // Limpiar sesión
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userData");
        setAccessToken(null);
        setRefreshToken(null);
        setUser(null);
        
        // Solo redirigir si no estamos ya en login
        if (location.pathname !== "/login") {
          navigate("/login");
        }
      }
      
      return null;
    }
  };

  // Configurar interceptor para renovar token automáticamente
  useEffect(() => {
    let isRefreshing = false;
    let refreshPromise: Promise<string | null> | null = null;
    let failedQueue: Array<{
      resolve: (token: string | null) => void;
      reject: (error: any) => void;
    }> = [];
    
    // Procesar cola de solicitudes fallidas
    const processQueue = (token: string | null, error: any = null) => {
      failedQueue.forEach(promise => {
        if (error) {
          promise.reject(error);
        } else {
          promise.resolve(token);
        }
      });
      
      failedQueue = [];
    };
    
    const requestInterceptor = api.interceptors.request.use(
      async (config) => {
        // No añadir token a las solicitudes de refresh token
        if (config.url?.includes('/auth/refresh-token')) {
          return config;
        }
        
        if (!accessToken) return config;
        
        try {
          // Verificar si el token está por expirar
          const decoded = jwtDecode<JwtPayload>(accessToken);
          const currentTime = Math.floor(Date.now() / 1000);
          
          // Si expira en menos de 5 minutos, intentar renovarlo
          if (decoded.exp < currentTime + 300) {
            // Evitar múltiples solicitudes de renovación simultáneas
            if (!isRefreshing) {
              console.log("Token por expirar, renovando...");
              isRefreshing = true;
              refreshPromise = getNewAccessToken();
              
              refreshPromise
                .then(token => {
                  processQueue(token);
                })
                .catch(error => {
                  processQueue(null, error);
                })
                .finally(() => {
                  isRefreshing = false;
                  refreshPromise = null;
                });
            }
            
            if (refreshPromise) {
              try {
                // Esperar a que se complete la renovación actual
                const newToken = await refreshPromise;
                if (newToken) {
                  config.headers.Authorization = `Bearer ${newToken}`;
                  return config;
                }
              } catch (error) {
                console.error("Error esperando renovación de token:", error);
              }
            }
          }
          
          // Si no necesita renovación o falló la renovación, usar el token actual
          config.headers.Authorization = `Bearer ${accessToken}`;
        } catch (error) {
          console.error("Error verificando token:", error);
          if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
          }
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // Si es error 401 y no es un intento de refresh token y no se ha intentado ya
        if (error.response?.status === 401 && 
            !originalRequest._retry && 
            !originalRequest.url?.includes('/auth/refresh-token')) {
          originalRequest._retry = true;
          
          if (!isRefreshing) {
            isRefreshing = true;
            refreshPromise = getNewAccessToken();
            
            refreshPromise
              .then(token => {
                processQueue(token);
              })
              .catch(error => {
                processQueue(null, error);
              })
              .finally(() => {
                isRefreshing = false;
                refreshPromise = null;
              });
          }
          
          try {
            // Crear una promesa que se resolverá cuando se complete la renovación
            const newToken = await new Promise<string | null>((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            });
            
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return api(originalRequest);
            }
          } catch (error) {
            console.error("Error renovando token para solicitud fallida:", error);
            return Promise.reject(error);
          }
        }
        
        return Promise.reject(error);
      }
    );
    
    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [accessToken, refreshToken]);

  // Inicializar autenticación
  useEffect(() => {
    const initializeAuth = async () => {
      const storedAccessToken = localStorage.getItem("accessToken");
      const storedRefreshToken = localStorage.getItem("refreshToken");
      const storedUserData = localStorage.getItem("userData");
      
      if (storedAccessToken && storedRefreshToken) {
        try {
          // Verificar si el access token es válido
          const decoded = jwtDecode<JwtPayload>(storedAccessToken);
          const currentTime = Math.floor(Date.now() / 1000);
          
          console.log("Token exp:", decoded.exp);
          console.log("Current time:", currentTime);
          console.log("Difference (seconds):", decoded.exp - currentTime);
          console.log("Difference (minutes):", (decoded.exp - currentTime) / 60);
          
          // Si el token ha expirado, intentar renovarlo
          if (decoded.exp <= currentTime) {
            console.log("Token expirado, intentando renovar...");
            const newToken = await getNewAccessToken();
            
            if (!newToken) {
              throw new Error("No se pudo renovar el token");
            }
          }
          
          // Cargar datos del usuario
          let userData: User | null = null;
          
          if (storedUserData) {
            try {
              userData = JSON.parse(storedUserData) as User;
              console.log("Usuario recuperado de localStorage:", userData);
            } catch (e) {
              console.error("Error parseando datos de usuario:", e);
            }
          }
          
          if (!userData) {
            // Si no hay datos de usuario, intentar obtenerlos del backend
            try {
              const userResponse = await api.get("/users/profile");
              userData = userResponse.data.data.user;
              localStorage.setItem("userData", JSON.stringify(userData));
              console.log("Usuario obtenido del backend:", userData);
            } catch (e) {
              console.error("Error obteniendo perfil de usuario:", e);
              throw new Error("No se pudo obtener información del usuario");
            }
          }
          
          setUser(userData);
          setAccessToken(storedAccessToken);
          setRefreshToken(storedRefreshToken);
          
          // Configurar token para solicitudes
          api.defaults.headers.common["Authorization"] = `Bearer ${storedAccessToken}`;
          
          // Redirigir según rol si es necesario
          redirectBasedOnRole(userData);
        } catch (error) {
          console.error("Error validando sesión:", error);
          // Limpiar todo
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("userData");
          setAccessToken(null);
          setRefreshToken(null);
          setUser(null);
          delete api.defaults.headers.common["Authorization"];
          
          // Redirigir a login si no estamos en ruta pública
          const publicRoutes = ["/login", "/forgot-password", "/reset-password"];
          const isPublicRoute = publicRoutes.some(
            (route) => location.pathname === route || location.pathname.startsWith("/reset-password/")
          );
          
          if (!isPublicRoute) {
            navigate("/login");
          }
        }
      }
      
      setIsLoading(false);
    };
    
    initializeAuth();
  }, [navigate, location.pathname]);

  // Función de login actualizada
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const response = await api.post("/auth/login", { email, password });
      console.log("Respuesta de login:", response.data);
      
      if (!response.data || !response.data.accessToken || !response.data.refreshToken) {
        throw new Error("Respuesta de login inválida");
      }
      
      const { accessToken: newAccessToken, refreshToken: newRefreshToken, data } = response.data;
      
      // Guardar tokens
      localStorage.setItem("accessToken", newAccessToken);
      localStorage.setItem("refreshToken", newRefreshToken);
      
      // Guardar datos de usuario
      const userData = data.user;
      localStorage.setItem("userData", JSON.stringify(userData));
      
      // Actualizar estado
      setAccessToken(newAccessToken);
      setRefreshToken(newRefreshToken);
      setUser(userData);
      
      // Configurar token para solicitudes
      api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
      
      toast({
        title: "Inicio de sesión exitoso",
        description: `Bienvenido, ${userData.full_name}`,
      });
      
      // Redirigir según rol
      redirectBasedOnRole(userData);
    } catch (error: any) {
      console.error("Error de login:", error);
      const errorMessage = error.response?.data?.message || "Error al iniciar sesión";
      toast({
        variant: "destructive",
        title: "Error de autenticación",
        description: errorMessage,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Función de logout actualizada
  const logout = async () => {
    try {
      // Intentar hacer logout en el servidor
      if (accessToken) {
        await api.post("/auth/logout");
      }
    } catch (error) {
      console.error("Error en logout:", error);
    } finally {
      // Limpiar todo localmente
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userData");
      delete api.defaults.headers.common["Authorization"];
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
      navigate("/login");
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
    }
  };

  // Función para redirigir según el rol
  const redirectBasedOnRole = (userData: User | null) => {
    if (!userData) return;

    // Si ya estamos en dashboard o rutas específicas, no redirigir
    if (location.pathname === "/dashboard") return;
    
    // Si estamos en una ruta protegida específica, no redirigir
    const protectedRoutes = ["/projects", "/users", "/reports", "/profile", "/configuration"];
    if (protectedRoutes.some((route) => location.pathname.startsWith(route))) return;

    // Público para login y otras páginas públicas
    const publicRoutes = ["/login", "/forgot-password", "/reset-password"];
    if (publicRoutes.some((route) => location.pathname === route || 
      location.pathname.startsWith("/reset-password/"))) {
      // Si estamos en una página pública pero ya estamos autenticados, redirigir al dashboard
      navigate("/dashboard");
      return;
    }

    // Por ahora todas las redirecciones van al dashboard general
    navigate("/dashboard");
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem("userData", JSON.stringify(updatedUser));
  };

  const value = {
    user,
    accessToken,
    refreshToken,
    isAuthenticated: !!accessToken,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
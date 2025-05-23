import axios from "axios"

// Create axios instance with base URL
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
  headers: {
    "Content-Type": "application/json",
  },
})

// Initialize axios interceptors for handling auth tokens and errors
export const initializeAxiosInterceptors = () => {
  // Request interceptor - add auth token to requests
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token")
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    },
  )

  // Response interceptor - handle token expiration and errors
  api.interceptors.response.use(
    (response) => {
      return response
    },
    (error) => {
      // Handle token expiration
      if (error.response?.status === 401) {
        // Check if the error is due to token expiration
        const isAuthError =
          error.response.data?.message?.includes("expired") || error.response.data?.message?.includes("invalid token")

        if (isAuthError && window.location.pathname !== "/login") {
          localStorage.removeItem("token")
          window.location.href = "/login"
        }
      }

      return Promise.reject(error)
    },
  )
}

// Auth services
export const authService = {
  login: (email: string, password: string) => {
    return api.post("/auth/login", { email, password });
  },
  refreshToken: (refreshToken: string) => {
    return api.post("/auth/refresh-token", { refreshToken });
  },
  logout: () => {
    return api.post("/auth/logout");
  },
  forgotPassword: (email: string) => {
    return api.post("/auth/forgot-password", { email })
  },
  resetPassword: (token: string, password: string) => {
    return api.post(`/auth/reset-password/${token}`, { password })
  },
  updatePassword: (currentPassword: string, newPassword: string) => {
    return api.patch("/auth/update-password", { currentPassword, newPassword })
  },
  getProfile: () => {
    return api.get("/users/profile")
  },
  updateProfile: (profileData: { full_name: string; email: string }) => {
    return api.put("/users/profile", profileData)
  },
}

// User services
export const userService = {
  getUsers: () => {
    return api.get("/users")
  },
  getUser: (id: string) => {
    console.log(`Requesting user with ID: ${id}`);
    return api.get(`/users/${id}`)
      .then(response => {
        console.log("User API response:", response);
        return response;
      })
      .catch(error => {
        console.error("Error in getUser API call:", error);
        throw error;
      });
  },
  createUser: (userData: any) => {
    return api.post("/auth/register", userData)
  },
  updateUser: (id: string, userData: any) => {
    return api.patch(`/users/${id}`, userData)
  },
  deleteUser: (id: string) => {
    return api.delete(`/users/${id}`)
  },
}

// Project services
export const projectService = {
  getProjects: (filters?: any) => {
    return api.get("/projects", { params: filters })
  },
  getProject: (id: string) => {
    return api.get(`/projects/${id}`)
  },
  createProject: (projectData: any) => {
    return api.post("/projects", projectData)
  },
  updateProject: (id: string, projectData: any) => {
    return api.patch(`/projects/${id}`, projectData)
  },
  deleteProject: (id: string) => {
    return api.delete(`/projects/${id}`)
  },
  addComment: (projectId: string, comment: string) => {
    return api.post(`/projects/${projectId}/comments`, { comment_text: comment })
  },

  assignAnalyst: (projectId: string, analystId: string) => {
    return api.patch(`/projects/${projectId}`, { qa_analyst_id: analystId });
  }
}

// Report services
export const reportService = {
  getProjectsByStatus: () => api.get('/reports/by-status'),
  getProjectsByAnalyst: () => api.get('/reports/by-analyst'),
  getProjectsByClient: () => api.get('/reports/by-client'),
  getDetailedReport: () => api.get('/reports/detailed'),
  getQualityMetrics: () => api.get('/reports/quality-metrics'),
};

// Defect services
export const defectService = {
  getDefects: (projectId: string) => {
    return api.get(`/projects/${projectId}/defects`);
  },
  getDefect: (projectId: string, defectId: string) => {
    return api.get(`/projects/${projectId}/defects/${defectId}`);
  },
  createDefect: (projectId: string, defectData: any) => {
    return api.post(`/projects/${projectId}/defects`, defectData);
  },
  updateDefect: (projectId: string, defectId: string, defectData: any) => {
    return api.patch(`/projects/${projectId}/defects/${defectId}`, defectData);
  },
  deleteDefect: (projectId: string, defectId: string) => {
    return api.delete(`/projects/${projectId}/defects/${defectId}`);
  },
  getDefectStats: (projectId: string) => {
    return api.get(`/projects/${projectId}/defects/stats`);
  }
};

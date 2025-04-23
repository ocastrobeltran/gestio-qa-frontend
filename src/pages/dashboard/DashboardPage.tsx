"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { projectService, reportService } from "../../services/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { ClipboardList, Users, CheckCircle, Clock, AlertCircle, Plus } from "lucide-react"
import type { Project, ProjectStatus } from "../../types/project"
import LoadingScreen from "../../components/ui/LoadingScreen"

// Status colors
const STATUS_COLORS = {
  "En análisis": "#3498db",
  "En validación": "#f39c12",
  "En pruebas": "#9b59b6",
  Aprobado: "#2ecc71",
  Cancelado: "#e74c3c",
}

const DashboardPage = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [statusData, setStatusData] = useState<any[]>([])
  const [analystData, setAnalystData] = useState<any[]>([])
  const [clientData, setClientData] = useState<any[]>([])
  const [recentProjects, setRecentProjects] = useState<Project[]>([])
  const [activeTab, setActiveTab] = useState("overview")

  const isAdmin = user?.role === "admin"
  const isAnalyst = user?.role === "analyst"

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)

        // Fetch projects
        const projectsResponse = await projectService.getProjects()
        setProjects(projectsResponse.data.data.projects)

        // Get recent projects
        const sortedProjects = [...projectsResponse.data.data.projects]
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
          .slice(0, 5)
        setRecentProjects(sortedProjects)

        // Fetch report data
        const statusResponse = await reportService.getProjectsByStatus()
        setStatusData(statusResponse.data.data.statusReport)

        if (isAdmin) {
          const analystResponse = await reportService.getProjectsByAnalyst()
          setAnalystData(analystResponse.data.data.analystReport)

          const clientResponse = await reportService.getProjectsByClient()
          setClientData(clientResponse.data.data.clientReport)
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [isAdmin])

  if (loading) {
    return <LoadingScreen fullScreen={false} />
  }

  // Calculate statistics
  const totalProjects = projects.length
  const projectsByStatus = projects.reduce(
    (acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1
      return acc
    },
    {} as Record<ProjectStatus, number>,
  )

  // Filter projects for analyst
  const myProjects = isAnalyst ? projects.filter((p) => p.qa_analyst_id === user?.id || p.created_by === user?.id) : []

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        {(isAdmin || isAnalyst) && (
          <Button asChild>
            <Link to="/projects/create">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Proyecto
            </Link>
          </Button>
        )}
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="charts">Gráficos</TabsTrigger>
          <TabsTrigger value="recent">Proyectos Recientes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Proyectos</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProjects}</div>
                <p className="text-xs text-muted-foreground">Proyectos en el sistema</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En Pruebas</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projectsByStatus["En pruebas"] || 0}</div>
                <p className="text-xs text-muted-foreground">Proyectos en fase de pruebas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aprobados</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projectsByStatus["Aprobado"] || 0}</div>
                <p className="text-xs text-muted-foreground">Proyectos aprobados</p>
              </CardContent>
            </Card>

            {isAnalyst ? (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Mis Proyectos</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{myProjects.length}</div>
                  <p className="text-xs text-muted-foreground">Proyectos asignados a ti</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(projectsByStatus["En análisis"] || 0) + (projectsByStatus["En validación"] || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Proyectos pendientes de completar</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Proyectos por Estado</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statusData}>
                    <XAxis dataKey="status" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="project_count" name="Proyectos" fill="#ff5252">
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status as ProjectStatus] || "#ff5252"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Distribución de Estados</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="project_count"
                      nameKey="status"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status as ProjectStatus] || "#ff5252"} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          {isAdmin && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Proyectos por Analista</CardTitle>
                  <CardDescription>Distribución de proyectos asignados a cada analista QA</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analystData}>
                      <XAxis dataKey="analyst" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Proyectos" fill="#ff5252" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Proyectos por Cliente</CardTitle>
                  <CardDescription>Distribución de proyectos por cliente</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={clientData}>
                      <XAxis dataKey="client" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Proyectos" fill="#3498db" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}

          {!isAdmin && (
            <div className="flex items-center justify-center h-40">
              <p className="text-muted-foreground">Gráficos adicionales disponibles para administradores</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Proyectos Recientes</CardTitle>
              <CardDescription>Los últimos proyectos actualizados en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              {recentProjects.length > 0 ? (
                <div className="space-y-4">
                  {recentProjects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div>
                        <Link to={`/projects/${project.id}`} className="font-medium hover:underline">
                          {project.title}
                        </Link>
                        <div className="text-sm text-muted-foreground">Cliente: {project.client}</div>
                        <div className="text-sm text-muted-foreground">
                          Actualizado: {new Date(project.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            project.status === "Aprobado"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              : project.status === "Cancelado"
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                : project.status === "En pruebas"
                                  ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                                  : project.status === "En validación"
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                    : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                          }`}
                        >
                          {project.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No hay proyectos recientes</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default DashboardPage

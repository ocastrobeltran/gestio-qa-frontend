import { useState, useEffect } from "react"
import { reportService, projectService } from "../../services/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Label } from "../../components/ui/label"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Download, Filter, Search, AlertCircle, TrendingUp, Clock, CheckCircle, AlertTriangle, Activity } from "lucide-react"
import LoadingScreen from "../../components/ui/LoadingScreen"
import { useToast } from "../../components/ui/use-toast"
import type { ProjectStatus, Project } from "../../types/project"
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert"

// Status colors
const STATUS_COLORS = {
  "En análisis": "#3498db",
  "En validación": "#f39c12",
  "En pruebas": "#9b59b6",
  Aprobado: "#2ecc71",
  Cancelado: "#e74c3c",
}

// Datos de ejemplo para usar cuando la API falla
const FALLBACK_DATA = {
  statusReport: [
    { status: "En análisis", project_count: 5 },
    { status: "En validación", project_count: 3 },
    { status: "En pruebas", project_count: 7 },
    { status: "Aprobado", project_count: 10 },
    { status: "Cancelado", project_count: 2 },
  ],
  analystReport: [
    { analyst: "Ana García", count: 8 },
    { analyst: "Carlos Pérez", count: 6 },
    { analyst: "María López", count: 5 },
    { analyst: "Sin asignar", count: 3 },
  ],
  clientReport: [
    { client: "Empresa A", count: 7 },
    { client: "Empresa B", count: 5 },
    { client: "Empresa C", count: 8 },
    { client: "Empresa D", count: 3 },
  ],
  detailedReport: [
    {
    id: 1,
    title: "Proyecto Demo 1",
    initiative: "Iniciativa X",
    client: "Empresa A",
    status: "En análisis",
    qa_analyst: { full_name: "Ana García" },
    created_at: new Date().toISOString(),
    priority: "Alta"
    },
    {
    id: 2,
    title: "Proyecto Demo 2",
    initiative: "Iniciativa Y",
    client: "Empresa B",
    status: "Aprobado",
    qa_analyst: { full_name: "Carlos Pérez" },
    created_at: new Date().toISOString(),
    priority: "Media"
    },
  ],
  qualityMetrics: [
    { metric: "Defectos encontrados", value: 87 },
    { metric: "Defectos corregidos", value: 72 },
    { metric: "Tasa de corrección", value: "82.8%" },
    { metric: "Tiempo promedio de ciclo", value: "4.2 días" },
  ]
}

// Tipos para los KPIs
interface KPI {
  title: string
  value: string | number
  description: string
  icon: React.ReactNode
  trend?: "up" | "down" | "neutral"
  color: string
}

const ReportsPage = () => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusData, setStatusData] = useState<any[]>([])
  const [analystData, setAnalystData] = useState<any[]>([])
  const [clientData, setClientData] = useState<any[]>([])
  const [detailedData, setDetailedData] = useState<any[]>([])
  const [qualityMetrics, setQualityMetrics] = useState<any[]>([])
  const [kpis, setKpis] = useState<KPI[]>([])
  const [activeTab, setActiveTab] = useState("dashboard")
  const [filters, setFilters] = useState({
    status: "all",
    client: "all",
    analyst: "all",
    startDate: "",
    endDate: "",
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredDetailedData, setFilteredDetailedData] = useState<any[]>([])
  const [_, setProjects] = useState<Project[]>([])

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch projects data from the API
        try {
          const projectsResponse = await projectService.getProjects()
          console.log("Projects API response:", projectsResponse.data)
          
          if (projectsResponse.data?.status === "success" && projectsResponse.data?.data?.projects) {
            const projectsData = projectsResponse.data.data.projects
            setProjects(projectsData)
            
            // Use projects data to generate reports
            generateReportsFromProjects(projectsData)
          } else {
            console.warn("Invalid projects data structure, using fallback data")
            setStatusData(FALLBACK_DATA.statusReport)
            setAnalystData(FALLBACK_DATA.analystReport)
            setClientData(FALLBACK_DATA.clientReport)
            setDetailedData(FALLBACK_DATA.detailedReport)
            setFilteredDetailedData(FALLBACK_DATA.detailedReport)
          }
        } catch (err) {
          console.error("Error fetching projects:", err)
          
          // Fetch status report
          try {
            const statusResponse = await reportService.getProjectsByStatus()
            console.log("Status API response:", statusResponse.data)
            
            if (statusResponse.data?.status === "success" && statusResponse.data?.data?.statusReport) {
              // Mapea la respuesta de la API al formato esperado por los componentes
              const mappedStatusData = statusResponse.data.data.statusReport.map((item: any) => ({
                status: item.status,
                project_count: parseInt(item.count) // Cambia count a project_count para que coincida con el componente
              }))
              console.log("Mapped status data:", mappedStatusData)
              setStatusData(mappedStatusData)
            } else {
              console.warn("Invalid status report structure, using fallback data")
              setStatusData(FALLBACK_DATA.statusReport)
            }
          } catch (err) {
            console.error("Error fetching status report:", err)
            setStatusData(FALLBACK_DATA.statusReport)
          }
          
          // Fetch analyst report
          try {
            const analystResponse = await reportService.getProjectsByAnalyst()
            console.log("Analyst API response:", analystResponse.data)
            
            if (analystResponse.data?.status === "success" && analystResponse.data?.data?.analystReport) {
              // Map the API response to the expected format
              const mappedAnalystData = analystResponse.data.data.analystReport.map((item: any) => ({
                analyst: item.qaAnalyst ? item.qaAnalyst.full_name : "Sin asignar",
                count: parseInt(item.count)
              }))
              setAnalystData(mappedAnalystData)
            } else {
              console.warn("Invalid analyst report structure, using fallback data")
              setAnalystData(FALLBACK_DATA.analystReport)
            }
          } catch (err) {
            console.error("Error fetching analyst report:", err)
            setAnalystData(FALLBACK_DATA.analystReport)
          }
          
          // Fetch client report
          try {
            const clientResponse = await reportService.getProjectsByClient()
            console.log("Client API response:", clientResponse.data)
            
            if (clientResponse.data?.status === "success" && clientResponse.data?.data?.clientReport) {
              // Map the API response to the expected format
              const mappedClientData = clientResponse.data.data.clientReport.map((item: any) => ({
                client: item.client,
                count: parseInt(item.count)
              }))
              setClientData(mappedClientData)
            } else {
              console.warn("Invalid client report structure, using fallback data")
              setClientData(FALLBACK_DATA.clientReport)
            }
          } catch (err) {
            console.error("Error fetching client report:", err)
            setClientData(FALLBACK_DATA.clientReport)
          }

          // En ReportsPage.tsx, modificar la función fetchReportData para incluir:

          // Fetch quality metrics
          try {
            const qualityResponse = await reportService.getQualityMetrics();
            console.log("Quality metrics API response:", qualityResponse.data);
            
            if (qualityResponse.data?.status === "success" && qualityResponse.data?.data?.qualityMetrics) {
              const metrics = qualityResponse.data.data.qualityMetrics;
              
              // Convertir a formato para la tabla
              const qualityMetricsData = [
                { metric: "Defectos encontrados", value: metrics.totalDefects },
                { metric: "Defectos corregidos", value: metrics.fixedDefects },
                { metric: "Tasa de corrección", value: `${metrics.correctionRate}%` },
                { metric: "Tiempo promedio de ciclo", value: `${metrics.avgCycleTime} días` }
              ];
              
              setQualityMetrics(qualityMetricsData);
            } else {
              console.warn("Invalid quality metrics structure, using fallback data");
              setQualityMetrics([
                { metric: "Defectos encontrados", value: 87 },
                { metric: "Defectos corregidos", value: 72 },
                { metric: "Tasa de corrección", value: "82.8%" },
                { metric: "Tiempo promedio de ciclo", value: "14.3 días" }
              ]);
            }
          } catch (err) {
            console.error("Error fetching quality metrics:", err);
            setQualityMetrics([
              { metric: "Defectos encontrados", value: 87 },
              { metric: "Defectos corregidos", value: 72 },
              { metric: "Tasa de corrección", value: "82.8%" },
              { metric: "Tiempo promedio de ciclo", value: "14.3 días" }
            ]);
          }
          
          // Fetch detailed report
          try {
            const detailedResponse = await reportService.getDetailedReport()
            console.log("Detailed API response:", detailedResponse.data)
            
            if (detailedResponse.data?.status === "success" && detailedResponse.data?.data?.report) {
              const projects = detailedResponse.data.data.report
              
              // Mapea la respuesta para que coincida con la estructura esperada
              const mappedProjects = projects.map((project: any) => ({
                id: project.id,
                title: project.title,
                client: project.client,
                status: project.status,
                qa_analyst: { full_name: project.qa_analyst },
                created_at: project.created_at,
                priority: project.priority || "Media"
              }))
              
              console.log("Mapped detailed data:", mappedProjects)
              setDetailedData(mappedProjects)
              setFilteredDetailedData(mappedProjects)
              
              // Usar datos reales para calcular KPIs
              calculateKPIs(mappedProjects)
            } else {
              console.warn("Invalid detailed report structure, using fallback data")
              setDetailedData(FALLBACK_DATA.detailedReport)
              setFilteredDetailedData(FALLBACK_DATA.detailedReport)
              
              // Usar datos de ejemplo para calcular KPIs
              calculateKPIs(FALLBACK_DATA.detailedReport)
            }
          } catch (err) {
            console.error("Error fetching detailed report:", err)
            setDetailedData(FALLBACK_DATA.detailedReport)
            setFilteredDetailedData(FALLBACK_DATA.detailedReport)
            
            // Usar datos de ejemplo para calcular KPIs
            calculateKPIs(FALLBACK_DATA.detailedReport)
          }
        }
        
        // Establecer métricas de calidad (por ahora usando datos de ejemplo)
        setQualityMetrics(FALLBACK_DATA.qualityMetrics)
        
      } catch (error: any) {
        console.error("Error fetching report data:", error)
        setError("No se pudieron cargar los datos de los reportes. Usando datos de ejemplo.")
        
        // Usar datos de ejemplo en caso de error
        setStatusData(FALLBACK_DATA.statusReport)
        setAnalystData(FALLBACK_DATA.analystReport)
        setClientData(FALLBACK_DATA.clientReport)
        setDetailedData(FALLBACK_DATA.detailedReport)
        setFilteredDetailedData(FALLBACK_DATA.detailedReport)
        setQualityMetrics(FALLBACK_DATA.qualityMetrics)
        
        // Calcular KPIs con datos de ejemplo
        calculateKPIs(FALLBACK_DATA.detailedReport)
        
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los datos de los reportes. Usando datos de ejemplo.",
        })
      } finally {
        setLoading(false)
      }
    }
  
    fetchReportData()
  }, [toast])

  // Función para generar reportes a partir de los datos de proyectos
  const generateReportsFromProjects = (projects: Project[]) => {
    // Generar reporte por estado
    const statusCounts: Record<string, number> = {}
    projects.forEach(project => {
      statusCounts[project.status] = (statusCounts[project.status] || 0) + 1
    })
    
    const statusReport = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      project_count: count
    }))
    setStatusData(statusReport)
    
    // Generar reporte por analista
    const analystCounts: Record<string, number> = {}
    projects.forEach(project => {
      const analystName = project.qaAnalyst ? project.qaAnalyst.full_name : "Sin asignar"
      analystCounts[analystName] = (analystCounts[analystName] || 0) + 1
    })
    
    const analystReport = Object.entries(analystCounts).map(([analyst, count]) => ({
      analyst,
      count
    }))
    setAnalystData(analystReport)
    
    // Generar reporte por cliente
    const clientCounts: Record<string, number> = {}
    projects.forEach(project => {
      clientCounts[project.client] = (clientCounts[project.client] || 0) + 1
    })
    
    const clientReport = Object.entries(clientCounts).map(([client, count]) => ({
      client,
      count
    }))
    setClientData(clientReport)
    
    // Generar reporte detallado
    const detailedReport = projects.map(project => ({
      id: project.id,
      title: project.title,
      initiative: project.initiative,
      client: project.client,
      status: project.status,
      qa_analyst: project.qaAnalyst,
      created_at: project.created_at,
      priority: project.priority
    }))
    
    setDetailedData(detailedReport)
    setFilteredDetailedData(detailedReport)
    
    // Calcular KPIs
    calculateKPIs(detailedReport)
  }

  // Función para calcular KPIs basados en los datos
  const calculateKPIs = (allProjects: any[]) => {
    // Total de proyectos
    const totalProjects = allProjects.length
    
    // Proyectos activos (no aprobados ni cancelados)
    const activeProjects = allProjects.filter(
      p => p.status !== "Aprobado" && p.status !== "Cancelado"
    ).length
    
    // Tasa de aprobación
    const approvedProjects = allProjects.filter(p => p.status === "Aprobado").length
    const approvalRate = totalProjects > 0 ? (approvedProjects / totalProjects) * 100 : 0
    
    // Proyectos de alta prioridad
    const highPriorityProjects = allProjects.filter(p => p.priority === "Alta").length
    
    // Tiempo promedio de ciclo (simulado)
    const avgCycleTime = 14.3 // días
    
    // Definir los KPIs
    const calculatedKpis: KPI[] = [
      {
        title: "Proyectos Totales",
        value: totalProjects,
        description: "Número total de proyectos en el sistema",
        icon: <Activity className="h-5 w-5" />,
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      },
      {
        title: "Proyectos Activos",
        value: activeProjects,
        description: "Proyectos en proceso actualmente",
        icon: <TrendingUp className="h-5 w-5" />,
        trend: "up",
        color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      },
      {
        title: "Tasa de Aprobación",
        value: `${approvalRate.toFixed(1)}%`,
        description: "Porcentaje de proyectos aprobados",
        icon: <CheckCircle className="h-5 w-5" />,
        trend: approvalRate > 75 ? "up" : "down",
        color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      },
      {
        title: "Tiempo Promedio de Ciclo",
        value: `${avgCycleTime} días`,
        description: "Tiempo promedio desde inicio hasta aprobación",
        icon: <Clock className="h-5 w-5" />,
        color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      },
      {
        title: "Proyectos Alta Prioridad",
        value: highPriorityProjects,
        description: "Número de proyectos con prioridad alta",
        icon: <AlertTriangle className="h-5 w-5" />,
        trend: highPriorityProjects > 3 ? "up" : "neutral",
        color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      }
    ]
    
    setKpis(calculatedKpis)
  }

  useEffect(() => {
    // Apply filters and search to detailed data
    if (!detailedData || !Array.isArray(detailedData)) {
      setFilteredDetailedData([])
      return
    }

    let result = [...detailedData]

    if (filters.status && filters.status !== "all") {
      result = result.filter((project) => project.status === filters.status)
    }

    if (filters.client && filters.client !== "all") {
      result = result.filter((project) => project.client === filters.client)
    }

    if (filters.analyst && filters.analyst !== "all") {
      result = result.filter(
        (project) =>
          project.qa_analyst?.full_name === filters.analyst ||
          (!project.qa_analyst && filters.analyst === "Sin asignar"),
      )
    }

    if (filters.startDate) {
      const startDate = new Date(filters.startDate)
      result = result.filter((project) => new Date(project.created_at) >= startDate)
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate)
      endDate.setHours(23, 59, 59, 999) // End of day
      result = result.filter((project) => new Date(project.created_at) <= endDate)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (project) =>
          project.title?.toLowerCase().includes(term) ||
          project.initiative?.toLowerCase().includes(term) ||
          project.client?.toLowerCase().includes(term),
      )
    }

    setFilteredDetailedData(result)
  }, [filters, searchTerm, detailedData])

  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const resetFilters = () => {
    setFilters({
      status: "all",
      client: "all",
      analyst: "all",
      startDate: "",
      endDate: "",
    })
    setSearchTerm("")
  }

  const exportToCSV = () => {
    if (!filteredDetailedData || filteredDetailedData.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No hay datos para exportar",
      })
      return
    }

    // Exportar datos a CSV
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,"
    csvContent += "ID,Título,Iniciativa,Cliente,Estado,Analista QA,Prioridad,Fecha Creación\n"

    filteredDetailedData.forEach((project) => {
      const row = [
        project.id,
        `"${(project.title || "").replace(/"/g, '""')}"`,
        `"${(project.initiative || "").replace(/"/g, '""')}"`,
        `"${(project.client || "").replace(/"/g, '""')}"`,
        project.status || "",
        project.qa_analyst ? `"${(project.qa_analyst.full_name || "").replace(/"/g, '""')}"` : "Sin asignar",
        project.priority || "Media",
        project.created_at ? new Date(project.created_at).toLocaleDateString() : "",
      ]
      csvContent += row.join(",") + "\n"
    })

    // Create download link
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `reporte-proyectos-${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Reporte exportado",
      description: "El reporte ha sido exportado exitosamente.",
    })
  }

  if (loading) {
    return <LoadingScreen fullScreen={false} />
  }

  // Get unique clients and analysts for filter options
  const clients = Array.isArray(detailedData)
    ? Array.from(new Set(detailedData.map((project) => project.client).filter(Boolean)))
    : []

  const analysts = Array.isArray(detailedData)
    ? Array.from(
        new Set(
          detailedData
            .map((project) => (project.qa_analyst ? project.qa_analyst.full_name : "Sin asignar"))
            .filter(Boolean),
        ),
      )
    : []

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
      </div>

      {error && (
        <Alert className="bg-destructive/15 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="status">Por Estado</TabsTrigger>
          <TabsTrigger value="analyst">Por Analista</TabsTrigger>
          <TabsTrigger value="client">Por Cliente</TabsTrigger>
          <TabsTrigger value="detailed">Detallado</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab - KPIs y Métricas */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {kpis.map((kpi, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                  <div className={`rounded-full p-2 ${kpi.color}`}>
                    {kpi.icon}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                  <p className="text-xs text-muted-foreground">{kpi.description}</p>
                  {kpi.trend && (
                    <div className="mt-2 flex items-center text-xs">
                      {kpi.trend === "up" ? (
                        <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                      ) : kpi.trend === "down" ? (
                        <TrendingUp className="mr-1 h-3 w-3 text-red-500 rotate-180" />
                      ) : null}
                      <span className={kpi.trend === "up" ? "text-green-500" : kpi.trend === "down" ? "text-red-500" : ""}>
                        {kpi.trend === "up" ? "Incremento" : kpi.trend === "down" ? "Decremento" : "Estable"}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Métricas de calidad */}
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Calidad</CardTitle>
                <CardDescription>Indicadores de calidad del proceso QA</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Métrica</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {qualityMetrics.map((metric, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{metric.metric}</TableCell>
                        <TableCell className="text-right">{metric.value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Distribución por estado */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Estado</CardTitle>
                <CardDescription>Proyectos agrupados por estado actual</CardDescription>
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
                        <Cell
                          key={`cell-${index}`}
                          fill={STATUS_COLORS[entry.status as ProjectStatus] || "#ff5252"}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Distribución por prioridad */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Prioridad</CardTitle>
                <CardDescription>Proyectos agrupados por nivel de prioridad</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { priority: "Alta", value: detailedData.filter(p => p.priority === "Alta").length },
                        { priority: "Media", value: detailedData.filter(p => p.priority === "Media").length },
                        { priority: "Baja", value: detailedData.filter(p => p.priority === "Baja").length }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="priority"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      <Cell fill="#e74c3c" /> {/* Alta - Rojo */}
                      <Cell fill="#f39c12" /> {/* Media - Naranja */}
                      <Cell fill="#3498db" /> {/* Baja - Azul */}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución por Cliente</CardTitle>
                <CardDescription>Proyectos por cliente</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={clientData.slice(0, 5)} layout="vertical" margin={{ left: 100 }}>
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="client" width={100} />
                    <Tooltip />
                    <Bar dataKey="count" name="Proyectos" fill="#3498db" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Proyectos por Estado</CardTitle>
              <CardDescription>Distribución de proyectos según su estado actual</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {statusData && statusData.length > 0 ? (
                <>
                  <div>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={statusData}>
                        <XAxis dataKey="status" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="project_count" name="Proyectos" fill="#ff5252">
                          {statusData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={STATUS_COLORS[entry.status as ProjectStatus] || "#ff5252"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
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
                            <Cell
                              key={`cell-${index}`}
                              fill={STATUS_COLORS[entry.status as ProjectStatus] || "#ff5252"}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </>
              ) : (
                <div className="col-span-2 flex justify-center items-center h-64">
                  <p className="text-muted-foreground">No hay datos disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tabla de Proyectos por Estado</CardTitle>
            </CardHeader>
            <CardContent>
              {statusData && statusData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Porcentaje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statusData.map((item) => {
                      const total = statusData.reduce((sum, current) => sum + parseInt(current.project_count), 0)
                      const percentage = ((parseInt(item.project_count) / total) * 100).toFixed(1)

                      return (
                        <TableRow key={item.status}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <div
                                className="w-3 h-3 rounded-full mr-2"
                                style={{ backgroundColor: STATUS_COLORS[item.status as ProjectStatus] || "#ff5252" }}
                              ></div>
                              {item.status}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{item.project_count}</TableCell>
                          <TableCell className="text-right">{percentage}%</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex justify-center items-center h-32">
                  <p className="text-muted-foreground">No hay datos disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analyst" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Proyectos por Analista</CardTitle>
              <CardDescription>Distribución de proyectos asignados a cada analista QA</CardDescription>
            </CardHeader>
            <CardContent>
              {analystData && analystData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analystData} layout="vertical" margin={{ left: 120 }}>
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="analyst" width={120} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Proyectos" fill="#ff5252" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-64">
                  <p className="text-muted-foreground">No hay datos disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tabla de Proyectos por Analista</CardTitle>
            </CardHeader>
            <CardContent>
              {analystData && analystData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Analista</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Porcentaje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analystData.map((item) => {
                      const total = analystData.reduce((sum, current) => sum + parseInt(current.count), 0)
                      const percentage = ((parseInt(item.count) / total) * 100).toFixed(1)

                      return (
                        <TableRow key={item.analyst}>
                          <TableCell className="font-medium">{item.analyst}</TableCell>
                          <TableCell className="text-right">{item.count}</TableCell>
                          <TableCell className="text-right">{percentage}%</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex justify-center items-center h-32">
                  <p className="text-muted-foreground">No hay datos disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="client" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Proyectos por Cliente</CardTitle>
              <CardDescription>Distribución de proyectos por cliente</CardDescription>
            </CardHeader>
            <CardContent>
              {clientData && clientData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={clientData} layout="vertical" margin={{ left: 120 }}>
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="client" width={120} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Proyectos" fill="#3498db" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-64">
                  <p className="text-muted-foreground">No hay datos disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tabla de Proyectos por Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              {clientData && clientData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Porcentaje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientData.map((item) => {
                      const total = clientData.reduce((sum, current) => sum + parseInt(current.count), 0)
                      const percentage = ((parseInt(item.count) / total) * 100).toFixed(1)

                      return (
                        <TableRow key={item.client}>
                          <TableCell className="font-medium">{item.client}</TableCell>
                          <TableCell className="text-right">{item.count}</TableCell>
                          <TableCell className="text-right">{percentage}%</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex justify-center items-center h-32">
                  <p className="text-muted-foreground">No hay datos disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reporte Detallado</CardTitle>
              <CardDescription>Listado completo de proyectos con filtros avanzados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar por título, cliente o iniciativa..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={exportToCSV}
                  disabled={!filteredDetailedData || filteredDetailedData.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar CSV
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status-filter">Estado</Label>
                  <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                    <SelectTrigger id="status-filter">
                      <SelectValue placeholder="Todos los estados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="En análisis">En análisis</SelectItem>
                      <SelectItem value="En validación">En validación</SelectItem>
                      <SelectItem value="En pruebas">En pruebas</SelectItem>
                      <SelectItem value="Aprobado">Aprobado</SelectItem>
                      <SelectItem value="Cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client-filter">Cliente</Label>
                  <Select value={filters.client} onValueChange={(value) => handleFilterChange("client", value)}>
                    <SelectTrigger id="client-filter">
                      <SelectValue placeholder="Todos los clientes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los clientes</SelectItem>
                      {clients &&
                        clients.length > 0 &&
                        clients.map((client) => (
                          <SelectItem key={client} value={client}>
                            {client}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="analyst-filter">Analista</Label>
                  <Select value={filters.analyst} onValueChange={(value) => handleFilterChange("analyst", value)}>
                    <SelectTrigger id="analyst-filter">
                      <SelectValue placeholder="Todos los analistas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los analistas</SelectItem>
                      {analysts &&
                        analysts.length > 0 &&
                        analysts.map((analyst) => (
                          <SelectItem key={analyst} value={analyst}>
                            {analyst}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start-date">Fecha Inicio</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange("startDate", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-date">Fecha Fin</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange("endDate", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={resetFilters}>
                  <Filter className="mr-2 h-4 w-4" />
                  Limpiar Filtros
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Prioridad</TableHead>
                      <TableHead>Analista QA</TableHead>
                      <TableHead>Fecha Creación</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDetailedData && filteredDetailedData.length > 0 ? (
                      filteredDetailedData.map((project) => (
                        <TableRow key={project.id}>
                          <TableCell>{project.id}</TableCell>
                          <TableCell className="font-medium">{project.title}</TableCell>
                          <TableCell>{project.client}</TableCell>
                          <TableCell>
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
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                project.priority === "Alta"
                                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                  : project.priority === "Media"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                  : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                              }`}
                            >
                              {project.priority || "Media"}
                            </span>
                          </TableCell>
                          <TableCell>{project.qa_analyst?.full_name || "Sin asignar"}</TableCell>
                          <TableCell>
                            {project.created_at ? new Date(project.created_at).toLocaleDateString() : ""}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          No se encontraron proyectos con los filtros aplicados
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ReportsPage
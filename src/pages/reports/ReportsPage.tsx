"use client"

import { useState, useEffect } from "react"
import { reportService } from "../../services/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Label } from "../../components/ui/label"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Download, Filter, Search, AlertCircle } from "lucide-react"
import LoadingScreen from "../../components/ui/LoadingScreen"
import { useToast } from "../../components/ui/use-toast"
import type { ProjectStatus } from "../../types/project"
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
    },
    {
      id: 2,
      title: "Proyecto Demo 2",
      initiative: "Iniciativa Y",
      client: "Empresa B",
      status: "Aprobado",
      qa_analyst: { full_name: "Carlos Pérez" },
      created_at: new Date().toISOString(),
    },
  ],
}

const ReportsPage = () => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusData, setStatusData] = useState<any[]>([])
  const [analystData, setAnalystData] = useState<any[]>([])
  const [clientData, setClientData] = useState<any[]>([])
  const [detailedData, setDetailedData] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("status")
  const [filters, setFilters] = useState({
    status: "",
    client: "",
    analyst: "",
    startDate: "",
    endDate: "",
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredDetailedData, setFilteredDetailedData] = useState<any[]>([])

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch status report
        let statusResponse, analystResponse, clientResponse, detailedResponse

        try {
          statusResponse = await reportService.getProjectsByStatus()
          setStatusData(statusResponse.data?.data?.statusReport || [])
        } catch (err) {
          console.error("Error fetching status report:", err)
          setStatusData(FALLBACK_DATA.statusReport)
        }

        // Fetch analyst report
        try {
          analystResponse = await reportService.getProjectsByAnalyst()
          setAnalystData(analystResponse.data?.data?.analystReport || [])
        } catch (err) {
          console.error("Error fetching analyst report:", err)
          setAnalystData(FALLBACK_DATA.analystReport)
        }

        // Fetch client report
        try {
          clientResponse = await reportService.getProjectsByClient()
          setClientData(clientResponse.data?.data?.clientReport || [])
        } catch (err) {
          console.error("Error fetching client report:", err)
          setClientData(FALLBACK_DATA.clientReport)
        }

        // Fetch detailed report
        try {
          detailedResponse = await reportService.getDetailedReport()
          const projects = detailedResponse.data?.data?.projects || []
          setDetailedData(projects)
          setFilteredDetailedData(projects)
        } catch (err) {
          console.error("Error fetching detailed report:", err)
          setDetailedData(FALLBACK_DATA.detailedReport)
          setFilteredDetailedData(FALLBACK_DATA.detailedReport)
        }
      } catch (error: any) {
        console.error("Error fetching report data:", error)
        setError("No se pudieron cargar los datos de los reportes. Usando datos de ejemplo.")

        // Usar datos de ejemplo en caso de error
        setStatusData(FALLBACK_DATA.statusReport)
        setAnalystData(FALLBACK_DATA.analystReport)
        setClientData(FALLBACK_DATA.clientReport)
        setDetailedData(FALLBACK_DATA.detailedReport)
        setFilteredDetailedData(FALLBACK_DATA.detailedReport)

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

  useEffect(() => {
    // Apply filters and search to detailed data
    if (!detailedData || !Array.isArray(detailedData)) {
      setFilteredDetailedData([])
      return
    }

    let result = [...detailedData]

    if (filters.status) {
      result = result.filter((project) => project.status === filters.status)
    }

    if (filters.client) {
      result = result.filter((project) => project.client === filters.client)
    }

    if (filters.analyst) {
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
      status: "",
      client: "",
      analyst: "",
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
    csvContent += "ID,Título,Iniciativa,Cliente,Estado,Analista QA,Fecha Creación\n"

    filteredDetailedData.forEach((project) => {
      const row = [
        project.id,
        `"${(project.title || "").replace(/"/g, '""')}"`,
        `"${(project.initiative || "").replace(/"/g, '""')}"`,
        `"${(project.client || "").replace(/"/g, '""')}"`,
        project.status || "",
        project.qa_analyst ? `"${project.qa_analyst.full_name.replace(/"/g, '""')}"` : "Sin asignar",
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
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="status" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="status">Por Estado</TabsTrigger>
          <TabsTrigger value="analyst">Por Analista</TabsTrigger>
          <TabsTrigger value="client">Por Cliente</TabsTrigger>
          <TabsTrigger value="detailed">Detallado</TabsTrigger>
        </TabsList>

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
                      const total = statusData.reduce((sum, current) => sum + current.project_count, 0)
                      const percentage = ((item.project_count / total) * 100).toFixed(1)

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
                      const total = analystData.reduce((sum, current) => sum + current.count, 0)
                      const percentage = ((item.count / total) * 100).toFixed(1)

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
                      const total = clientData.reduce((sum, current) => sum + current.count, 0)
                      const percentage = ((item.count / total) * 100).toFixed(1)

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
                          <TableCell>{project.qa_analyst?.full_name || "Sin asignar"}</TableCell>
                          <TableCell>
                            {project.created_at ? new Date(project.created_at).toLocaleDateString() : ""}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
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

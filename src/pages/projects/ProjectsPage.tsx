"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { projectService } from "../../services/api"
import type { Project } from "../../types/project"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Plus, Search, Filter } from "lucide-react"
import LoadingScreen from "../../components/ui/LoadingScreen"

const ProjectsPage = () => {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("")

  const isAdmin = user?.role === "admin"
  const isAnalyst = user?.role === "analyst"
  const canCreateProject = isAdmin || isAnalyst

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true)
        const response = await projectService.getProjects()
        setProjects(response.data.data.projects)
        setFilteredProjects(response.data.data.projects)
      } catch (error) {
        console.error("Error fetching projects:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  useEffect(() => {
    // Apply filters
    let result = [...projects]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (project) =>
          project.title.toLowerCase().includes(term) ||
          project.client.toLowerCase().includes(term) ||
          project.initiative.toLowerCase().includes(term),
      )
    }

    if (statusFilter) {
      result = result.filter((project) => project.status === statusFilter)
    }

    setFilteredProjects(result)
  }, [searchTerm, statusFilter, projects])

  if (loading) {
    return <LoadingScreen fullScreen={false} />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Proyectos</h1>
        {canCreateProject && (
          <Button asChild>
            <Link to="/projects/create">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Proyecto
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Proyectos</CardTitle>
          <CardDescription>Gestiona todos los proyectos de QA en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
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
            <div className="w-full md:w-[200px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filtrar por estado" />
                  </div>
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
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Iniciativa</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Analista QA</TableHead>
                  <TableHead>Fecha Creación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">
                        <Link to={`/projects/${project.id}`} className="hover:underline text-primary">
                          {project.title}
                        </Link>
                      </TableCell>
                      <TableCell>{project.client}</TableCell>
                      <TableCell>{project.initiative}</TableCell>
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
                      <TableCell>{project.qaAnalyst?.full_name || "Sin asignar"}</TableCell>
                      <TableCell>{new Date(project.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/projects/${project.id}`}>Ver detalles</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No se encontraron proyectos
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProjectsPage

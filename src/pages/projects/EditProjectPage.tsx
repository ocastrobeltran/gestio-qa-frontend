"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { projectService, userService } from "../../services/api"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog"
import { useToast } from "../../components/ui/use-toast"
import { ArrowLeft, Plus, Trash } from "lucide-react"
import type { Project } from "../../types/project"
import type { User } from "../../types/user"
import LoadingScreen from "../../components/ui/LoadingScreen"

const EditProjectPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [project, setProject] = useState<Project | null>(null)
  const [analysts, setAnalysts] = useState<User[]>([])
  const [formData, setFormData] = useState({
    title: "",
    initiative: "",
    client: "",
    pm: "",
    lead_dev: "",
    designer: "",
    design_url: "",
    test_url: "",
    qa_analyst_id: "",
    status: "",
    developers: [{ id: 0, project_id: 0, developer_name: "" }],
    assets: [{ id: 0, project_id: 0, asset_url: "" }],
  })

  const isAdmin = user?.role === "admin"
  const isAnalyst = user?.role === "analyst"

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch project data
        const projectResponse = await projectService.getProject(id!)
        const projectData = projectResponse.data.data.project

        // Fetch analysts
        const analystsResponse = await userService.getUsers()
        const analystUsers = analystsResponse.data.data.users.filter((u: User) => u.role === "analyst")

        setProject(projectData)
        setAnalysts(analystUsers)

        // Initialize form data
        setFormData({
          title: projectData.title,
          initiative: projectData.initiative,
          client: projectData.client,
          pm: projectData.pm,
          lead_dev: projectData.lead_dev,
          designer: projectData.designer || "",
          design_url: projectData.design_url || "",
          test_url: projectData.test_url || "",
          qa_analyst_id: projectData.qa_analyst_id ? projectData.qa_analyst_id.toString() : "",
          status: projectData.status,
          developers: projectData.developers?.length
            ? projectData.developers
            : [{ id: 0, project_id: Number.parseInt(id!), developer_name: "" }],
          assets: projectData.assets?.length
            ? projectData.assets
            : [{ id: 0, project_id: Number.parseInt(id!), asset_url: "" }],
        })
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo cargar la información del proyecto.",
        })
        navigate("/projects")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, navigate, toast])

  // Check if user has permission to edit
  useEffect(() => {
    if (!loading && project && user) {
      const canEdit = isAdmin || (isAnalyst && project.qa_analyst_id === user.id)
      if (!canEdit) {
        toast({
          variant: "destructive",
          title: "Acceso denegado",
          description: "No tienes permisos para editar este proyecto.",
        })
        navigate(`/projects/${id}`)
      }
    }
  }, [loading, project, user, isAdmin, isAnalyst, id, navigate, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDeveloperChange = (index: number, value: string) => {
    const updatedDevelopers = [...formData.developers]
    updatedDevelopers[index].developer_name = value
    setFormData((prev) => ({ ...prev, developers: updatedDevelopers }))
  }

  const handleAssetChange = (index: number, value: string) => {
    const updatedAssets = [...formData.assets]
    updatedAssets[index].asset_url = value
    setFormData((prev) => ({ ...prev, assets: updatedAssets }))
  }

  const addDeveloper = () => {
    setFormData((prev) => ({
      ...prev,
      developers: [...prev.developers, { id: 0, project_id: Number.parseInt(id!), developer_name: "" }],
    }))
  }

  const removeDeveloper = (index: number) => {
    if (formData.developers.length === 1) return
    const updatedDevelopers = [...formData.developers]
    updatedDevelopers.splice(index, 1)
    setFormData((prev) => ({ ...prev, developers: updatedDevelopers }))
  }

  const addAsset = () => {
    setFormData((prev) => ({
      ...prev,
      assets: [...prev.assets, { id: 0, project_id: Number.parseInt(id!), asset_url: "" }],
    }))
  }

  const removeAsset = (index: number) => {
    if (formData.assets.length === 1) return
    const updatedAssets = [...formData.assets]
    updatedAssets.splice(index, 1)
    setFormData((prev) => ({ ...prev, assets: updatedAssets }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    if (!formData.title || !formData.initiative || !formData.client || !formData.pm || !formData.lead_dev) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor completa todos los campos requeridos.",
      })
      return
    }

    // Filter out empty developers and assets and convert to the expected format
    const filteredDevelopers = formData.developers
      .filter((dev) => dev.developer_name.trim() !== "")
      .map(dev => dev.developer_name); // Extraer solo los nombres como strings

    const filteredAssets = formData.assets
      .filter((asset) => asset.asset_url.trim() !== "")
      .map(asset => asset.asset_url); // Extraer solo las URLs como strings

    try {
      setSubmitting(true)

      // Prepare data for API
      const projectData = {
        title: formData.title,
        initiative: formData.initiative,
        client: formData.client,
        pm: formData.pm,
        lead_dev: formData.lead_dev,
        designer: formData.designer,
        design_url: formData.design_url,
        test_url: formData.test_url,
        qa_analyst_id: formData.qa_analyst_id || null,
        status: formData.status,
        developers: filteredDevelopers, // Ahora es un array de strings
        assets: filteredAssets, // Ahora es un array de strings
      }

      console.log("Enviando datos para actualizar:", projectData); // Para depuración

      await projectService.updateProject(id!, projectData)

      toast({
        title: "Proyecto actualizado",
        description: "El proyecto ha sido actualizado exitosamente.",
      })

      navigate(`/projects/${id}`)
    } catch (error) {
      console.error("Error updating project:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el proyecto. Inténtalo de nuevo.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    try {
      setSubmitting(true)
      await projectService.deleteProject(id!)

      toast({
        title: "Proyecto eliminado",
        description: "El proyecto ha sido eliminado exitosamente.",
      })

      navigate("/projects")
    } catch (error) {
      console.error("Error deleting project:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el proyecto. Inténtalo de nuevo.",
      })
      setSubmitting(false)
    }
  }

  if (loading) {
    return <LoadingScreen fullScreen={false} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" asChild className="mr-2">
            <Link to={`/projects/${id}`}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Editar Proyecto</h1>
        </div>
        {isAdmin && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash className="h-4 w-4 mr-2" />
                Eliminar Proyecto
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminará permanentemente el proyecto y todos sus datos
                  asociados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  <Trash className="h-4 w-4 mr-2" />
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
              <CardDescription>Actualiza la información básica del proyecto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Título del Proyecto *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Ej: Rediseño Portal Web"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="initiative">Iniciativa *</Label>
                  <Input
                    id="initiative"
                    name="initiative"
                    value={formData.initiative}
                    onChange={handleChange}
                    placeholder="Ej: Mejora Experiencia Usuario"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client">Cliente *</Label>
                  <Input
                    id="client"
                    name="client"
                    value={formData.client}
                    onChange={handleChange}
                    placeholder="Ej: Empresa ABC"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="En análisis">En análisis</SelectItem>
                      <SelectItem value="En validación">En validación</SelectItem>
                      <SelectItem value="En pruebas">En pruebas</SelectItem>
                      <SelectItem value="Aprobado">Aprobado</SelectItem>
                      <SelectItem value="Cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Equipo del Proyecto</CardTitle>
              <CardDescription>Información sobre el equipo asignado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pm">Project Manager *</Label>
                  <Input
                    id="pm"
                    name="pm"
                    value={formData.pm}
                    onChange={handleChange}
                    placeholder="Nombre del PM"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead_dev">Lead Developer *</Label>
                  <Input
                    id="lead_dev"
                    name="lead_dev"
                    value={formData.lead_dev}
                    onChange={handleChange}
                    placeholder="Nombre del Lead Developer"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="designer">Diseñador</Label>
                  <Input
                    id="designer"
                    name="designer"
                    value={formData.designer}
                    onChange={handleChange}
                    placeholder="Nombre del Diseñador"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qa_analyst_id">Analista QA</Label>
                  <Select
                    value={formData.qa_analyst_id}
                    onValueChange={(value) => handleSelectChange("qa_analyst_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un analista" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sin asignar</SelectItem>
                      {analysts.map((analyst) => (
                        <SelectItem key={analyst.id} value={analyst.id.toString()}>
                          {analyst.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Desarrolladores</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addDeveloper}>
                    <Plus className="h-4 w-4 mr-1" />
                    Añadir
                  </Button>
                </div>
                {formData.developers.map((dev, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={dev.developer_name}
                      onChange={(e) => handleDeveloperChange(index, e.target.value)}
                      placeholder="Nombre del desarrollador"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDeveloper(index)}
                      disabled={formData.developers.length === 1}
                    >
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Enlaces y Recursos</CardTitle>
              <CardDescription>URLs y recursos relacionados con el proyecto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="design_url">URL de Diseño</Label>
                  <Input
                    id="design_url"
                    name="design_url"
                    value={formData.design_url}
                    onChange={handleChange}
                    placeholder="https://figma.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="test_url">URL de Pruebas</Label>
                  <Input
                    id="test_url"
                    name="test_url"
                    value={formData.test_url}
                    onChange={handleChange}
                    placeholder="https://staging.example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Recursos Adicionales</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addAsset}>
                    <Plus className="h-4 w-4 mr-1" />
                    Añadir
                  </Button>
                </div>
                {formData.assets.map((asset, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={asset.asset_url}
                      onChange={(e) => handleAssetChange(index, e.target.value)}
                      placeholder="URL del recurso"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAsset(index)}
                      disabled={formData.assets.length === 1}
                    >
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline" type="button" asChild>
              <Link to={`/projects/${id}`}>Cancelar</Link>
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default EditProjectPage

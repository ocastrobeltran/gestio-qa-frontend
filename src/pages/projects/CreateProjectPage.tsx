"use client"

import type React from "react"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { projectService, userService } from "../../services/api"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { useToast } from "../../components/ui/use-toast"
import { ArrowLeft, Plus, Trash } from "lucide-react"
import type { User } from "../../types/user"
import { useEffect } from "react"

const CreateProjectPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
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
    status: "En análisis",
    developers: [{ developer_name: "" }],
    assets: [{ asset_url: "" }],
  })

  useEffect(() => {
    const fetchAnalysts = async () => {
      try {
        const response = await userService.getUsers()
        console.log("User data:", response.data) // Add this to debug
        const analystUsers = response.data.data.users.filter((u: User) => u.role === "analyst")
        console.log("Filtered analysts:", analystUsers) // Add this to debug
        setAnalysts(analystUsers)
      } catch (error) {
        console.error("Error fetching analysts:", error)
        // Log more detailed error information
        if (error.response) {
          console.error("Error response data:", error.response.data)
        }
      }
    }
  
    fetchAnalysts()
  }, [])

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
      developers: [...prev.developers, { developer_name: "" }],
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
      assets: [...prev.assets, { asset_url: "" }],
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
  
    // Filter out empty developers and assets
    const filteredDevelopers = formData.developers
      .filter((dev) => dev.developer_name.trim() !== "")
      .map(dev => dev.developer_name);
  
    const filteredAssets = formData.assets
      .filter((asset) => asset.asset_url.trim() !== "")
      .map(asset => asset.asset_url);
  
    try {
      setLoading(true)
  
      // Prepare data for API
      const projectData = {
        title: formData.title,
        initiative: formData.initiative,
        client: formData.client,
        pm: formData.pm,
        lead_dev: formData.lead_dev,
        designer: formData.designer || null,
        design_url: formData.design_url || null,
        test_url: formData.test_url || null,
        qa_analyst_id: formData.qa_analyst_id === "not_assigned" ? null : formData.qa_analyst_id || null,
        status: formData.status,
        developers: filteredDevelopers,
        assets: filteredAssets,
        created_by: user?.id,
      }
  
      console.log("Enviando datos:", projectData);
      
      const response = await projectService.createProject(projectData)
  
      toast({
        title: "Proyecto creado",
        description: "El proyecto ha sido creado exitosamente.",
      })
  
      navigate(`/projects/${response.data.data.project.id}`)
    } catch (error) {
      console.error("Error creating project:", error)
      // Log more detailed error information
      if (error.response) {
        console.error("Error response data:", error.response.data)
      }
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el proyecto. Inténtalo de nuevo.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" asChild className="mr-2">
            <Link to="/projects">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Crear Nuevo Proyecto</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
              <CardDescription>Ingresa la información básica del proyecto</CardDescription>
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
                    value={formData.qa_analyst_id || "not_assigned"}
                    onValueChange={(value) => handleSelectChange("qa_analyst_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un analista" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_assigned">Sin asignar</SelectItem>
                      {analysts && analysts.length > 0 ? (
                        analysts.map((analyst) => (
                          <SelectItem key={analyst.id} value={analyst.id.toString()}>
                            {analyst.full_name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no_analysts" disabled>
                          No hay analistas disponibles
                        </SelectItem>
                      )}
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
              <Link to="/projects">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Proyecto"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default CreateProjectPage

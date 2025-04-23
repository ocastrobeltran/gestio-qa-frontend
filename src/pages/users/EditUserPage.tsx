"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { userService } from "../../services/api"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { useToast } from "../../components/ui/use-toast"
import { ArrowLeft } from "lucide-react"
import type { User } from "../../types/user"
import LoadingScreen from "../../components/ui/LoadingScreen"

const EditUserPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: currentUser, updateUser: updateCurrentUser } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    role: "",
    password: "",
    confirmPassword: "",
  })

  const isAdmin = currentUser?.role === "admin"
  const isSelf = currentUser?.id === Number(id)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true)
        const response = await userService.getUser(id!)
        const userData = response.data.data.user

        setUser(userData)
        setFormData({
          full_name: userData.full_name,
          email: userData.email,
          role: userData.role,
          password: "",
          confirmPassword: "",
        })
      } catch (error) {
        console.error("Error fetching user:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo cargar la información del usuario.",
        })
        navigate("/users")
      } finally {
        setLoading(false)
      }
    }

    if (isAdmin) {
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [id, isAdmin, navigate, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate passwords if provided
    if (formData.password || formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Las contraseñas no coinciden.",
        })
        return
      }

      if (formData.password.length < 8) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "La contraseña debe tener al menos 8 caracteres.",
        })
        return
      }
    }

    try {
      setSubmitting(true)

      // Prepare data for API
      const userData: any = {
        full_name: formData.full_name,
        email: formData.email,
        role: formData.role,
      }

      // Only include password if it was changed
      if (formData.password) {
        userData.password = formData.password
      }

      const response = await userService.updateUser(id!, userData)

      // If updating self, update auth context
      if (isSelf && response.data.data.user) {
        updateCurrentUser(response.data.data.user)
      }

      toast({
        title: "Usuario actualizado",
        description: "El usuario ha sido actualizado exitosamente.",
      })

      navigate(`/users/${id}`)
    } catch (error: any) {
      console.error("Error updating user:", error)
      const errorMessage = error.response?.data?.message || "No se pudo actualizar el usuario. Inténtalo de nuevo."
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 className="text-xl font-semibold mb-2">Acceso Restringido</h2>
        <p className="text-muted-foreground mb-4">No tienes permisos para acceder a esta sección.</p>
        <Button asChild>
          <Link to="/dashboard">Volver al Dashboard</Link>
        </Button>
      </div>
    )
  }

  if (loading) {
    return <LoadingScreen fullScreen={false} />
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 className="text-xl font-semibold mb-2">Usuario no encontrado</h2>
        <p className="text-muted-foreground mb-4">El usuario que buscas no existe o ha sido eliminado.</p>
        <Button asChild>
          <Link to="/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a usuarios
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" asChild className="mr-2">
            <Link to={`/users/${id}`}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Editar Usuario</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Información del Usuario</CardTitle>
              <CardDescription>Actualiza los datos del usuario</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nombre Completo *</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Ej: Juan Pérez"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="correo@ejemplo.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rol *</Label>
                <Select value={formData.role} onValueChange={handleSelectChange} disabled={isSelf}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="analyst">Analista</SelectItem>
                    <SelectItem value="stakeholder">Stakeholder</SelectItem>
                  </SelectContent>
                </Select>
                {isSelf && <p className="text-xs text-muted-foreground mt-1">No puedes cambiar tu propio rol.</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cambiar Contraseña</CardTitle>
              <CardDescription>Deja en blanco para mantener la contraseña actual</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nueva Contraseña</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                />
                <p className="text-xs text-muted-foreground">La contraseña debe tener al menos 8 caracteres.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline" type="button" asChild>
              <Link to={`/users/${id}`}>Cancelar</Link>
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

export default EditUserPage

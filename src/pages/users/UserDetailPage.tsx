"use client"

import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { userService } from "../../services/api"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
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
import { ArrowLeft, Edit, Trash2, Mail, Calendar, UserCog } from "lucide-react"
import { formatDate, getInitials } from "../../lib/utils"
import type { User } from "../../types/user"
import LoadingScreen from "../../components/ui/LoadingScreen"

const UserDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  const isAdmin = currentUser?.role === "admin"
  const isSelf = currentUser?.id === Number(id)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true)
        const response = await userService.getUser(id!)
        setUser(response.data.data.user)
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

  const handleDelete = async () => {
    if (isSelf) {
      toast({
        variant: "destructive",
        title: "Operación no permitida",
        description: "No puedes eliminar tu propio usuario.",
      })
      return
    }

    try {
      setDeleting(true)
      await userService.deleteUser(id!)

      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado exitosamente.",
      })

      navigate("/users")
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el usuario. Inténtalo de nuevo.",
      })
      setDeleting(false)
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" asChild className="mr-2">
            <Link to="/users">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Detalles del Usuario</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm">
            <Link to={`/users/${user.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isSelf}>
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminará permanentemente el usuario y todos sus datos asociados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  {deleting ? "Eliminando..." : "Eliminar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información del Usuario</CardTitle>
            <CardDescription>Datos personales y de contacto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src="/placeholder.svg" alt={user.full_name} />
                <AvatarFallback className="text-2xl">{getInitials(user.full_name)}</AvatarFallback>
              </Avatar>
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-xl font-semibold">{user.full_name}</h3>
                <div className="flex items-center justify-center sm:justify-start text-muted-foreground">
                  <Mail className="mr-1 h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start text-muted-foreground">
                  <UserCog className="mr-1 h-4 w-4" />
                  <span className="capitalize">
                    {user.role === "admin" ? "Administrador" : user.role === "analyst" ? "Analista" : "Stakeholder"}
                  </span>
                </div>
                {user.created_at && (
                  <div className="flex items-center justify-center sm:justify-start text-muted-foreground">
                    <Calendar className="mr-1 h-4 w-4" />
                    <span>Creado el {formatDate(user.created_at)}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actividad del Usuario</CardTitle>
            <CardDescription>Resumen de actividades y proyectos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {user.role === "analyst" ? (
                <div>
                  <h3 className="font-medium mb-2">Proyectos Asignados</h3>
                  <p className="text-muted-foreground">
                    Para ver los proyectos asignados a este analista, consulta la sección de proyectos.
                  </p>
                  <Button asChild variant="outline" className="mt-4">
                    <Link to="/projects">Ver Proyectos</Link>
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  La información de actividad no está disponible para este tipo de usuario.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default UserDetailPage

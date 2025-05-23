"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { projectService, api } from "../../services/api"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { Textarea } from "../../components/ui/textarea"
import { Badge } from "../../components/ui/badge"
import { Separator } from "../../components/ui/separator"
import { useToast } from "../../components/ui/use-toast"
import { formatDate, formatDateTime, getInitials } from "../../lib/utils"
import type { Project, Comment, HistoryEntry } from "../../types/project"
import {
  ArrowLeft,
  Edit,
  Send,
  Clock,
  User,
  Building,
  FileText,
  ExternalLink,
  History,
  MessageSquare,
  AlertTriangle
} from "lucide-react"
import LoadingScreen from "../../components/ui/LoadingScreen"
import DefectsTab from "../../components/project/DefectsTab";

const ProjectDetailPage = () => {

  interface ProjectWithCommentsAndHistory extends Project {
    comments?: Comment[];
    history?: HistoryEntry[];
  }

  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { toast } = useToast()
  const [project, setProject] = useState<ProjectWithCommentsAndHistory | null>(null);
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [submittingComment, setSubmittingComment] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  const [users, setUsers] = useState<any[]>([]);

  const isAdmin = user?.role === "admin"
  const isAnalyst = user?.role === "analyst"
  const canEdit = isAdmin || (isAnalyst && project?.qa_analyst_id === user?.id)

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true)
        console.log("Fetching project with ID:", id)
        const response = await projectService.getProject(id!)
        console.log("Project API response:", response)
        
        if (response?.data?.data?.project) {
          setProject(response.data.data.project)
        } else {
          console.error("Respuesta de API incorrecta:", response)
          toast({
            variant: "destructive",
            title: "Error",
            description: "Formato de respuesta incorrecto. Contacta al administrador.",
          })
        }
      } catch (error) {
        console.error("Error fetching project:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo cargar el proyecto. Inténtalo de nuevo.",
        })
      } finally {
        setLoading(false)
      }
    }
  
    if (id) {
      fetchProject()
    } else {
      setLoading(false)
    }
  }, [id, toast])

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case "Alta":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "Baja":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      default: // Media
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
    }
  }

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/users');
        if (response.data && response.data.data && response.data.data.users) {
          setUsers(response.data.data.users);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los usuarios"
        });
      }
    };
  
    fetchUsers();
  }, []);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return
  
    try {
      setSubmittingComment(true)
      
      // Enviar el comentario - el backend se encargará de enviar las notificaciones
      const response = await projectService.addComment(id!, newComment)
      
      // Actualizar el proyecto con el nuevo comentario
      setProject((prev) => {
        if (!prev) return prev
        
        // Asegurarse de que el comentario incluya la información del autor
        const newCommentWithAuthor = {
          ...response.data.data.comment,
          author: response.data.data.comment.author || {
            id: user?.id || 0,
            full_name: user?.full_name || 'Usuario',
            email: user?.email || '',
            role: user?.role || ''
          }
        };
        
        return {
          ...prev,
          comments: [...(prev.comments || []), newCommentWithAuthor],
        }
      })
  
      setNewComment("")
      toast({
        title: "Comentario añadido",
        description: "Tu comentario ha sido añadido y se han enviado notificaciones a los involucrados.",
      })
    } catch (error) {
      console.error("Error adding comment:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo añadir el comentario. Inténtalo de nuevo.",
      })
    } finally {
      setSubmittingComment(false)
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Aprobado":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "Cancelado":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "En pruebas":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "En validación":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
    }
  }

  if (loading) {
    return <LoadingScreen fullScreen={false} />
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 className="text-xl font-semibold mb-2">Proyecto no encontrado</h2>
        <p className="text-muted-foreground mb-4">El proyecto que buscas no existe o ha sido eliminado.</p>
        <Button asChild>
          <Link to="/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a proyectos
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
            <Link to="/projects">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{project.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusBadgeClass(project.status)}>{project.status}</Badge>
          <Badge className={getPriorityBadgeClass(project.priority)}>{project.priority}</Badge>
          {canEdit && (
            <Button asChild size="sm">
              <Link to={`/projects/${project.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Detalles</TabsTrigger>
          <TabsTrigger value="comments">Comentarios ({project.comments?.length || 0})</TabsTrigger>
          <TabsTrigger value="defects">Defectos</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Información General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                      <Building className="mr-2 h-4 w-4" />
                      Cliente
                    </h3>
                    <p className="mt-1">{project.client}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Prioridad
                    </h3>
                    <p className="mt-1">{project.priority}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      Iniciativa
                    </h3>
                    <p className="mt-1">{project.initiative}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Project Manager
                    </h3>
                    <p className="mt-1">{project.pm}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Lead Developer
                    </h3>
                    <p className="mt-1">{project.lead_dev}</p>
                  </div>
                  {project.designer && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Diseñador
                      </h3>
                      <p className="mt-1">{project.designer}</p>
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Analista QA
                    </h3>
                    <p className="mt-1">{project.qaAnalyst?.full_name || "Sin asignar"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                      <Clock className="mr-2 h-4 w-4" />
                      Fechas
                    </h3>
                    <p className="mt-1">Creado: {formatDate(project.created_at)}</p>
                    <p className="mt-1">Actualizado: {formatDate(project.updated_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Enlaces y Recursos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.design_url && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Diseño</h3>
                    <a
                      href={project.design_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 flex items-center text-primary hover:underline"
                    >
                      {project.design_url}
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </div>
                )}
                {project.test_url && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">URL de Pruebas</h3>
                    <a
                      href={project.test_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 flex items-center text-primary hover:underline"
                    >
                      {project.test_url}
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </div>
                )}

                {project.developers && project.developers.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Desarrolladores</h3>
                    <ul className="space-y-1">
                      {project.developers.map((dev) => (
                        <li key={dev.id}>{dev.developer_name}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {project.assets && project.assets.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Recursos</h3>
                    <ul className="space-y-1">
                      {project.assets.map((asset) => (
                        <li key={asset.id}>
                          <a
                            href={asset.asset_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-primary hover:underline"
                          >
                            Recurso {asset.id}
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comentarios</CardTitle>
              <CardDescription>Discusión sobre el proyecto</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {project.comments && project.comments.length > 0 ? (
                  <div className="space-y-4">
                    {project.comments.map((comment: Comment) => (
                      <div key={comment.id} className="flex space-x-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src="/placeholder.svg" alt={comment.author?.full_name || "Usuario"} />
                          <AvatarFallback>
                            {comment.author ? getInitials(comment.author.full_name) : "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium">{comment.author?.full_name || "Usuario"}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {formatDateTime(comment.created_at)}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm">{comment.comment_text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                    <p className="mt-2 text-muted-foreground">No hay comentarios aún</p>
                  </div>
                )}

                <Separator className="my-4" />

                <form onSubmit={handleAddComment} className="space-y-4">
                  <Textarea
                    placeholder="Escribe un comentario..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <div className="flex justify-end">
                  <Button 
                      type="submit" 
                      disabled={submittingComment || !newComment.trim()}
                    >
                      {submittingComment ? (
                        <>
                          <span className="mr-2">Enviando...</span>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </>
                      ) : (
                        <>
                          Enviar comentario
                          <Send className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="defects">
          <DefectsTab users={users} />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Cambios</CardTitle>
              <CardDescription>Registro de modificaciones del proyecto</CardDescription>
            </CardHeader>
            <CardContent>
              {project.history && project.history.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                  <ul className="space-y-4">
                    {project.history.map((entry: HistoryEntry) => (
                      <li key={entry.id} className="relative pl-8">
                        <div className="absolute left-0 top-2 h-4 w-4 rounded-full bg-primary" />
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center text-sm">
                            <span className="font-medium">{entry.changer?.full_name || "Usuario"}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {formatDateTime(entry.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm">
                            <span className="font-medium">{entry.change_type}</span>
                            {entry.old_value && entry.new_value && (
                              <>
                                : de <span className="italic">{entry.old_value}</span> a{" "}
                                <span className="italic">{entry.new_value}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <p className="mt-2 text-muted-foreground">No hay historial de cambios</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ProjectDetailPage

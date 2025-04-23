"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { userService } from "../../services/api"
import type { User } from "../../types/user"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { Plus, Search, Filter } from "lucide-react"
import { formatDate, getInitials } from "../../lib/utils"
import LoadingScreen from "../../components/ui/LoadingScreen"

const UsersPage = () => {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("")

  const isAdmin = user?.role === "admin"

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        const response = await userService.getUsers()
        setUsers(response.data.data.users)
        setFilteredUsers(response.data.data.users)
      } catch (error) {
        console.error("Error fetching users:", error)
      } finally {
        setLoading(false)
      }
    }

    if (isAdmin) {
      fetchUsers()
    } else {
      setLoading(false)
    }
  }, [isAdmin])

  useEffect(() => {
    // Apply filters
    let result = [...users]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (user) => user.full_name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term),
      )
    }

    if (roleFilter) {
      result = result.filter((user) => user.role === roleFilter)
    }

    setFilteredUsers(result)
  }, [searchTerm, roleFilter, users])

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
        <Button asChild>
          <Link to="/users/create">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <CardDescription>Gestiona los usuarios del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nombre o email..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-[200px]">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filtrar por rol" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="analyst">Analista</SelectItem>
                  <SelectItem value="stakeholder">Stakeholder</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Fecha Creación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarImage src="/placeholder.svg" alt={user.full_name} />
                            <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                          </Avatar>
                          <Link to={`/users/${user.id}`} className="hover:underline text-primary">
                            {user.full_name}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            user.role === "admin"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                              : user.role === "analyst"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          }`}
                        >
                          {user.role === "admin"
                            ? "Administrador"
                            : user.role === "analyst"
                              ? "Analista"
                              : "Stakeholder"}
                        </span>
                      </TableCell>
                      <TableCell>{user.created_at ? formatDate(user.created_at) : "N/A"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/users/${user.id}`}>Ver detalles</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No se encontraron usuarios
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

export default UsersPage

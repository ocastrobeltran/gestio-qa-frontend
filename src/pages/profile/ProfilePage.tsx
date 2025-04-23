"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { authService } from "../../services/api"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { useToast } from "../../components/ui/use-toast"
import { User, Mail, Shield, Key } from "lucide-react"
import { getInitials } from "../../lib/utils"

const ProfilePage = () => {
  const { user, updateUser } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfileForm((prev) => ({ ...prev, [name]: value }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    try {
      setLoading(true)

      const response = await authService.updateProfile({
        full_name: profileForm.full_name,
        email: profileForm.email,
      })

      updateUser(response.data.data.user)

      toast({
        title: "Perfil actualizado",
        description: "Tu información de perfil ha sido actualizada exitosamente.",
      })
    } catch (error: any) {
      console.error("Error updating profile:", error)
      const errorMessage = error.response?.data?.message || "No se pudo actualizar el perfil. Inténtalo de nuevo."
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate passwords
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Las contraseñas no coinciden.",
      })
      return
    }

    if (passwordForm.newPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "La nueva contraseña debe tener al menos 8 caracteres.",
      })
      return
    }

    try {
      setLoading(true)

      await authService.updatePassword(passwordForm.currentPassword, passwordForm.newPassword)

      // Reset form
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })

      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido actualizada exitosamente.",
      })
    } catch (error: any) {
      console.error("Error updating password:", error)
      const errorMessage = error.response?.data?.message || "No se pudo actualizar la contraseña. Inténtalo de nuevo."
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Mi Perfil</h1>

      <div className="grid gap-6 md:grid-cols-5">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>Tu información de perfil en el sistema</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src="/placeholder.svg" alt={user.full_name} />
              <AvatarFallback className="text-2xl">{getInitials(user.full_name)}</AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-semibold">{user.full_name}</h2>
            <p className="text-muted-foreground">{user.email}</p>
            <div className="mt-2 flex items-center justify-center">
              <Shield className="h-4 w-4 mr-1 text-primary" />
              <span className="capitalize">
                {user.role === "admin" ? "Administrador" : user.role === "analyst" ? "Analista" : "Stakeholder"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Configuración de Cuenta</CardTitle>
            <CardDescription>Administra tu información y seguridad</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="profile">
              <TabsList className="mb-4">
                <TabsTrigger value="profile">Perfil</TabsTrigger>
                <TabsTrigger value="password">Contraseña</TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">
                      <User className="h-4 w-4 inline mr-1" />
                      Nombre Completo
                    </Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      value={profileForm.full_name}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      <Mail className="h-4 w-4 inline mr-1" />
                      Correo Electrónico
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={profileForm.email}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>

                  <Button type="submit" disabled={loading}>
                    {loading ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="password">
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">
                      <Key className="h-4 w-4 inline mr-1" />
                      Contraseña Actual
                    </Label>
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nueva Contraseña</Label>
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                    <p className="text-xs text-muted-foreground">La contraseña debe tener al menos 8 caracteres.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>

                  <Button type="submit" disabled={loading}>
                    {loading ? "Actualizando..." : "Actualizar Contraseña"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ProfilePage

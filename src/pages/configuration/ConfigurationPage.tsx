// ConfigurationPage.tsx
import { useAuth } from "../../contexts/AuthContext"
import { Navigate } from "react-router-dom"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"

const ConfigurationPage = () => {
  const { user } = useAuth()
  
  // Solo permitir acceso a administradores
  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Configuración del Sistema</h1>
      </div>
      
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Gestión de Usuarios</TabsTrigger>
          <TabsTrigger value="system">Parámetros Generales</TabsTrigger>
          <TabsTrigger value="security">Seguridad</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Usuarios</CardTitle>
              <CardDescription>Administra los usuarios del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Aquí irá el componente de gestión de usuarios.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>Parámetros Generales</CardTitle>
              <CardDescription>Configura los parámetros generales del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Aquí irán los parámetros generales del sistema.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Seguridad</CardTitle>
              <CardDescription>Configura los parámetros de seguridad</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Aquí irán los parámetros de seguridad.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ConfigurationPage
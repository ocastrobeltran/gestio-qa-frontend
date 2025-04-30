import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { defectService } from "../../services/api";
import { Defect, DefectSeverity, DefectStatus } from "../../types/project";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { useToast } from "../ui/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Edit, Trash2 } from "lucide-react";
import LoadingScreen from "../ui/LoadingScreen";

// Esquema de validación para el formulario de defectos
const defectSchema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  description: z.string().optional(),
  severity: z.enum(["Crítico", "Mayor", "Menor", "Cosmético"]),
  status: z.enum(["Abierto", "En revisión", "Corregido", "Verificado", "Cerrado"]),
  assigned_to: z.number().optional().nullable()
});

type DefectFormValues = z.infer<typeof defectSchema>;

// Colores para severidad y estado
const SEVERITY_COLORS: Record<DefectSeverity, string> = {
  "Crítico": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  "Mayor": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  "Menor": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  "Cosmético": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
};

const STATUS_COLORS: Record<DefectStatus, string> = {
  "Abierto": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  "En revisión": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  "Corregido": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  "Verificado": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "Cerrado": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
};

const DefectsTab = ({ users }: { users: any[] }) => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [defects, setDefects] = useState<Defect[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDefect, setEditingDefect] = useState<Defect | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  // Formulario para crear/editar defectos
  const form = useForm<DefectFormValues>({
    resolver: zodResolver(defectSchema),
    defaultValues: {
      title: "",
      description: "",
      severity: "Mayor",
      status: "Abierto",
      assigned_to: null
    }
  });

  // Cargar defectos y estadísticas
  const fetchDefects = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const [defectsRes, statsRes] = await Promise.all([
        defectService.getDefects(id),
        defectService.getDefectStats(id)
      ]);
      
      setDefects(defectsRes.data.data.defects);
      setStats(statsRes.data.data.stats);
    } catch (error) {
      console.error("Error al cargar defectos:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los defectos"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDefects();
  }, [id]);

  // Abrir formulario para editar
  const handleEdit = (defect: Defect) => {
    setEditingDefect(defect);
    form.reset({
      title: defect.title,
      description: defect.description || "",
      severity: defect.severity as DefectSeverity,
      status: defect.status as DefectStatus,
      assigned_to: defect.assigned_to
    });
    setIsDialogOpen(true);
  };

  // Abrir formulario para crear
  const handleCreate = () => {
    setEditingDefect(null);
    form.reset({
      title: "",
      description: "",
      severity: "Mayor",
      status: "Abierto",
      assigned_to: null
    });
    setIsDialogOpen(true);
  };

  // Enviar formulario
  const onSubmit = async (values: DefectFormValues) => {
    if (!id) return;
    
    try {
      if (editingDefect) {
        // Actualizar defecto existente
        await defectService.updateDefect(id, editingDefect.id.toString(), values);
        toast({
          title: "Defecto actualizado",
          description: "El defecto ha sido actualizado correctamente"
        });
      } else {
        // Crear nuevo defecto
        await defectService.createDefect(id, values);
        toast({
          title: "Defecto creado",
          description: "El defecto ha sido creado correctamente"
        });
      }
      
      // Recargar datos
      fetchDefects();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error al guardar defecto:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar el defecto"
      });
    }
  };

  // Eliminar defecto
  const handleDelete = async (defectId: number) => {
    if (!id) return;
    
    try {
      await defectService.deleteDefect(id, defectId.toString());
      toast({
        title: "Defecto eliminado",
        description: "El defecto ha sido eliminado correctamente"
      });
      
      // Recargar datos
      fetchDefects();
      setConfirmDelete(null);
    } catch (error) {
      console.error("Error al eliminar defecto:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el defecto"
      });
    }
  };

  if (loading) {
    return <LoadingScreen fullScreen={false} />;
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas de defectos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de defectos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalDefects || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Defectos abiertos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.openDefects || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Defectos cerrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.closedDefects || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tasa de corrección</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.correctionRate || 0}%</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Lista de defectos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Defectos</CardTitle>
            <CardDescription>Lista de defectos reportados en este proyecto</CardDescription>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo defecto
          </Button>
        </CardHeader>
        <CardContent>
          {defects.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Severidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Reportado por</TableHead>
                  <TableHead>Asignado a</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {defects.map((defect) => (
                  <TableRow key={defect.id}>
                    <TableCell className="font-medium">{defect.title}</TableCell>
                    <TableCell>
                      <Badge className={SEVERITY_COLORS[defect.severity as DefectSeverity]}>
                        {defect.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[defect.status as DefectStatus]}>
                        {defect.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{defect.reporter?.full_name || "N/A"}</TableCell>
                    <TableCell>{defect.assignee?.full_name || "Sin asignar"}</TableCell>
                    <TableCell>{new Date(defect.reported_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(defect)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setConfirmDelete(defect.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No hay defectos registrados</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Diálogo para crear/editar defecto */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingDefect ? "Editar defecto" : "Nuevo defecto"}
            </DialogTitle>
            <DialogDescription>
              {editingDefect 
                ? "Actualiza la información del defecto" 
                : "Completa la información para reportar un nuevo defecto"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Título del defecto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe el defecto en detalle" 
                        className="min-h-[100px]" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="severity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Severidad</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar severidad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Crítico">Crítico</SelectItem>
                          <SelectItem value="Mayor">Mayor</SelectItem>
                          <SelectItem value="Menor">Menor</SelectItem>
                          <SelectItem value="Cosmético">Cosmético</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Abierto">Abierto</SelectItem>
                          <SelectItem value="En revisión">En revisión</SelectItem>
                          <SelectItem value="Corregido">Corregido</SelectItem>
                          <SelectItem value="Verificado">Verificado</SelectItem>
                          <SelectItem value="Cerrado">Cerrado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="assigned_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asignar a</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "unassigned" ? null : parseInt(value))} 
                      defaultValue={field.value?.toString() || "unassigned"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar usuario" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unassigned">Sin asignar</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingDefect ? "Actualizar" : "Crear"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={confirmDelete !== null} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este defecto? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DefectsTab;
"use client"

import { useState, useEffect } from "react";
import { CLINICAL_ROUTES } from "@/lib/constants";
import { useAdminStore, ActivityDefinition } from "@/store/useAdminStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit2, Trash2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";

const ICON_OPTIONS = [
  { value: 'water-outline',         label: '💧 Agua' },
  { value: 'journal-outline',       label: '📓 Diario' },
  { value: 'leaf-outline',          label: '🍃 Hoja' },
  { value: 'planet-outline',        label: '🪐 Planeta' },
  { value: 'flame-outline',         label: '🔥 Llama' },
  { value: 'timer-outline',         label: '⏱ Timer' },
  { value: 'eye-off-outline',       label: '👁 Ojo' },
  { value: 'boat-outline',          label: '⛵ Barco' },
  { value: 'heart-half-outline',    label: '💙 Corazón' },
  { value: 'paper-plane-outline',   label: '✈️ Avión' },
  { value: 'sparkles-outline',      label: '✨ Destellos' },
  { value: 'star-outline',          label: '⭐ Estrella' },
  { value: 'moon-outline',          label: '🌙 Luna' },
  { value: 'sunny-outline',         label: '☀️ Sol' },
  { value: 'musical-notes-outline', label: '🎵 Música' },
  { value: 'body-outline',          label: '🧘 Cuerpo' },
];

const COLOR_OPTIONS = [
  { value: '#87CEEB', label: 'Azul cielo' },
  { value: '#FFD93D', label: 'Amarillo' },
  { value: '#C4B7EB', label: 'Lila' },
  { value: '#A8E6CF', label: 'Verde menta' },
  { value: '#FF7E67', label: 'Coral' },
  { value: '#4ADE80', label: 'Verde' },
  { value: '#B39DDB', label: 'Violeta' },
  { value: '#FFB74D', label: 'Naranja' },
  { value: '#F48FB1', label: 'Rosa' },
  { value: '#4FC3F7', label: 'Celeste' },
  { value: '#F472B6', label: 'Fucsia' },
  { value: '#60A5FA', label: 'Azul' },
];

const EMPTY_FORM = {
  title: '',
  route: 'all',
  duration: '5 min',
  description: '',
  icon: 'sparkles-outline',
  color: '#87CEEB',
};

export default function CMSPage() {
  const { activities, isLoadingActivities, fetchActivities, addActivity, updateActivity, deleteActivity } = useAdminStore();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityDefinition | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const routesArray = Object.values(CLINICAL_ROUTES);

  useEffect(() => {
    console.log('[CMS PAGE] Montando — llamando fetchActivities...');
    fetchActivities().then(() => {
      console.log('[CMS PAGE] fetchActivities completado. activities en store:', useAdminStore.getState().activities.length);
    });
  }, []);

  // Log cada vez que activities cambia
  useEffect(() => {
    console.log('[CMS PAGE] activities actualizado:', activities.length, 'items', activities.map(a => a.title));
  }, [activities]);

  const setField = (key: string, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const resetForm = () => setForm(EMPTY_FORM);

  const handleCreate = async () => {
    if (!form.title.trim()) { toast.error("El título es obligatorio"); return; }
    if (!form.description.trim()) { toast.error("La descripción es obligatoria"); return; }

    console.log('[CMS PAGE] Creando actividad con datos:', form);
    setIsSaving(true);
    try {
      await addActivity(form);
      toast.success("Actividad agregada exitosamente");
      setIsAddOpen(false);
      resetForm();
    } catch (err) {
      console.error('[CMS PAGE] Error al crear actividad:', err);
      toast.error("Error al guardar. Revisa la consola.");
    } finally {
      setIsSaving(false);
    }
  };

  const openEdit = (activity: ActivityDefinition) => {
    console.log('[CMS PAGE] Abriendo edición para:', activity.title);
    setEditingActivity(activity);
    setForm({
      title:       activity.title,
      route:       activity.route,
      duration:    activity.duration,
      description: activity.description,
      icon:        activity.icon,
      color:       activity.color,
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingActivity) return;
    if (!form.title.trim()) { toast.error("El título es obligatorio"); return; }

    console.log('[CMS PAGE] Actualizando actividad id:', editingActivity.id, '| nuevos datos:', form);
    setIsSaving(true);
    try {
      await updateActivity(editingActivity.id, form);
      toast.success("Actividad actualizada");
      setIsEditOpen(false);
    } catch (err) {
      console.error('[CMS PAGE] Error al actualizar:', err);
      toast.error("Error al actualizar. Revisa la consola.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    console.log('[CMS PAGE] Eliminando actividad id:', id);
    try {
      await deleteActivity(id);
      toast.success("Actividad eliminada");
    } catch (err) {
      console.error('[CMS PAGE] Error al eliminar:', err);
      toast.error("Error al eliminar. Revisa la consola.");
    }
  };

  // ── FIX: campos inline (NO como componente) para evitar pérdida de foco ──
  const formFields = (
    <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label className="text-zinc-300">Título</Label>
        <Input
          value={form.title}
          onChange={(e) => setField('title', e.target.value)}
          className="bg-black/40 border-white/10 text-white"
          placeholder="Ej: Respiración de Caja"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-zinc-300">Descripción</Label>
        <Input
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
          className="bg-black/40 border-white/10 text-white"
          placeholder="Ej: Calma tu mente en minutos."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-zinc-300">Ícono</Label>
          <Select value={form.icon} onValueChange={(v) => setField('icon', v)}>
            <SelectTrigger className="bg-black/40 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-white/10 text-white max-h-48">
              {ICON_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-zinc-300">Color</Label>
          <Select value={form.color} onValueChange={(v) => setField('color', v)}>
            <SelectTrigger className="bg-black/40 border-white/10 text-white">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: form.color }} />
                <span className="text-sm">{COLOR_OPTIONS.find(c => c.value === form.color)?.label ?? form.color}</span>
              </div>
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-white/10 text-white">
              {COLOR_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: o.value }} />
                    {o.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-zinc-300">Ruta Asignada</Label>
        <Select value={form.route} onValueChange={(v) => setField('route', v)}>
          <SelectTrigger className="bg-black/40 border-white/10 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-950 border-white/10 text-white">
            <SelectItem value="all">Universal (Todas)</SelectItem>
            {routesArray.map((r) => (
              <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-zinc-300">Duración Estimada</Label>
        <Input
          value={form.duration}
          onChange={(e) => setField('duration', e.target.value)}
          className="bg-black/40 border-white/10 text-white"
          placeholder="Ej: 5 min"
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-white">
          Actividades Clínicas (CMS)
          {/* DEBUG: contador en tiempo real */}
          <span className="ml-3 text-sm font-normal text-zinc-500">
            ({activities.length} actividades)
          </span>
        </h2>

        <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-white/10 text-white hover:bg-white/20 border border-white/10 transition-all">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nueva Actividad
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px] bg-zinc-950 border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Nueva Actividad</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Añade una nueva actividad al catálogo de Ánima. Aparecerá en la app móvil.
              </DialogDescription>
            </DialogHeader>
            {formFields}
            <DialogFooter>
              <Button onClick={() => { setIsAddOpen(false); resetForm(); }} variant="ghost" className="text-zinc-400 hover:text-white">
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={isSaving} className="bg-indigo-600 text-white hover:bg-indigo-500">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSaving ? 'Guardando...' : 'Guardar Actividad'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoadingActivities ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          <span className="ml-3 text-zinc-400">Cargando actividades...</span>
        </div>
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
          <p className="text-lg">No hay actividades aún.</p>
          <p className="text-sm mt-1">Crea la primera usando el botón de arriba.</p>
          <p className="text-xs mt-2 text-zinc-600">
            Si ya corriste el SQL, revisa la consola del navegador para ver el error.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activities.map((activity, index) => {
            let routeColor = "#52525b";
            let routeName = "Universal";
            if (activity.route !== "all" && CLINICAL_ROUTES[activity.route as keyof typeof CLINICAL_ROUTES]) {
              routeColor = CLINICAL_ROUTES[activity.route as keyof typeof CLINICAL_ROUTES].color;
              routeName = CLINICAL_ROUTES[activity.route as keyof typeof CLINICAL_ROUTES].name;
            }

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                layout
              >
                <Card className="bg-zinc-950/60 border-white/10 backdrop-blur-md shadow-xl hover:border-white/20 transition-colors h-full">
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: activity.color }} />
                        <CardTitle className="text-base font-semibold text-white leading-tight truncate">
                          {activity.title}
                        </CardTitle>
                      </div>
                      <p className="text-xs text-zinc-500 line-clamp-2">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: routeColor }} />
                        <span className="text-xs text-zinc-400">Ruta: {routeName}</span>
                        <span className="text-xs text-zinc-600">• {activity.duration}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2 flex-shrink-0">
                      <Button onClick={() => openEdit(activity)} variant="ghost" size="icon"
                        className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/10">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button onClick={() => handleDelete(activity.id)} variant="ghost" size="icon"
                        className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-400/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <span className="text-xs text-zinc-600 font-mono bg-zinc-900 px-1.5 py-0.5 rounded">
                      {activity.icon}
                    </span>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); }}>
        <DialogContent className="sm:max-w-[480px] bg-zinc-950 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Editar Actividad</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Los cambios se reflejarán en la app móvil al guardar.
            </DialogDescription>
          </DialogHeader>
          {formFields}
          <DialogFooter>
            <Button onClick={() => setIsEditOpen(false)} variant="ghost" className="text-zinc-400 hover:text-white">Cancelar</Button>
            <Button onClick={handleUpdate} disabled={isSaving} className="bg-indigo-600 text-white hover:bg-indigo-500">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
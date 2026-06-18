"use client"

import { useState, useEffect } from "react"
import { ShieldCheck, User, Mail, Building, FileBadge, Save, KeyRound, Loader2, Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { useAdminStore } from "@/store/useAdminStore"
import { supabase } from "@/lib/supabase"

export default function ProfilePage() {
  const { adminProfile, isLoadingProfile, fetchAdminProfile, updateAdminProfile } = useAdminStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Campos editables
  const [username, setUsername] = useState("");
  const [license, setLicense] = useState("");
  const [organization, setOrganization] = useState("");

  // Dialog para cambiar contraseña
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Cargar perfil al montar
  useEffect(() => {
    fetchAdminProfile();
  }, [fetchAdminProfile]);

  // Sincronizar campos locales cuando llega el perfil
  useEffect(() => {
    if (adminProfile) {
      setUsername(adminProfile.username || "");
    }
  }, [adminProfile]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateAdminProfile({ username: username.trim() || null });
      toast.success("Perfil actualizado correctamente");
      setIsEditing(false);
    } catch {
      toast.error("Error al guardar. Intenta de nuevo.");
    }
    setIsSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    setIsChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast.error("Error al cambiar contraseña: " + error.message);
    } else {
      toast.success("Contraseña actualizada exitosamente");
      setPasswordDialogOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    }
    setIsChangingPassword(false);
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("es-ES", {
        day: "2-digit", month: "long", year: "numeric",
      });
    } catch {
      return "-";
    }
  };

  const initials = adminProfile?.username
    ? adminProfile.username.slice(0, 2).toUpperCase()
    : adminProfile?.email?.slice(0, 2).toUpperCase() || "AD";

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        <span className="ml-3 text-zinc-400">Cargando perfil...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <User className="w-8 h-8 text-indigo-400" />
            Mi Perfil (Admin)
          </h2>
          <p className="text-zinc-400 mt-1">
            Gestiona tu información pública, licencia clínica y credenciales de acceso.
          </p>
        </div>
        <div className="flex items-center gap-2">
           {isEditing ? (
             <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all border-0"
             >
               {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
               {isSaving ? 'Guardando...' : 'Guardar Cambios'}
             </Button>
           ) : (
             <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="border-white/10 text-white bg-white/5 hover:bg-white/10"
             >
               Editar Perfil
             </Button>
           )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Columna izquierda: Avatar y rol */}
        <Card className="bg-zinc-950/60 border-white/10 backdrop-blur-md shadow-xl h-fit">
           <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
             <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-1 shadow-lg shadow-purple-500/20">
               <div className="w-full h-full rounded-full bg-zinc-900 border-2 border-zinc-950 flex flex-col items-center justify-center text-white font-bold text-2xl">
                 {initials}
               </div>
             </div>

             <div className="space-y-1">
               <h3 className="text-xl font-bold text-white">{adminProfile?.username || adminProfile?.email?.split('@')[0] || 'Admin'}</h3>
               <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-sm font-medium">
                 <ShieldCheck className="w-4 h-4" />
                 {adminProfile?.role === 'admin' ? 'Super Administrador' : adminProfile?.role || 'Admin'}
               </div>
             </div>

             {adminProfile?.created_at && (
               <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                 <Calendar className="w-3 h-3" />
                 Miembro desde {formatDate(adminProfile.created_at)}
               </div>
             )}
           </CardContent>
        </Card>

        {/* Columna derecha: Formularios */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-zinc-950/60 border-white/10 backdrop-blur-md shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl text-white">Información Profesional</CardTitle>
              <CardDescription className="text-zinc-400">
                Esta información puede ser visible internamente en el registro de auditoría.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="username" className="text-zinc-300">Nombre de usuario</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={!isEditing}
                    className="bg-black/40 border-white/10 text-white disabled:opacity-50 disabled:text-zinc-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="license" className="text-zinc-300">Registro Médico / Licencia Clínica (Opcional)</Label>
                <div className="relative">
                  <FileBadge className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                  <Input
                    id="license"
                    value={license}
                    onChange={(e) => setLicense(e.target.value)}
                    disabled={!isEditing}
                    placeholder="RMP-10293847"
                    className="pl-10 bg-black/40 border-white/10 text-white disabled:opacity-50 disabled:text-zinc-500 font-mono"
                  />
                </div>
              </div>

               <div className="space-y-2">
                <Label htmlFor="org" className="text-zinc-300">Institución u Organización</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                  <Input
                    id="org"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    disabled={!isEditing}
                    placeholder="Ánima Core Team"
                    className="pl-10 bg-black/40 border-white/10 text-white disabled:opacity-50 disabled:text-zinc-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-950/60 border-white/10 backdrop-blur-md shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl text-white">Seguridad de la Cuenta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-zinc-300">Correo Electrónico (Solo Lectura)</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                  <Input
                    value={adminProfile?.email || ""}
                    disabled
                    className="pl-10 bg-black/40 border-white/10 text-zinc-500 disabled:opacity-50 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                 <Button
                   onClick={() => setPasswordDialogOpen(true)}
                   variant="outline"
                   className="w-full sm:w-auto border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20 hover:text-red-300"
                 >
                    <KeyRound className="mr-2 h-4 w-4" /> Cambiar Contraseña
                 </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog: Cambiar contraseña */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-zinc-950 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Cambiar Contraseña</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Ingresa tu nueva contraseña. Debe tener al menos 6 caracteres.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Nueva Contraseña</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-black/40 border-white/10 text-white"
                placeholder="••••••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Confirmar Contraseña</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-black/40 border-white/10 text-white"
                placeholder="••••••••••••"
                onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPasswordDialogOpen(false)} className="text-zinc-400 hover:text-white">Cancelar</Button>
            <Button onClick={handleChangePassword} disabled={isChangingPassword} className="bg-red-600 text-white hover:bg-red-500">
              {isChangingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isChangingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

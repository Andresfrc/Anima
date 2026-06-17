"use client"

import { useState, useEffect } from "react"
import { Settings, Save, Bell, ShieldCheck, Database, Smartphone, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { useAdminStore } from "@/store/useAdminStore"
import { supabase } from "@/lib/supabase"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"security" | "notifications" | "database" | "mobile">("security");
  const { appSettings, isLoadingSettings, fetchAppSettings, updateAppSetting } = useAdminStore();
  const [isSaving, setIsSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState<Record<string, Record<string, unknown>>>({});
  const [dbStats, setDbStats] = useState<{ profiles: number; activities: number; moodLogs: number; journals: number } | null>(null);

  useEffect(() => {
    fetchAppSettings();
    loadDBStats();
  }, [fetchAppSettings]);

  useEffect(() => {
    if (appSettings.length > 0) {
      const mapped: typeof localSettings = {};
      appSettings.forEach(s => { mapped[s.key] = s.value; });
      setLocalSettings(mapped);
    }
  }, [appSettings]);

  const loadDBStats = async () => {
    const [profiles, activities, moodLogs, journals] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('activities').select('*', { count: 'exact', head: true }),
      supabase.from('mood_logs').select('*', { count: 'exact', head: true }),
      supabase.from('journal_entries').select('*', { count: 'exact', head: true }),
    ]);
    setDbStats({
      profiles: profiles.count || 0,
      activities: activities.count || 0,
      moodLogs: moodLogs.count || 0,
      journals: journals.count || 0,
    });
  };

  const getSetting = (key: string, defaultValue: Record<string, unknown> = {}) =>
    localSettings[key] || defaultValue;

  const updateLocal = (key: string, value: Record<string, unknown>) =>
    setLocalSettings(prev => ({ ...prev, [key]: value }));

  const hasSettings = appSettings.length > 0;

  // FIX: guarda TODO incluyendo maintenance_mode al presionar el botón
  const handleSave = async () => {
    if (!hasSettings) {
      toast.error("No hay configuración cargada. Ejecuta el script SQL primero.");
      return;
    }
    setIsSaving(true);
    try {
      const promises = Object.entries(localSettings)
        .map(([key, value]) => updateAppSetting(key, value));
      await Promise.all(promises);
      toast.success("Configuración de sistema actualizada");
    } catch {
      toast.error("Error al guardar configuración");
    }
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Settings className="w-8 h-8 text-indigo-400" />
            Configuración Global
          </h2>
          <p className="text-zinc-400 mt-1">Parámetros del sistema, seguridad y notificaciones Push (Aníma App).</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasSettings}
          className="bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all border-0"
        >
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isSaving ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </div>

      {isLoadingSettings ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          <span className="ml-3 text-zinc-400">Cargando configuración...</span>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Navegación lateral */}
          <Card className="bg-zinc-950/60 border-white/10 backdrop-blur-md shadow-xl h-fit">
            <CardContent className="p-4 space-y-2">
              {[
                { id: "security" as const, icon: ShieldCheck, label: "Seguridad", color: "text-emerald-400" },
                { id: "notifications" as const, icon: Bell, label: "Notificaciones Push", color: "text-blue-400" },
                { id: "database" as const, icon: Database, label: "Base de Datos", color: "text-purple-400" },
                { id: "mobile" as const, icon: Smartphone, label: "App Móvil", color: "text-zinc-400" },
              ].map(tab => (
                <Button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  variant="ghost"
                  className={`w-full justify-start h-11 ${activeTab === tab.id ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                >
                  <tab.icon className={`mr-3 h-5 w-5 ${tab.color}`} /> {tab.label}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Contenido */}
          <div className="md:col-span-2 space-y-6">
            {!hasSettings && activeTab !== 'database' && (
              <Card className="bg-amber-500/5 border-amber-500/20">
                <CardContent className="p-6 text-center text-amber-400">
                  <p className="text-lg font-semibold mb-2">Tabla de configuración no encontrada</p>
                  <p className="text-sm text-zinc-400">
                    Ejecuta el script SQL de migración para crear la tabla <code className="bg-black/30 px-1 rounded">app_settings</code>.
                  </p>
                </CardContent>
              </Card>
            )}

            {activeTab === "security" && hasSettings && (
              <>
                <Card className="bg-zinc-950/60 border-white/10 backdrop-blur-md shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-xl text-white">Privacidad y Seguridad</CardTitle>
                    <CardDescription className="text-zinc-400">
                      Políticas de retención de datos clínicos.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-base font-medium text-zinc-200">Enmascarar identidad real</Label>
                          <p className="text-sm text-zinc-500">Muestra alias en vez de correos por seguridad del paciente.</p>
                        </div>
                        <Switch
                          checked={(getSetting('mask_identity', { enabled: true }) as { enabled: boolean }).enabled}
                          onCheckedChange={(v) => updateLocal('mask_identity', { enabled: v })}
                          className="scale-110"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-base font-medium text-zinc-200">Requerir MFA para Admins</Label>
                          <p className="text-sm text-zinc-500">Autenticación de 2 pasos para entrar al dashboard.</p>
                        </div>
                        <Switch
                          checked={(getSetting('require_mfa', { enabled: true }) as { enabled: boolean }).enabled}
                          onCheckedChange={(v) => updateLocal('require_mfa', { enabled: v })}
                          className="scale-110"
                        />
                      </div>
                    </div>
                    <div className="space-y-3 pt-4 border-t border-white/5">
                      <Label className="text-base font-medium text-zinc-200">Días de retención de Diarios Ciegos</Label>
                      <div className="flex items-center gap-4">
                        <Input
                          type="number"
                          value={(getSetting('retention_days', { days: 30 }) as { days: number }).days}
                          onChange={(e) => updateLocal('retention_days', { days: parseInt(e.target.value) || 30 })}
                          className="w-24 bg-black/40 border-white/10 text-white font-mono"
                        />
                        <span className="text-sm text-zinc-500">Días antes del purgado automático.</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-950/60 border-white/10 backdrop-blur-md shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-xl text-white">Variables de App Móvil</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-base font-medium text-zinc-200">Enlace a API Principal</Label>
                      <Input
                        value={(getSetting('api_url', { url: '' }) as { url: string }).url}
                        onChange={(e) => updateLocal('api_url', { url: e.target.value })}
                        className="bg-black/40 border-white/10 text-blue-400 font-mono"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-base font-medium text-zinc-200">Intervalo de Sync (Milisegundos)</Label>
                      <Input
                        type="number"
                        value={(getSetting('sync_interval', { ms: 15000 }) as { ms: number }).ms}
                        onChange={(e) => updateLocal('sync_interval', { ms: parseInt(e.target.value) || 15000 })}
                        className="bg-black/40 border-white/10 text-white font-mono"
                      />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {activeTab === "notifications" && hasSettings && (
              <Card className="bg-zinc-950/60 border-white/10 backdrop-blur-md shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Notificaciones Push (Aníma App)</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Controla cómo la app se comunica directamente con los usuarios.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4 pt-2">
                    {[
                      { key: 'notif_diary_reminder', label: 'Recordatorios de Diario', desc: 'Notificación si el usuario no ha completado el diario a las 8PM.' },
                      { key: 'notif_progress_alerts', label: 'Alertas de Progreso (Lumi)', desc: 'Mensajes automáticos felicitando rachas de 3+ días.' },
                      { key: 'notif_sos_checkins', label: 'Check-ins Aleatorios (SOS)', desc: 'Notificar a usuarios en rutas "Soledad" con mensajes de validación.' },
                    ].map((notif, i) => (
                      <div key={notif.key} className={`flex items-center justify-between ${i < 2 ? 'border-b border-white/5 pb-4' : ''}`}>
                        <div className="space-y-1">
                          <Label className="text-base font-medium text-zinc-200">{notif.label}</Label>
                          <p className="text-sm text-zinc-500">{notif.desc}</p>
                        </div>
                        <Switch
                          checked={(getSetting(notif.key, { enabled: false }) as { enabled: boolean }).enabled}
                          onCheckedChange={(v) => updateLocal(notif.key, { enabled: v })}
                          className="scale-110"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "database" && (
              <Card className="bg-zinc-950/60 border-white/10 backdrop-blur-md shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-purple-400" />
                    Métricas de Base de Datos (Real)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {dbStats ? (
                    <>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-black/30 p-4 rounded-lg border border-white/5">
                          <p className="text-sm text-zinc-500 mb-1">Total Perfiles</p>
                          <p className="text-2xl font-bold text-white">{dbStats.profiles}</p>
                        </div>
                        <div className="bg-black/30 p-4 rounded-lg border border-white/5">
                          <p className="text-sm text-zinc-500 mb-1">Actividades</p>
                          <p className="text-2xl font-bold text-white">{dbStats.activities}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-zinc-400">Registros Emocionales</span>
                          <span className="text-zinc-300 font-mono">{dbStats.moodLogs} registros</span>
                        </div>
                        <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden">
                          <div className="bg-blue-400 h-full rounded-full transition-all"
                            style={{ width: `${Math.min((dbStats.moodLogs / Math.max(dbStats.profiles, 1)) * 100, 100)}%` }} />
                        </div>
                        <div className="flex justify-between items-center text-sm pt-3">
                          <span className="text-zinc-400">Entradas de Diario</span>
                          <span className="text-zinc-300 font-mono">{dbStats.journals} entradas</span>
                        </div>
                        <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full rounded-full transition-all"
                            style={{ width: `${Math.min((dbStats.journals / Math.max(dbStats.profiles, 1)) * 100, 100)}%` }} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                      <span className="ml-3 text-zinc-400">Consultando base de datos...</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "mobile" && hasSettings && (
              <Card className="bg-zinc-950/60 border-white/10 backdrop-blur-md shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-zinc-400" />
                    Control de Versiones (App Móvil)
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Fuerza actualizaciones en los binarios de iOS y Android.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-base font-medium text-zinc-200">Versión Mínima Requerida</Label>
                    <Input
                      value={(getSetting('min_app_version', { version: '1.0.0' }) as { version: string }).version}
                      onChange={(e) => updateLocal('min_app_version', { version: e.target.value })}
                      className="bg-black/40 border-white/10 text-white font-mono max-w-[200px]"
                    />
                    <p className="text-xs text-zinc-500">Usuarios con versión inferior serán forzados a actualizar.</p>
                  </div>

                  <div className="pt-6 border-t border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base font-medium text-orange-400">Modo Mantenimiento (Global)</Label>
                        <p className="text-sm text-zinc-500">
                          Bloquea la app móvil para todos los usuarios. Presiona "Guardar Configuración" para aplicar.
                        </p>
                      </div>
                      {/* FIX: igual que los demás — solo actualiza local, se guarda con el botón */}
                      <Switch
                        checked={(getSetting('maintenance_mode', { enabled: false }) as { enabled: boolean }).enabled}
                        onCheckedChange={(v) => updateLocal('maintenance_mode', { enabled: v })}
                        className="scale-110 data-[state=checked]:bg-orange-500"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
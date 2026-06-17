"use client"

import { useState, useEffect } from "react"
import { Users, Shield, MoreHorizontal, Search, Loader2, UserCheck, UserX, Clock, Download, EyeOff } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useAdminStore } from "@/store/useAdminStore"
import { motion } from "framer-motion"

interface AppUser {
  id: string
  email: string
  username: string | null
  plan: string | null
  role: string | null
  created_at: string
}

export default function UsersPage() {
  const [search, setSearch] = useState("")
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null)
  const [newRole, setNewRole] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [profileDialogOpen, setProfileDialogOpen] = useState(false)
  const [viewingUser, setViewingUser] = useState<AppUser | null>(null)

  // ── Leer setting de enmascarado ───────────────────────────────────────────
  const { appSettings } = useAdminStore();
  const maskIdentity = (appSettings.find(s => s.key === 'mask_identity')?.value as { enabled?: boolean })?.enabled ?? true;

  // ── Helpers de enmascarado ────────────────────────────────────────────────
  const maskEmail = (email: string | null) => {
    if (!email) return '-';
    if (!maskIdentity) return email;
    const [local, domain] = email.split('@');
    return `${local.slice(0, 2)}***@***.${domain?.split('.').pop() ?? 'com'}`;
  };

  const maskName = (u: AppUser) => {
    const name = u.username ?? u.email?.split('@')[0] ?? 'Anónimo';
    if (!maskIdentity) return name;
    return `${name.slice(0, 2)}${'*'.repeat(Math.max(name.length - 2, 3))}`;
  };

  const loadUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, username, plan, role, created_at")
      .order("created_at", { ascending: false })
    if (error) {
      console.error("Error cargando usuarios:", error.message)
      toast.error("Error cargando usuarios")
    } else {
      setUsers(data ?? [])
    }
    setLoading(false)
  }

  useEffect(() => { loadUsers() }, [])

  const pendingUsers = users.filter(u => u.role === 'pending')
  const regularUsers = users.filter(u => u.role !== 'pending')

  const filtered = regularUsers.filter((u) => {
    const q = search.toLowerCase()
    return (
      u.id.toLowerCase().includes(q) ||
      (u.username ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q)
    )
  })

  const handleApproveAdmin = async (user: AppUser) => {
    setIsSaving(true)
    const { data, error } = await supabase.from('profiles').update({ role: 'admin' }).eq('id', user.id).select()
    if (error) {
      toast.error("Error al aprobar usuario: " + error.message)
    } else if (!data || data.length === 0) {
      toast.error("Permiso denegado: RLS en Supabase impide esta acción.")
    } else {
      toast.success(`${maskName(user)} ahora es administrador`)
      await loadUsers()
    }
    setIsSaving(false)
  }

  const handleRejectAdmin = async (user: AppUser) => {
    setIsSaving(true)
    const { data, error } = await supabase.from('profiles').delete().eq('id', user.id).select()
    if (error) {
      toast.error("Error al rechazar solicitud: " + error.message)
    } else if (!data || data.length === 0) {
      toast.error("Permiso denegado: RLS en Supabase impide esta acción.")
    } else {
      toast.success(`Solicitud rechazada`)
      await loadUsers()
    }
    setIsSaving(false)
  }

  const openRoleDialog = (user: AppUser) => {
    setSelectedUser(user)
    setNewRole(user.role || 'user')
    setRoleDialogOpen(true)
  }

  const handleChangeRole = async () => {
    if (!selectedUser || !newRole) return
    setIsSaving(true)
    const { data, error } = await supabase.from('profiles').update({ role: newRole }).eq('id', selectedUser.id).select()
    if (error) {
      toast.error("Error al cambiar rol: " + error.message)
    } else if (!data || data.length === 0) {
      toast.error("Permiso denegado: RLS en Supabase impide esta acción.")
    } else {
      toast.success(`Rol cambiado a "${newRole}"`)
      setRoleDialogOpen(false)
      await loadUsers()
    }
    setIsSaving(false)
  }

  const handleSuspend = async (user: AppUser) => {
    const { data, error } = await supabase.from('profiles').update({ role: 'suspended' }).eq('id', user.id).select()
    if (error) {
      toast.error("Error al suspender: " + error.message)
    } else if (!data || data.length === 0) {
      toast.error("Permiso denegado: RLS impide esta acción.")
    } else {
      toast.success(`Usuario suspendido`)
      await loadUsers()
    }
  }

  const handleExportCSV = () => {
    const headers = ['ID', 'Nombre', 'Email', 'Rol', 'Ruta', 'Registro']
    const rows = users.map(u => [
      u.id,
      maskIdentity ? maskName(u) : (u.username ?? u.email?.split('@')[0] ?? 'Anónimo'),
      maskIdentity ? maskEmail(u.email) : (u.email || ''),
      u.role || 'user',
      u.plan || 'Sin ruta',
      formatDate(u.created_at),
    ])
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `anima-usuarios-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("CSV descargado exitosamente")
  }

  const handleViewProfile = (user: AppUser) => {
    setViewingUser(user)
    setProfileDialogOpen(true)
  }

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })
    } catch { return "-" }
  }

  const shortId = (id: string) => `USR-${id.slice(0, 6).toUpperCase()}`

  const RoleBadge = ({ role }: { role: string | null }) => {
    switch (role) {
      case "admin": return <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 bg-indigo-500/10"><Shield className="w-3 h-3 mr-1" /> Admin</Badge>
      case "tester": return <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">Tester</Badge>
      case "suspended": return <Badge variant="outline" className="border-red-500/30 text-red-400 bg-red-500/10">Suspendido</Badge>
      case "pending": return <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10"><Clock className="w-3 h-3 mr-1" /> Pendiente</Badge>
      default: return <span className="text-zinc-500 text-sm">Usuario</span>
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-8 h-8 text-indigo-400" />
            Community & Access
          </h2>
          <p className="text-zinc-400 mt-1">
            Gestiona los roles, cuentas de prueba, e infracciones de la comunidad Aníma.
            <br />
            {maskIdentity && (
              <span className="text-xs text-emerald-500/80 flex items-center gap-1 mt-1">
                <EyeOff className="w-3 h-3" /> Identidades enmascaradas activas
              </span>
            )}
          </p>
        </div>
        <Button onClick={handleExportCSV} className="bg-white text-black hover:bg-zinc-200">
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Banner solicitudes pendientes */}
      {pendingUsers.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-amber-500/5 border-amber-500/20 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-amber-400 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Solicitudes de acceso pendientes ({pendingUsers.length})
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Estos usuarios solicitaron acceso como administradores y esperan tu aprobación.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between bg-black/20 rounded-lg p-3 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold">
                        {(user.username || user.email || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{maskName(user)}</p>
                        <p className="text-xs text-zinc-500">{maskEmail(user.email)} · {formatDate(user.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleApproveAdmin(user)} disabled={isSaving} className="bg-emerald-600 text-white hover:bg-emerald-500 h-8">
                        <UserCheck className="mr-1 h-3.5 w-3.5" /> Aprobar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleRejectAdmin(user)} disabled={isSaving} className="text-red-400 hover:text-red-300 hover:bg-red-400/10 h-8">
                        <UserX className="mr-1 h-3.5 w-3.5" /> Rechazar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Tabla principal */}
      <Card className="bg-zinc-950/60 border-white/10 backdrop-blur-md shadow-xl flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl text-white">Directorio de Usuarios</CardTitle>
              <CardDescription className="text-zinc-400">
                Total: <span className="text-white font-medium">{regularUsers.length.toLocaleString()}</span>
                {" · "}
                <span className="text-indigo-400">{regularUsers.filter(u => u.role === "admin").length} admins</span>
                {regularUsers.filter(u => u.role === "suspended").length > 0 && (
                  <> · <span className="text-red-400">{regularUsers.filter(u => u.role === "suspended").length} suspendidos</span></>
                )}
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Buscar por nombre, email o ID..."
                className="pl-9 bg-black/40 border-white/10 text-white focus-visible:ring-indigo-500/50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border border-white/5 bg-black/20 overflow-hidden">
            <Table>
              <TableHeader className="bg-white/5 hover:bg-white/5">
                <TableRow className="border-white/5">
                  <TableHead className="text-zinc-300 font-medium">ID</TableHead>
                  <TableHead className="text-zinc-300 font-medium">Nombre</TableHead>
                  <TableHead className="text-zinc-300 font-medium">Email</TableHead>
                  <TableHead className="text-zinc-300 font-medium">Rol</TableHead>
                  <TableHead className="text-zinc-300 font-medium hidden md:table-cell">Ruta activa</TableHead>
                  <TableHead className="text-zinc-300 font-medium hidden md:table-cell">Registro</TableHead>
                  <TableHead className="text-zinc-300 font-medium text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex items-center justify-center gap-2 text-zinc-500">
                        <Loader2 className="w-4 h-4 animate-spin" /> Cargando usuarios...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-zinc-500">
                      {search ? "Sin resultados para esa búsqueda." : "No hay usuarios registrados aún."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((user) => (
                    <TableRow key={user.id} className="border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell className="font-mono text-xs text-zinc-400">{shortId(user.id)}</TableCell>
                      <TableCell className="font-medium text-zinc-200">{maskName(user)}</TableCell>
                      {/* FIX: email enmascarado según setting */}
                      <TableCell className="text-zinc-400 text-sm">{maskEmail(user.email)}</TableCell>
                      <TableCell><RoleBadge role={user.role} /></TableCell>
                      <TableCell className="hidden md:table-cell">
                        {user.plan ? (
                          <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 bg-indigo-500/10 capitalize">{user.plan}</Badge>
                        ) : (
                          <span className="text-zinc-600 text-sm">Sin ruta</span>
                        )}
                      </TableCell>
                      <TableCell className="text-zinc-400 text-sm hidden md:table-cell">{formatDate(user.created_at)}</TableCell>
                      <TableCell className="text-right flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[180px] bg-zinc-950 border-white/10 text-white">
                            <DropdownMenuLabel>Acciones de Cuenta</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem className="focus:bg-white/10 cursor-pointer" onClick={() => handleViewProfile(user)}>Ver perfil completo</DropdownMenuItem>
                            <DropdownMenuItem className="focus:bg-white/10 cursor-pointer" onClick={() => openRoleDialog(user)}>Modificar Rol</DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/10" />
                            {user.role !== 'suspended' ? (
                              <DropdownMenuItem className="text-red-400 focus:bg-red-400/10 focus:text-red-300 cursor-pointer" onClick={() => handleSuspend(user)}>
                                Suspender Usuario
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem className="text-emerald-400 focus:bg-emerald-400/10 focus:text-emerald-300 cursor-pointer" onClick={() => {
                                supabase.from('profiles').update({ role: 'user' }).eq('id', user.id).then(() => { toast.success('Usuario reactivado'); loadUsers(); })
                              }}>
                                Reactivar Usuario
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog: Cambiar Rol */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-zinc-950 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Modificar Rol</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Cambia el rol de <strong className="text-white">{selectedUser ? maskName(selectedUser) : ''}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Nuevo Rol</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="bg-black/40 border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-950 border-white/10 text-white">
                  <SelectItem value="user">Usuario</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="tester">Tester</SelectItem>
                  <SelectItem value="suspended">Suspendido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRoleDialogOpen(false)} className="text-zinc-400 hover:text-white">Cancelar</Button>
            <Button onClick={handleChangeRole} disabled={isSaving} className="bg-indigo-600 text-white hover:bg-indigo-500">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSaving ? 'Guardando...' : 'Guardar Rol'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Ver Perfil */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="sm:max-w-[450px] bg-zinc-950 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Perfil de Usuario</DialogTitle>
          </DialogHeader>
          {viewingUser && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                  {(viewingUser.username || viewingUser.email || '?')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">{maskName(viewingUser)}</p>
                  <RoleBadge role={viewingUser.role} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 bg-black/20 rounded-lg p-4 border border-white/5">
                <div>
                  <p className="text-xs text-zinc-500">ID</p>
                  <p className="text-sm text-zinc-300 font-mono">{shortId(viewingUser.id)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Email</p>
                  {/* FIX: email enmascarado en modal de perfil */}
                  <p className="text-sm text-zinc-300">{maskEmail(viewingUser.email)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Ruta Activa</p>
                  <p className="text-sm text-zinc-300 capitalize">{viewingUser.plan || 'Sin ruta'}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Registro</p>
                  <p className="text-sm text-zinc-300">{formatDate(viewingUser.created_at)}</p>
                </div>
              </div>
              {/* UUID solo visible si el enmascarado está desactivado */}
              {!maskIdentity && (
                <p className="text-xs text-zinc-600">UUID completo: {viewingUser.id}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ShieldPlus, Mail, Lock, User, FileBadge, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [license, setLicense] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Por favor completa los campos obligatorios.")
      return
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.")
      return
    }

    setError(null)
    setLoading(true)

    try {
      // 1. Crear usuario en Supabase Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      })

      if (authError) {
        if (authError.message.includes('already')) {
          setError("Este correo ya está registrado. Intenta iniciar sesión.")
        } else {
          setError(authError.message)
        }
        return
      }

      if (!data.user) {
        setError("No se pudo crear la cuenta. Intenta de nuevo.")
        return
      }

      // 2. Crear perfil con role = 'pending' (requiere aprobación de un Super Admin)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          email: email.trim(),
          username: name.trim(),
          role: 'pending',
          created_at: new Date().toISOString(),
        }, { onConflict: 'id' })

      if (profileError) {
        console.error('Error creando perfil:', profileError)
        setError("Cuenta creada pero hubo un error con el perfil. Contacta al administrador.")
        return
      }

      // 3. Cerrar sesión inmediatamente (no tiene acceso hasta ser aprobado)
      await supabase.auth.signOut()

      toast.success("Solicitud enviada. Un Super Admin debe aprobar tu cuenta.")
      setTimeout(() => router.push("/login"), 2000)

    } catch {
      setError("Ocurrió un error inesperado. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full min-h-[80vh] w-full items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
        className="w-full max-w-lg"
      >
        <Card className="border-white/10 bg-black/40 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-4 text-center pb-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-purple-500/20 to-pink-500/20 border border-white/10">
              <ShieldPlus className="h-8 w-8 text-purple-400" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold tracking-tight text-white">
                Solicitud de Acceso Clínico
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Únete al equipo administrativo de Aníma. Tu cuenta será revisada y aprobada por un Super Admin.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <Label htmlFor="name" className="text-zinc-300">Nombre Completo *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => { setName(e.target.value); setError(null) }}
                      placeholder="Dra. Gómez"
                      className="pl-10 bg-black/50 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-purple-500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license" className="text-zinc-300">Licencia (Opcional)</Label>
                  <div className="relative">
                    <FileBadge className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                    <Input
                      id="license"
                      value={license}
                      onChange={(e) => setLicense(e.target.value)}
                      placeholder="RMP-123456"
                      className="pl-10 bg-black/50 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-purple-500"
                    />
                  </div>
                </div>
             </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">Correo Institucional *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null) }}
                  placeholder="admin@anima-app.com"
                  className="pl-10 bg-black/50 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-purple-500"
                />
              </div>
            </div>

            <div className="space-y-2">
               <Label htmlFor="password" className="text-zinc-300">Contraseña Segura *</Label>
               <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null) }}
                  placeholder="••••••••••••"
                  className="pl-10 bg-black/50 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-purple-500"
                  onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                />
              </div>
            </div>

            {/* Error inline */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
              >
                {error}
              </motion.p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-4">
            <Button
              onClick={handleRegister}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/25 border-0 h-11"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creando cuenta...
                </span>
              ) : (
                "Enviar Solicitud"
              )}
            </Button>
            <div className="text-center text-sm text-zinc-500">
              ¿Ya tienes una cuenta operativa?{" "}
              <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
                Inicia sesión aquí
              </Link>
            </div>
            <div className="mt-4 text-center text-xs text-zinc-600">
               Todas las cuentas nuevas deben ser aprobadas por un Super Admin antes de obtener acceso.
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}

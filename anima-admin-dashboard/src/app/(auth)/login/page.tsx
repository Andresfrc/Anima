"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Shield, Mail, Lock, Loader2 } from "lucide-react"
import { clearAdminAuthState, supabase } from "@/lib/supabase"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Completa todos los campos.")
      return
    }

    setError(null)
    setLoading(true)
    clearAdminAuthState()

    try {
      // 1. Autenticar con Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (authError) {
        setError("Credenciales incorrectas.")
        return
      }

      // 2. Verificar que tenga role = 'admin' en profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single()

      if (profileError || !profile) {
        await supabase.auth.signOut()
        setError("No se pudo verificar tu perfil.")
        return
      }

      if (profile.role === "pending") {
        await supabase.auth.signOut()
        setError("Tu cuenta está pendiente de aprobación por un Super Admin.")
        return
      }

      if (profile.role !== "admin") {
        await supabase.auth.signOut()
        setError("No tienes permisos de administrador.")
        return
      }

      // 3. Guardar token con flags de seguridad y redirigir
      const secureCookie = window.location.protocol === "https:" ? "; Secure" : ""
      document.cookie = `anima_admin_token=${data.session.access_token}; path=/; max-age=86400; SameSite=Strict${secureCookie}`
      router.push("/")

    } catch (e) {
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
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card className="border-white/10 bg-black/40 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-4 text-center pb-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/20 border border-white/10">
              <Shield className="h-8 w-8 text-blue-400" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold tracking-tight text-white">
                Acceso Administrativo
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Ingresa tus credenciales para administrar la comunidad Aníma.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">Correo Institucional</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@anima-app.com"
                  className="pl-10 bg-black/50 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-blue-500"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null) }}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-zinc-300">Contraseña Segura</Label>
                <Link href="/forgot-password" className="relative z-10 block py-1 text-xs font-medium text-blue-400 hover:text-blue-300">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••••••"
                  className="pl-10 bg-black/50 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-blue-500"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null) }}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
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
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all border-0 h-11"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verificando...
                </span>
              ) : (
                "Ingresar al Panel"
              )}
            </Button>

            <div className="text-center text-sm text-zinc-500">
              ¿No tienes cuenta de administrador?{" "}
              <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium">
                Solicita acceso aquí
              </Link>
            </div>
            <div className="mt-4 text-center text-xs text-zinc-600">
              Protegido por políticas de privacidad de datos clínicos.
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}

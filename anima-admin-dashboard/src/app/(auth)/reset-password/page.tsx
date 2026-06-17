"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Lock, Loader2, ShieldCheck } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Opcional: Podríamos validar que exista una sesión de recuperación activa, 
  // pero Supabase maneja el token en la URL silenciosamente y lo aplica.
  
  const handleUpdatePassword = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      setError("Por favor, completa ambos campos.")
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.")
      return
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.")
      return
    }

    setError(null)
    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        setError("Ocurrió un error al intentar actualizar la contraseña. El enlace podría haber expirado.")
        return
      }

      setSuccess(true)
      
      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        supabase.auth.signOut() // Limpiamos sesión por seguridad
        router.push("/login")
      }, 3000)

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
              <ShieldCheck className="h-8 w-8 text-blue-400" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold tracking-tight text-white">
                Crear Nueva Contraseña
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Ingresa y confirma tu nueva contraseña segura para recuperar el acceso a tu cuenta.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {success ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center space-y-4 text-center p-4 bg-green-500/10 border border-green-500/20 rounded-xl"
              >
                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">¡Contraseña actualizada!</h3>
                  <p className="text-sm text-zinc-300">
                    Tu contraseña ha sido cambiada exitosamente. Redirigiendo al inicio de sesión...
                  </p>
                </div>
              </motion.div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-zinc-300">Nueva Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••••••"
                      className="pl-10 bg-black/50 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-blue-500"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(null) }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-zinc-300">Confirmar Nueva Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••••••"
                      className="pl-10 bg-black/50 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-blue-500"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(null) }}
                      onKeyDown={(e) => e.key === "Enter" && handleUpdatePassword()}
                    />
                  </div>
                </div>
              </>
            )}

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

          {!success && (
            <CardFooter className="flex flex-col gap-4 pt-4">
              <Button
                onClick={handleUpdatePassword}
                disabled={loading}
                className="w-full bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all border-0 h-11"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </span>
                ) : (
                  "Guardar Nueva Contraseña"
                )}
              </Button>
            </CardFooter>
          )}
        </Card>
      </motion.div>
    </div>
  )
}

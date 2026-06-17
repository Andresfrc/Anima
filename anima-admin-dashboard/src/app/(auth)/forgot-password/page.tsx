"use client"

import Link from "next/link"
import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { KeyRound, Mail, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setError("Por favor, ingresa tu correo electrónico.")
      return
    }

    setError(null)
    setLoading(true)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) {
        setError("Ocurrió un error al intentar enviar el correo. Verifica tu dirección.")
        return
      }

      setSuccess(true)
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
              <KeyRound className="h-8 w-8 text-blue-400" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold tracking-tight text-white">
                Recuperar Contraseña
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Ingresa el correo asociado a tu cuenta de administrador. Te enviaremos un enlace para restablecer tu contraseña.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {success ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center space-y-4 text-center p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl"
              >
                <CheckCircle2 className="h-10 w-10 text-blue-400" />
                <div>
                  <h3 className="font-semibold text-white mb-1">¡Correo enviado!</h3>
                  <p className="text-sm text-zinc-300">
                    Revisa tu bandeja de entrada o la carpeta de spam para encontrar el enlace de recuperación.
                  </p>
                </div>
              </motion.div>
            ) : (
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
                    onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                  />
                </div>
              </div>
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

          <CardFooter className="flex flex-col gap-4 pt-4">
            {!success && (
              <Button
                onClick={handleResetPassword}
                disabled={loading}
                className="w-full bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all border-0 h-11"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando enlace...
                  </span>
                ) : (
                  "Enviar Enlace de Recuperación"
                )}
              </Button>
            )}

            <div className="text-center w-full mt-2">
              <Link href="/login" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio de sesión
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}

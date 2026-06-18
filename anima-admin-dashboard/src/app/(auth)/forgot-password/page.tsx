"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { KeyRound, Mail, Loader2, ArrowLeft, CheckCircle2, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react"
import { supabase } from "@/lib/supabase"

type Step = "email" | "otp" | "done"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSendCode = async () => {
    if (!email.trim() || !email.includes("@")) {
      setError("Por favor, ingresa un correo electrónico válido.")
      return
    }

    setError(null)
    setLoading(true)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim())

      if (resetError) {
        setError(resetError.message || "Ocurrió un error al enviar el código. Verifica tu dirección.")
        return
      }

      setStep("otp")
    } catch (e) {
      setError("Ocurrió un error inesperado. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (code.trim().length < 6 || code.trim().length > 10) {
      setError("El código debe tener entre 6 y 10 dígitos.")
      return
    }
    if (password.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres.")
      return
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.")
      return
    }

    setError(null)
    setLoading(true)

    try {
      // 1. Verificar el código OTP
      const { error: otpError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: "recovery",
      })

      if (otpError) {
        setError("El código es inválido o ha expirado. Solicita uno nuevo.")
        return
      }

      // 2. Con la sesión activa, actualizar la contraseña
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) {
        setError(updateError.message || "Error al actualizar la contraseña.")
        return
      }

      // 3. Cerrar sesión temporal por seguridad
      await supabase.auth.signOut()
      setStep("done")
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
        <Card className="border-white/10 bg-black/40 shadow-2xl backdrop-blur-xl overflow-hidden">
          <AnimatePresence mode="wait">
            {step === "email" && (
              <motion.div
                key="email-step"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3 }}
              >
                <CardHeader className="space-y-4 text-center pb-6">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/20 border border-white/10">
                    <KeyRound className="h-8 w-8 text-blue-400" />
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="text-2xl font-bold tracking-tight text-white">
                      Recuperar Contraseña
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                      Ingresa tu correo de administrador. Te enviaremos un código de seguridad para restablecer tu cuenta.
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
                        onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                      {error}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex flex-col gap-4 pt-4">
                  <Button
                    onClick={handleSendCode}
                    disabled={loading}
                    className="w-full bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all border-0 h-11"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enviando código...
                      </span>
                    ) : (
                      "Enviar Código de Seguridad"
                    )}
                  </Button>

                  <div className="text-center w-full mt-2">
                    <Link href="/login" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
                      <ArrowLeft className="w-4 h-4" />
                      Volver al inicio de sesión
                    </Link>
                  </div>
                </CardFooter>
              </motion.div>
            )}

            {step === "otp" && (
              <motion.div
                key="otp-step"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
              >
                <CardHeader className="space-y-4 text-center pb-6">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/20 border border-white/10">
                    <CheckCircle2 className="h-8 w-8 text-blue-400" />
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="text-2xl font-bold tracking-tight text-white">
                      Verificar Código
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                      Hemos enviado un código a <span className="text-white font-medium">{email}</span>. Ingresa el código y crea tu nueva contraseña.
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Código OTP */}
                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-zinc-300">Código de Seguridad</Label>
                    <Input
                      id="code"
                      type="text"
                      maxLength={10}
                      placeholder="Ingresa el código"
                      className="bg-black/50 border-white/10 text-white text-center text-lg tracking-[4px] font-semibold focus-visible:ring-blue-500"
                      value={code}
                      onChange={(e) => { setCode(e.target.value.replace(/[^0-9]/g, "")); setError(null) }}
                    />
                  </div>

                  {/* Nueva Contraseña */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-zinc-300">Nueva Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 6 caracteres"
                        className="pl-10 bg-black/50 border-white/10 text-white focus-visible:ring-blue-500"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(null) }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirmar Contraseña */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-zinc-300">Confirmar Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Repite tu contraseña"
                        className="pl-10 bg-black/50 border-white/10 text-white focus-visible:ring-blue-500"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setError(null) }}
                        onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                      {error}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex flex-col gap-4 pt-4">
                  <Button
                    onClick={handleResetPassword}
                    disabled={loading}
                    className="w-full bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all border-0 h-11"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Restableciendo...
                      </span>
                    ) : (
                      "Restablecer Contraseña"
                    )}
                  </Button>

                  <div className="flex justify-between w-full text-sm mt-2 px-1">
                    <button
                      onClick={handleSendCode}
                      disabled={loading}
                      className="text-zinc-400 hover:text-white transition-colors"
                    >
                      Reenviar código
                    </button>
                    <button
                      onClick={() => { setStep("email"); setError(null); setCode("") }}
                      className="text-zinc-400 hover:text-white transition-colors"
                    >
                      Cambiar correo
                    </button>
                  </div>
                </CardFooter>
              </motion.div>
            )}

            {step === "done" && (
              <motion.div
                key="done-step"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <CardHeader className="space-y-4 text-center pb-6">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 border border-green-500/30">
                    <ShieldCheck className="h-8 w-8 text-green-400" />
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="text-2xl font-bold tracking-tight text-white">
                      ¡Contraseña Cambiada!
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                      Tu contraseña ha sido restablecida exitosamente. Ya puedes ingresar al panel administrativo.
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                  <p className="text-sm text-zinc-400 max-w-sm">
                    Por seguridad, se han cerrado todas las sesiones activas asociadas. Usa tus nuevas credenciales para ingresar.
                  </p>
                </CardContent>

                <CardFooter className="pt-2 pb-6">
                  <Button
                    onClick={() => router.push("/login")}
                    className="w-full bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all border-0 h-11"
                  >
                    Iniciar Sesión
                  </Button>
                </CardFooter>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  )
}

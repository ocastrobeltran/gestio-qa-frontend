"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { authService } from "../../services/api"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
import { ArrowLeft, Check } from "lucide-react"
import { useToast } from "../../components/ui/use-toast"

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")
  const [tokenValid, setTokenValid] = useState(true)
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    // In a real app, you would validate the token on the server
    if (!token || token.length < 10) {
      setTokenValid(false)
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      return
    }

    setIsSubmitting(true)

    try {
      await authService.resetPassword(token!, password)
      setIsSubmitted(true)
      toast({
        title: "Contraseña restablecida",
        description: "Tu contraseña ha sido restablecida correctamente.",
      })

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login")
      }, 3000)
    } catch (err: any) {
      console.error("Error:", err)
      setError(err.response?.data?.message || "Error al restablecer la contraseña")
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo restablecer la contraseña. El enlace puede haber expirado.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/leggerLogo1-removebg-preview-MfZddPFvj1or6BF1V7jDr5EB2aJv3R.png"
              alt="Legger Logo"
              className="h-12"
            />
          </div>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">Enlace inválido</CardTitle>
              <CardDescription className="text-center">
                El enlace para restablecer la contraseña es inválido o ha expirado.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild className="mt-4">
                <Link to="/forgot-password">Solicitar nuevo enlace</Link>
              </Button>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Link to="/login" className="text-sm text-primary hover:underline flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al inicio de sesión
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/leggerLogo1-removebg-preview-MfZddPFvj1or6BF1V7jDr5EB2aJv3R.png"
            alt="Legger Logo"
            className="h-12"
          />
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Restablecer Contraseña</CardTitle>
            <CardDescription className="text-center">Crea una nueva contraseña para tu cuenta</CardDescription>
          </CardHeader>
          <CardContent>
            {isSubmitted ? (
              <div className="text-center space-y-4">
                <div className="bg-primary/10 text-primary p-4 rounded-md flex items-center">
                  <Check className="h-5 w-5 mr-2" />
                  <p>Tu contraseña ha sido restablecida correctamente.</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Serás redirigido al inicio de sesión en unos segundos...
                </p>
                <Button asChild className="mt-2">
                  <Link to="/login">Ir al inicio de sesión</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Nueva contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                {error && <div className="text-sm text-destructive">{error}</div>}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Procesando..." : "Restablecer contraseña"}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link to="/login" className="text-sm text-primary hover:underline flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inicio de sesión
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default ResetPasswordPage

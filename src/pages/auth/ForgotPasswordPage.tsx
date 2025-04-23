"use client"

import type React from "react"

import { useState } from "react"
import { Link } from "react-router-dom"
import { authService } from "../../services/api"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
import { ArrowLeft } from "lucide-react"
import { useToast } from "../../components/ui/use-toast"

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await authService.forgotPassword(email)
      setIsSubmitted(true)
      toast({
        title: "Solicitud enviada",
        description: "Si el correo existe, recibirás instrucciones para restablecer tu contraseña.",
      })
    } catch (error) {
      console.error("Error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Hubo un problema al procesar tu solicitud. Inténtalo de nuevo.",
      })
    } finally {
      setIsSubmitting(false)
    }
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
            <CardTitle className="text-2xl font-bold text-center">Recuperar Contraseña</CardTitle>
            <CardDescription className="text-center">
              Ingresa tu correo electrónico para recibir instrucciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSubmitted ? (
              <div className="text-center space-y-4">
                <div className="bg-primary/10 text-primary p-4 rounded-md">
                  <p>Hemos enviado instrucciones para restablecer tu contraseña al correo proporcionado.</p>
                  <p className="mt-2">Revisa tu bandeja de entrada y sigue las instrucciones.</p>
                </div>
                <Button asChild className="mt-4">
                  <Link to="/login">Volver al inicio de sesión</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Enviando..." : "Enviar instrucciones"}
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

export default ForgotPasswordPage

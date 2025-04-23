"use client"

import { Link } from "react-router-dom"
import { Button } from "../components/ui/button"
import { ArrowLeft, Home } from "lucide-react"

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <img
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/leggerLogo1-removebg-preview-MfZddPFvj1or6BF1V7jDr5EB2aJv3R.png"
        alt="Legger Logo"
        className="h-12 mb-8"
      />

      <h1 className="text-6xl font-bold text-primary">404</h1>
      <h2 className="text-2xl font-semibold mt-4 mb-2">Página no encontrada</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        Lo sentimos, la página que estás buscando no existe o ha sido movida.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild>
          <Link to="/">
            <Home className="mr-2 h-4 w-4" />
            Ir al inicio
          </Link>
        </Button>
        <Button variant="outline" asChild onClick={() => window.history.back()}>
          <Link to="#">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver atrás
          </Link>
        </Button>
      </div>
    </div>
  )
}

export default NotFoundPage

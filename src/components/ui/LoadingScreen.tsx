import { cn } from "../../lib/utils"

interface LoadingScreenProps {
  fullScreen?: boolean
}

const LoadingScreen = ({ fullScreen = true }: LoadingScreenProps) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center bg-background",
        fullScreen ? "fixed inset-0 z-50" : "h-full w-full py-12",
      )}
    >
      <div className="flex justify-center">
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/leggerLogo1-removebg-preview-MfZddPFvj1or6BF1V7jDr5EB2aJv3R.png"
          alt="Legger Logo"
          className="h-12 mb-8 animate-pulse"
        />
      </div>

      <div className="loading-dots inline-flex space-x-1">
        <div className="w-3 h-3 bg-primary rounded-full"></div>
        <div className="w-3 h-3 bg-primary rounded-full"></div>
        <div className="w-3 h-3 bg-primary rounded-full"></div>
        <div className="w-3 h-3 bg-primary rounded-full"></div>
      </div>

      <p className="mt-4 text-muted-foreground">Cargando...</p>
    </div>
  )
}

export default LoadingScreen

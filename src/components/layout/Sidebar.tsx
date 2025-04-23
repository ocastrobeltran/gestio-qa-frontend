"use client"

import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { cn } from "../../lib/utils"
import { LayoutDashboard, ClipboardList, Users, BarChart3, X } from "lucide-react"
import { Button } from "../ui/button"

interface SidebarProps {
  mobile?: boolean
  onClose?: () => void
}

const Sidebar = ({ mobile = false, onClose }: SidebarProps) => {
  const { user } = useAuth()
  const location = useLocation()

  const isAdmin = user?.role === "admin"
  // Eliminamos la variable no utilizada

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      current: location.pathname === "/dashboard",
      show: true,
    },
    {
      name: "Proyectos",
      href: "/projects",
      icon: ClipboardList,
      current: location.pathname.startsWith("/projects"),
      show: true,
    },
    {
      name: "Usuarios",
      href: "/users",
      icon: Users,
      current: location.pathname.startsWith("/users"),
      show: isAdmin,
    },
    {
      name: "Reportes",
      href: "/reports",
      icon: BarChart3,
      current: location.pathname.startsWith("/reports"),
      show: true,
    },
  ]

  return (
    <div className="flex flex-col h-full bg-card">
      {mobile && (
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/leggerLogo1-removebg-preview-MfZddPFvj1or6BF1V7jDr5EB2aJv3R.png"
              alt="Legger Logo"
              className="h-8"
            />
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar">
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}

      <div className={cn("flex-shrink-0 flex items-center px-6", !mobile && "h-16 border-b border-border")}>
        {!mobile && (
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/leggerLogo1-removebg-preview-MfZddPFvj1or6BF1V7jDr5EB2aJv3R.png"
            alt="Legger Logo"
            className="h-8"
          />
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4">
        <nav className="flex-1 px-3 space-y-1">
          {navigation
            .filter((item) => item.show)
            .map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  item.current ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted",
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-md",
                )}
              >
                <item.icon
                  className={cn(
                    item.current ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                    "mr-3 flex-shrink-0 h-5 w-5",
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            ))}
        </nav>
      </div>

      <div className="flex-shrink-0 flex border-t border-border p-4">
        <div className="flex items-center">
          <div>
            <p className="text-sm font-medium text-foreground">{user?.full_name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar

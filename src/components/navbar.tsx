import { Camera, MapPin, SlidersHorizontal } from "lucide-react"
import { Link, useRouterState } from "@tanstack/react-router"
import { cn } from "@/lib/utils"

const navItems = [
  { path: "/", label: "Capture", icon: Camera },
  { path: "/saves", label: "Saved", icon: MapPin },
  { path: "/settings", label: "Settings", icon: SlidersHorizontal },
] as const

export function NavBar() {
  const { location } = useRouterState()
  const currentPath = location.pathname

  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t border-border bg-background/90 backdrop-blur-md">
      {navItems.map(({ path, label, icon: Icon }) => {
        const isActive = currentPath === path

        return (
          <Link
            key={path}
            to={path}
            className={cn(
              "flex flex-col items-center gap-1 px-6 py-3 transition-colors duration-150",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5 transition-all duration-150",
                isActive && "stroke-[2.5px]"
              )}
            />
            <span
              className={cn(
                "text-[10px] font-medium tracking-wide uppercase transition-all duration-150",
                isActive ? "opacity-100" : "opacity-0"
              )}
            >
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

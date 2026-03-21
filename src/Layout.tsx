import { type ReactNode } from "react"
import { Outlet } from "@tanstack/react-router"
import { NavBar } from "@/components/navbar"

interface LayoutProps {
  children?: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="relative flex h-svh flex-col overflow-hidden bg-background">
      <main className="flex-1 overflow-hidden pb-[calc(4rem+env(safe-area-inset-bottom))]">
        {children ?? <Outlet />}
      </main>
      <NavBar />
    </div>
  )
}

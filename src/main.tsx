import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@/index.css"
import App from "@/App.tsx"
import SaveList from "@/SaveList.tsx"
import Settings from "@/Settings.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import {
  createRouter,
  createRoute,
  createRootRoute,
  createHashHistory,
  RouterProvider,
} from "@tanstack/react-router"
import { Layout } from "@/Layout"

const hashHistory = createHashHistory()

const rootRoute = createRootRoute({
  component: Layout,
})

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: App,
})

const savesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/saves",
  component: SaveList,
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: Settings,
})

const routeTree = rootRoute.addChildren([homeRoute, savesRoute, settingsRoute])

const router = createRouter({ routeTree, history: hashHistory })

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>
)

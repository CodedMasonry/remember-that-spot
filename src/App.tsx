import { Save } from "lucide-react"
import { Button } from "./components/ui/button"
import { TopBar } from "./topbar"

export function App() {
  return (
    <div className="flex min-h-svh flex-col p-6">
      <TopBar />
      <Button size="lg" className="mt-auto h-[33vh] w-full text-2xl">
        <Save className="size-6" /> Save Location
      </Button>
    </div>
  )
}

export default App

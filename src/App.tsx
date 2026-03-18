import { MapPin } from "lucide-react"
import { Button } from "./components/ui/button"
import { TopBar } from "./topbar"

export function App() {
  return (
    <div className="flex min-h-svh flex-col p-6">
      <TopBar />
      <Button
        size="lg"
        className="mt-auto h-[33vh] w-full text-3xl active:scale-95"
      >
        <MapPin className="size-8" strokeWidth={2.5} /> Save Location
      </Button>
    </div>
  )
}

export default App

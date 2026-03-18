import { MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TopBar } from "@/components/topbar"
import { RecentSave } from "./components/recent-save"

export function App() {
  return (
    <div className="flex min-h-svh flex-col p-6">
      <TopBar />
      <div className="mt-auto grid grid-cols-1 gap-4">
        <RecentSave />
        <RecentSave />
        <RecentSave />
      </div>
      <Button
        size="lg"
        className="mt-8 h-[33vh] w-full text-3xl font-semibold active:scale-[0.98]"
      >
        <MapPin className="size-8" strokeWidth={2.5} /> Save Location
      </Button>
    </div>
  )
}

export default App

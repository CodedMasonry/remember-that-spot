import { MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TopBar } from "@/components/topbar"
import { RecentSave } from "./components/recent-save"
import { Separator } from "./components/ui/separator"

export function App() {
  return (
    <div className="flex min-h-svh flex-col p-6">
      <TopBar />
      <p className="mt-auto mb-2 text-xs text-muted-foreground">Recent Saves</p>
      <div className="grid grid-cols-1 gap-4">
        {/* US user — imperial, 12-hour clock */}
        <RecentSave
          name="Football Stadium"
          timestamp="2026-03-18T14:32:00-05:00"
          heading_direction="NE"
          distance_away_meters={2092}
          sunrise_timestamp="2026-03-18T07:14:00-05:00"
          sunset_timestamp="2026-03-18T19:27:00-05:00"
          unit_system="imperial"
        />

        {/* EU user — metric, 24-hour clock */}
        <RecentSave
          name="Café de Flore"
          timestamp="2026-03-18T09:05:00+01:00"
          heading_direction="W"
          distance_away_meters={340}
          sunrise_timestamp="2026-03-18T07:28:00+01:00"
          sunset_timestamp="2026-03-18T19:51:00+01:00"
          unit_system="metric"
        />

        {/* Remote location — metric, large distance */}
        <RecentSave
          name="Alpine Base Camp"
          timestamp="2026-03-17T16:45:00+01:00"
          heading_direction="SW"
          distance_away_meters={14800}
          sunrise_timestamp="2026-03-18T06:52:00+01:00"
          sunset_timestamp="2026-03-18T19:05:00+01:00"
          unit_system="metric"
        />
      </div>
      <Separator className="my-4" />
      <Button
        size="lg"
        className="h-[33vh] w-full text-3xl font-semibold active:scale-[0.98]"
      >
        <MapPin className="size-8" strokeWidth={2.5} /> Save Location
      </Button>
    </div>
  )
}

export default App

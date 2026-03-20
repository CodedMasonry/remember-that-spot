import { useState, useEffect, useRef } from "react"
import { MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TopBar } from "@/components/topbar"
import { RecentSave } from "./components/recent-save"
import { Separator } from "./components/ui/separator"
import { useSavesStore } from "@/stores/saves-store"
import type { NewSaveRecord, CardinalDirection } from "./types/save"

interface DeviceOrientationEventiOS extends DeviceOrientationEvent {
  requestPermission?: () => Promise<"granted" | "denied">
  webkitCompassHeading?: number
}

function bearingToCardinal(deg: number): CardinalDirection {
  const dirs: CardinalDirection[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
  return dirs[Math.round((((deg % 360) + 360) % 360) / 45) % 8]
}

export function App() {
  const { saves, hydrated, hydrate, add, remove } = useSavesStore()

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [saved, setSaved] = useState<boolean>(false)

  const headingRef = useRef<number | null>(null)

  useEffect(() => {
    hydrate()
  }, [])

  useEffect(() => {
    const handler = (e: DeviceOrientationEvent) => {
      const ios = e as DeviceOrientationEventiOS
      headingRef.current = ios.webkitCompassHeading ?? e.alpha
    }
    window.addEventListener("deviceorientationabsolute", handler)
    window.addEventListener("deviceorientation", handler)
    return () => {
      window.removeEventListener("deviceorientationabsolute", handler)
      window.removeEventListener("deviceorientation", handler)
    }
  }, [])

  async function saveLocation() {
    const event = DeviceOrientationEvent as unknown as DeviceOrientationEventiOS
    if (typeof event.requestPermission === "function") {
      await event.requestPermission()
    }

    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy, altitude } = position.coords
        const heading = headingRef.current

        const newSave: NewSaveRecord = {
          name: `Save ${new Date().toLocaleTimeString()}`,
          timestamp: new Date().toISOString(),
          unit_system: "imperial",

          gps: {
            latitude,
            longitude,
            accuracy,
            altitude,
            heading,
          },

          heading_direction: heading != null ? bearingToCardinal(heading) : "N",
          distance_away_meters: 0,
          sunrise_timestamp: "", // populate from a solar API if needed
          sunset_timestamp: "",
        }

        await add(newSave)
        setLoading(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  return (
    <div className="flex min-h-svh flex-col p-6">
      <TopBar />

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <p className="mt-auto mb-2 text-xs text-muted-foreground">Recent Saves</p>

      {!hydrated ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : saves.length === 0 ? (
        <p className="text-xs text-muted-foreground">No saves yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {saves.map((save) => (
            <RecentSave key={save.id} {...save} onDelete={remove} />
          ))}
        </div>
      )}

      <Separator className="my-4" />

      <Button
        onClick={saveLocation}
        disabled={loading}
        size="lg"
        className="h-[33vh] w-full text-3xl font-semibold active:scale-95"
      >
        <MapPin className="size-8" strokeWidth={2.5} />
        {loading ? "Getting location…" : saved ? "Saved!" : "Save Location"}
      </Button>
    </div>
  )
}

export default App

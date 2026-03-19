import { useState, useEffect, useRef } from "react"
import { MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TopBar } from "@/components/topbar"
import { RecentSave } from "./components/recent-save"
import { Separator } from "./components/ui/separator"

interface DeviceOrientationEventiOS extends DeviceOrientationEvent {
  requestPermission?: () => Promise<"granted" | "denied">
}

export function App() {
  const [location, setLocation] = useState<{
    latitude: number
    longitude: number
    accuracy: number
    altitude: number | null
    heading: number | null
    timestamp: Date
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [saved, setSaved] = useState<boolean>(false)

  const headingRef = useRef<number | null>(null)

  useEffect(() => {
    const handler = (e: DeviceOrientationEvent) => {
      headingRef.current = e.alpha
    }
    window.addEventListener("deviceorientationabsolute", handler)
    return () =>
      window.removeEventListener("deviceorientationabsolute", handler)
  }, [])

  async function saveLocation() {
    // iOS Safari requires permission before DeviceOrientation fires
    const event = DeviceOrientationEvent as unknown as DeviceOrientationEventiOS
    if (typeof event.requestPermission === "function") {
      await event.requestPermission()
    }

    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy, altitude } = position.coords
        const timestamp = new Date(position.timestamp)
        setLocation({
          latitude,
          longitude,
          accuracy,
          altitude,
          heading: headingRef.current,
          timestamp,
        })
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

      {location && (
        <div className="mt-4 space-y-1 rounded-lg border p-4 text-sm">
          <p>
            <span className="font-medium">Lat:</span>{" "}
            {location.latitude.toFixed(6)}
          </p>
          <p>
            <span className="font-medium">Lng:</span>{" "}
            {location.longitude.toFixed(6)}
          </p>
          <p>
            <span className="font-medium">Accuracy:</span>{" "}
            {location.accuracy.toFixed(1)} m
          </p>
          <p>
            <span className="font-medium">Altitude:</span>{" "}
            {location.altitude != null
              ? `${location.altitude.toFixed(1)} m`
              : "N/A"}
          </p>
          <p>
            <span className="font-medium">Heading:</span>{" "}
            {location.heading != null
              ? `${location.heading.toFixed(1)}°`
              : "N/A"}
          </p>
          <p>
            <span className="font-medium">Time:</span>{" "}
            {location.timestamp.toLocaleTimeString()}
          </p>
        </div>
      )}
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <p className="mt-auto mb-2 text-xs text-muted-foreground">Recent Saves</p>
      <div className="grid grid-cols-1 gap-4">
        <RecentSave
          name="Football Stadium"
          timestamp="2026-03-18T14:32:00-05:00"
          heading_direction="NE"
          distance_away_meters={2092}
          sunrise_timestamp="2026-03-18T07:14:00-05:00"
          sunset_timestamp="2026-03-18T19:27:00-05:00"
          unit_system="imperial"
        />
        <RecentSave
          name="Café de Flore"
          timestamp="2026-03-18T09:05:00+01:00"
          heading_direction="W"
          distance_away_meters={340}
          sunrise_timestamp="2026-03-18T07:28:00+01:00"
          sunset_timestamp="2026-03-18T19:51:00+01:00"
          unit_system="metric"
        />
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
        onClick={saveLocation}
        disabled={loading}
        size="lg"
        className="h-[33vh] w-full text-3xl font-semibold active:scale-[0.98]"
      >
        <MapPin className="size-8" strokeWidth={2.5} />
        {loading ? "Getting location…" : saved ? "Saved!" : "Save Location"}
      </Button>
    </div>
  )
}

export default App

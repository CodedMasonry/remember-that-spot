import { useState, useEffect, useRef } from "react"
import { MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TopBar } from "@/components/topbar"
import { RecentSave } from "./components/recent-save"
import { SaveDrawer } from "./components/save-drawer"
import { Separator } from "./components/ui/separator"
import { useSavesStore } from "./stores/saves-store"
import { bearingToCardinal, coordinateLabel } from "./lib/geo"
import type { NewSaveRecord, SaveRecord } from "./types/save"

interface DeviceOrientationEventiOS extends DeviceOrientationEvent {
  requestPermission?: () => Promise<"granted" | "denied">
  webkitCompassHeading?: number
}

export function App() {
  const {
    saves,
    hydrated,
    hydrate,
    add,
    remove,
    labelFor,
    distanceFor,
    setCurrentPosition,
  } = useSavesStore()

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [saved, setSaved] = useState<boolean>(false)
  const [selectedSave, setSelectedSave] = useState<SaveRecord | null>(null)
  const headingRef = useRef<number | null>(null)

  useEffect(() => {
    hydrate()
  }, [])

  useEffect(() => {
    const INTERVAL_MS = 30_000

    function fetchPosition() {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setCurrentPosition({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }),
        () => {},
        {
          enableHighAccuracy: false,
          timeout: 10_000,
          maximumAge: INTERVAL_MS - 1_000,
        }
      )
    }

    fetchPosition()
    const id = setInterval(fetchPosition, INTERVAL_MS)
    return () => clearInterval(id)
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
          name: coordinateLabel(latitude, longitude),
          timestamp: new Date().toISOString(),
          unit_system: "imperial",
          gps: { latitude, longitude, accuracy, altitude, heading },
          heading_direction: heading != null ? bearingToCardinal(heading) : "N",
        }

        await add(newSave)
        setCurrentPosition({ latitude, longitude })
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
            <RecentSave
              key={save.id}
              {...save}
              name={labelFor(save)}
              distance_meters={distanceFor(save)}
              onClick={() => setSelectedSave(save)}
            />
          ))}
        </div>
      )}

      <SaveDrawer
        save={selectedSave}
        displayName={selectedSave ? labelFor(selectedSave) : ""}
        distanceMeters={selectedSave ? distanceFor(selectedSave) : null}
        open={selectedSave !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedSave(null)
        }}
        onDelete={remove}
      />

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

import { useState, useEffect, useRef } from "react"
import { MapPin, Compass } from "lucide-react"
import { RecentSave } from "@/components/recent-save"
import { SaveDrawer } from "@/components/save-drawer"
import { useSavesStore } from "@/stores/saves-store"
import { bearingToCardinal, coordinateLabel } from "@/lib/geo"
import { getLightInfo, getNextGoldenLabel, accuracyInfo } from "@/lib/light"
import { cn } from "@/lib/utils"
import type { NewSaveRecord, SaveRecord } from "@/types/save"

interface DeviceOrientationEventiOS extends DeviceOrientationEvent {
  requestPermission?: () => Promise<"granted" | "denied">
  webkitCompassHeading?: number
}

const RECENT_COUNT = 3

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
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [selectedSave, setSelectedSave] = useState<SaveRecord | null>(null)

  const [livePosition, setLivePosition] = useState<{
    latitude: number
    longitude: number
    accuracy: number
  } | null>(null)

  const [liveHeading, setLiveHeading] = useState<number | null>(null)
  const headingRef = useRef<number | null>(null)
  const lastHeadingUpdate = useRef<number>(0)
  const [now, setNow] = useState(() => new Date())

  const recentSaves = saves.slice(0, RECENT_COUNT)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    function fetchPosition() {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords
          setLivePosition({ latitude, longitude, accuracy })
          setCurrentPosition({ latitude, longitude })
        },
        () => {},
        { enableHighAccuracy: false, maximumAge: 30_000, timeout: 10_000 }
      )
    }

    fetchPosition()
    const id = setInterval(fetchPosition, 30_000)

    function onVisibilityChange() {
      if (document.hidden) clearInterval(id)
      else fetchPosition()
    }
    document.addEventListener("visibilitychange", onVisibilityChange)
    return () => {
      clearInterval(id)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [setCurrentPosition])

  useEffect(() => {
    const handler = (e: DeviceOrientationEvent) => {
      const ios = e as DeviceOrientationEventiOS
      const heading = ios.webkitCompassHeading ?? e.alpha
      headingRef.current = heading
      const t = Date.now()
      if (t - lastHeadingUpdate.current < 1_000) return
      lastHeadingUpdate.current = t
      setLiveHeading(heading)
    }

    function attach() {
      window.addEventListener("deviceorientationabsolute", handler, {
        passive: true,
      })
      window.addEventListener("deviceorientation", handler, { passive: true })
    }
    function detach() {
      window.removeEventListener("deviceorientationabsolute", handler)
      window.removeEventListener("deviceorientation", handler)
    }

    attach()

    function onVisibilityChange() {
      if (document.hidden) detach()
      else attach()
    }
    document.addEventListener("visibilitychange", onVisibilityChange)
    return () => {
      detach()
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [])

  useEffect(() => {
    let id: ReturnType<typeof setInterval>
    function start() {
      id = setInterval(() => setNow(new Date()), 60_000)
    }
    function stop() {
      clearInterval(id)
    }

    start()
    function onVisibilityChange() {
      if (document.hidden) stop()
      else start()
    }
    document.addEventListener("visibilitychange", onVisibilityChange)
    return () => {
      stop()
      document.removeEventListener("visibilitychange", onVisibilityChange)
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
        navigator.vibrate?.([50, 60, 80])
        setTimeout(() => setSaved(false), 2000)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const light = livePosition
    ? getLightInfo(livePosition.latitude, livePosition.longitude, now)
    : null
  const nextGolden = livePosition
    ? getNextGoldenLabel(livePosition.latitude, livePosition.longitude, now)
    : ""
  const accuracy = livePosition ? accuracyInfo(livePosition.accuracy) : null
  const cardinalHeading =
    liveHeading != null ? bearingToCardinal(liveHeading) : null

  const displaySaves = Array.from({ length: RECENT_COUNT }, (_, i) => {
    const reverseIndex = RECENT_COUNT - 1 - i
    return hydrated ? recentSaves[reverseIndex] : undefined
  })

  return (
    <div className="flex h-full flex-col gap-2 px-3 pt-3 pb-2">
      {/* ── Status strip ── */}
      <div className="flex items-stretch gap-2">
        <div
          className={cn(
            "flex flex-1 flex-col justify-center rounded-lg px-3 py-2",
            light?.bgClass ?? "bg-muted/40"
          )}
        >
          <span
            className={cn(
              "text-xs font-semibold",
              light?.colorClass ?? "text-muted-foreground"
            )}
          >
            {light?.label ?? "Locating…"}
          </span>
          <span className="mt-0.5 text-[10px] leading-tight text-muted-foreground">
            {nextGolden || light?.detail || "Waiting for GPS"}
          </span>
        </div>

        <div className="flex min-w-14 flex-col items-center justify-center gap-1 rounded-lg bg-muted/40 px-3 py-2">
          <Compass
            className="size-4 text-muted-foreground transition-transform duration-200"
            style={{
              transform:
                liveHeading != null ? `rotate(${-liveHeading}deg)` : undefined,
            }}
          />
          <span className="text-[10px] font-medium text-foreground tabular-nums">
            {cardinalHeading ?? "—"}
          </span>
        </div>

        <div className="flex min-w-14 flex-col items-center justify-center gap-1 rounded-lg bg-muted/40 px-3 py-2">
          <MapPin className="size-4 text-muted-foreground" />
          <span
            className={cn(
              "text-[10px] font-medium tabular-nums",
              accuracy?.colorClass ?? "text-muted-foreground"
            )}
          >
            {accuracy?.label ?? "—"}
          </span>
        </div>
      </div>

      {/* ── Recent saves ── */}
      <div className="flex flex-col gap-1.5">
        <p className="px-0.5 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
          Recent
        </p>
        <div className="grid grid-cols-1 gap-1.5">
          {displaySaves.map((save, i) => {
            const isLoading = !hydrated

            if (save) {
              return (
                <RecentSave
                  key={save.id}
                  {...save}
                  name={labelFor(save)}
                  distance_meters={distanceFor(save)}
                  onClick={() => setSelectedSave(save)}
                />
              )
            }

            return (
              <div
                key={`placeholder-${i}`}
                className={cn(
                  "h-16 w-full rounded-md border",
                  isLoading
                    ? "animate-pulse border-transparent bg-muted/40"
                    : "border-dashed border-muted/40"
                )}
                aria-hidden
              />
            )
          })}
        </div>
      </div>

      {/* ── Save button ── */}
      <button
        onClick={saveLocation}
        onPointerDown={() => navigator.vibrate?.(10)}
        disabled={loading}
        className={cn(
          "relative flex w-full flex-1 flex-col items-center justify-center gap-3 rounded-2xl",
          "bg-primary text-primary-foreground",
          "transition-all duration-150 select-none",
          "active:scale-[0.985] active:brightness-95",
          "disabled:opacity-60 disabled:active:scale-100",
          saved && "bg-emerald-600"
        )}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.07) 0%, transparent 65%)",
          }}
        />

        <MapPin
          className={cn(
            "transition-all duration-150",
            saved ? "size-10 scale-110" : "size-10",
            loading && "opacity-50"
          )}
          strokeWidth={2}
        />

        <span className="text-[1.2rem] leading-none font-semibold tracking-tight">
          {loading ? "Getting location…" : saved ? "Saved!" : "Save Location"}
        </span>

        {error && (
          <span className="text-xs font-medium text-red-300 opacity-90">
            {error}
          </span>
        )}

        {!loading && !saved && livePosition && (
          <span className="text-[11px] font-medium tabular-nums opacity-40">
            {livePosition.latitude.toFixed(5)},&nbsp;
            {livePosition.longitude.toFixed(5)}
          </span>
        )}
      </button>

      {/* ── Drawer ── */}
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
    </div>
  )
}

export default App

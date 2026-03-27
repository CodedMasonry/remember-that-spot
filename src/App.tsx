import { useState, useEffect, useRef, useCallback } from "react"
import { MapPin, Compass, Navigation, AlertCircle } from "lucide-react"
import { RecentSave } from "@/components/recent-save"
import { SaveDrawer } from "@/components/save-drawer"
import { useSavesStore } from "@/stores/saves-store"
import { bearingToCardinal, coordinateLabel } from "@/lib/geo"
import { getLightInfo, getNextGoldenLabel, accuracyInfo } from "@/lib/light"
import { cn } from "@/lib/utils"
import type { NewSaveRecord, SaveRecord } from "@/types/save"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface DeviceOrientationEventiOS extends DeviceOrientationEvent {
  requestPermission?: () => Promise<"granted" | "denied">
  webkitCompassHeading?: number
}

const RECENT_COUNT = 3
const GPS_STORAGE_KEY = "pwa_gps_authorized"

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

  // ── 1. State ──
  // GPS unlocked is seeded from localStorage so returning users skip the dialog.
  // We never call getCurrentPosition on mount — iOS will silently deny any call
  // that isn't directly inside a user gesture, and that denial has no prompt.
  const [isGpsUnlocked, setIsGpsUnlocked] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem(GPS_STORAGE_KEY) === "true"
  })

  const [showPermissionDialog, setShowPermissionDialog] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem(GPS_STORAGE_KEY) !== "true"
  })

  // "denied" = user tapped the iOS system prompt and chose Don't Allow.
  // We can't fix that in JS — they need to go to Settings.
  const [permissionDenied, setPermissionDenied] = useState(false)

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

  // ── 2. Location Fetching ──
  const fetchPosition = useCallback(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords
        setLivePosition({ latitude, longitude, accuracy })
        setCurrentPosition({ latitude, longitude })
        setError(null)
      },
      (err) => {
        if (!document.hidden) {
          setError(
            err.code === 1 ? "Location denied. Check Settings." : err.message
          )
        }
      },
      { enableHighAccuracy: false, maximumAge: 30_000, timeout: 10_000 }
    )
  }, [setCurrentPosition])

  // ── 3. Effects ──

  useEffect(() => {
    hydrate()
  }, [hydrate])

  // Polling — only once GPS is confirmed unlocked via a real user gesture
  useEffect(() => {
    if (!isGpsUnlocked) return

    fetchPosition()
    const id = setInterval(fetchPosition, 30_000)

    const onVisibilityChange = () => {
      if (document.hidden) clearInterval(id)
      else fetchPosition()
    }

    document.addEventListener("visibilitychange", onVisibilityChange)
    return () => {
      clearInterval(id)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [isGpsUnlocked, fetchPosition])

  // Compass
  useEffect(() => {
    if (!isGpsUnlocked) return

    const handler = (e: DeviceOrientationEvent) => {
      const ios = e as DeviceOrientationEventiOS
      const heading = ios.webkitCompassHeading ?? e.alpha
      headingRef.current = heading
      const t = Date.now()
      if (t - lastHeadingUpdate.current < 500) return
      lastHeadingUpdate.current = t
      setLiveHeading(heading)
    }

    const attach = () => {
      window.addEventListener("deviceorientationabsolute", handler, {
        passive: true,
      })
      window.addEventListener("deviceorientation", handler, { passive: true })
    }
    const detach = () => {
      window.removeEventListener("deviceorientationabsolute", handler)
      window.removeEventListener("deviceorientation", handler)
    }

    attach()
    const onVisibilityChange = () => {
      if (document.hidden) detach()
      else attach()
    }
    document.addEventListener("visibilitychange", onVisibilityChange)
    return () => {
      detach()
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [isGpsUnlocked])

  // Clock
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  // ── 4. Handlers ──

  function handleRequestPermissions() {
    // getCurrentPosition must be the very first call — no await before it.
    // iOS drops the gesture trust context after any microtask yield, and will
    // silently deny without showing a prompt.
    setPermissionDenied(false)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        // GPS granted — now safe to await compass (we're in a callback, not
        // blocking the original gesture).
        try {
          const MoveEvent =
            DeviceOrientationEvent as unknown as DeviceOrientationEventiOS
          if (typeof MoveEvent.requestPermission === "function") {
            await MoveEvent.requestPermission()
          }
        } catch {
          // Compass denied — non-fatal
        }

        localStorage.setItem(GPS_STORAGE_KEY, "true")
        setIsGpsUnlocked(true)
        setShowPermissionDialog(false)
        setError(null)

        const { latitude, longitude, accuracy } = pos.coords
        setLivePosition({ latitude, longitude, accuracy })
        setCurrentPosition({ latitude, longitude })
      },
      (err) => {
        localStorage.removeItem(GPS_STORAGE_KEY)
        if (err.code === 1) {
          // User tapped "Don't Allow" — can only be fixed in Settings.
          setPermissionDenied(true)
        } else {
          setError(err.message)
        }
      },
      { enableHighAccuracy: false, timeout: 15_000 }
    )
  }

  async function saveLocation() {
    if (!isGpsUnlocked) return
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

  // ── 5. Render Helpers ──
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
      {/* iOS PWA Permission Dialog */}
      <Dialog
        open={showPermissionDialog}
        onOpenChange={(open) => {
          // Block dismissal — app is non-functional without location
          if (!open && !isGpsUnlocked) return
          setShowPermissionDialog(open)
        }}
      >
        <DialogContent className="max-w-[90vw] rounded-2xl">
          <DialogHeader>
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Navigation className="size-6" />
            </div>
            <DialogTitle className="text-center text-xl">
              {permissionDenied ? "Location Blocked" : "Enable Location"}
            </DialogTitle>
            <DialogDescription className="text-center text-balance">
              {permissionDenied
                ? "Location access was denied. To fix this, go to:"
                : "To save your spots and use the compass, this app needs access to your GPS and sensors."}
            </DialogDescription>
          </DialogHeader>

          {/* Settings instructions — shown after a denial (err.code === 1) */}
          {permissionDenied && (
            <div className="rounded-xl bg-muted/60 px-4 py-3 text-sm leading-relaxed text-foreground">
              <p className="mb-1 font-semibold">Settings → Safari → Location</p>
              <p className="text-xs text-muted-foreground">
                Set to <strong>Allow</strong> or <strong>Ask</strong>, then tap
                Try Again.
              </p>
              <div className="mt-3 border-t border-border pt-3">
                <p className="mb-1 font-semibold">Or via Privacy:</p>
                <p className="text-xs text-muted-foreground">
                  Settings → Privacy & Security → Location Services → Safari
                  Websites → <strong>While Using</strong>
                </p>
              </div>
            </div>
          )}

          {/* Generic error (non-denial failures) */}
          {error && !permissionDenied && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button
              onClick={handleRequestPermissions}
              className="w-full rounded-xl py-6 text-lg font-semibold"
            >
              {permissionDenied ? "Try Again" : "Allow Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header Status Bar */}
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

      {/* Recent List */}
      <div className="flex flex-col gap-1.5">
        <p className="px-0.5 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
          Recent
        </p>
        <div className="grid grid-cols-1 gap-1.5">
          {displaySaves.map((save, i) =>
            save ? (
              <RecentSave
                key={save.id}
                {...save}
                name={labelFor(save)}
                distance_meters={distanceFor(save)}
                onClick={() => setSelectedSave(save)}
              />
            ) : (
              <div
                key={`placeholder-${i}`}
                className={cn(
                  "h-16 w-full rounded-md border",
                  !hydrated
                    ? "animate-pulse border-transparent bg-muted/40"
                    : "border-dashed border-muted/40"
                )}
              />
            )
          )}
        </div>
      </div>

      {/* Primary Action */}
      <button
        onClick={saveLocation}
        onPointerDown={() => navigator.vibrate?.(10)}
        disabled={loading || !isGpsUnlocked}
        className={cn(
          "relative flex w-full flex-1 flex-col items-center justify-center gap-3 rounded-2xl",
          "bg-primary text-primary-foreground transition-all duration-150 select-none",
          "active:scale-[0.985] active:brightness-95 disabled:opacity-60",
          saved && "bg-emerald-600"
        )}
      >
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

        {error && !showPermissionDialog && (
          <div className="absolute bottom-4 flex items-center gap-1 text-red-200">
            <AlertCircle className="size-3" />
            <span className="text-[10px] font-medium">{error}</span>
          </div>
        )}
      </button>

      {/* Detailed View Drawer */}
      <SaveDrawer
        save={selectedSave}
        displayName={selectedSave ? labelFor(selectedSave) : ""}
        distanceMeters={selectedSave ? distanceFor(selectedSave) : null}
        open={selectedSave !== null}
        onOpenChange={(open) => !open && setSelectedSave(null)}
        onDelete={remove}
      />
    </div>
  )
}

export default App

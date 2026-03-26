import { useState } from "react"
import {
  Copy,
  Check,
  Navigation,
  ExternalLink,
  Trash2,
  Compass,
  MapPin,
} from "lucide-react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"
import { Separator } from "@/components/ui/separator"
import {
  getLightInfo,
  getPhotoTimes,
  formatBearing,
  accuracyInfo,
  isValidDate,
} from "@/lib/light"
import { openInMaps } from "../lib/geo"
import { formatTime, formatDistance } from "../lib/format"
import { cn } from "@/lib/utils"
import type { SaveRecord, UnitSystem } from "../types/save"

interface Props {
  save: SaveRecord | null
  displayName: string
  distanceMeters: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: (id: number) => void
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="pt-4 pb-1.5 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
      {children}
    </p>
  )
}

function Row({
  label,
  value,
  icon,
  valueClass,
}: {
  label: string
  value: string
  icon?: React.ReactNode
  valueClass?: string
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className={cn("text-sm font-medium tabular-nums", valueClass)}>
        {value}
      </p>
    </div>
  )
}

function TimelineRow({
  dot,
  label,
  time,
  badge,
  unitSystem,
}: {
  dot: string
  label: string
  time: Date
  badge?: string
  unitSystem: UnitSystem
}) {
  if (!isValidDate(time)) return null
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <div className={cn("size-2 shrink-0 rounded-full", dot)} />
      <span className="flex-1 text-sm text-muted-foreground">{label}</span>
      {badge && (
        <span className="mr-1.5 text-[10px] font-medium text-muted-foreground/50 tabular-nums">
          {badge}
        </span>
      )}
      <span className="text-sm font-medium tabular-nums">
        {formatTime(time, unitSystem)}
      </span>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function SaveDrawer({
  save,
  displayName,
  distanceMeters,
  open,
  onOpenChange,
  onDelete,
}: Props) {
  const [copied, setCopied] = useState(false)

  if (!save) return null

  const { latitude: lat, longitude: lng } = save.gps
  const today = new Date()

  const photo = getPhotoTimes(today, lat, lng)
  const savedLight = getLightInfo(lat, lng, new Date(save.timestamp))
  const acc = accuracyInfo(save.gps.accuracy)

  function copyCoords() {
    navigator.clipboard
      .writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh]">
        <DrawerHeader className="shrink-0 text-left">
          <DrawerTitle>{displayName}</DrawerTitle>
          <DrawerDescription>
            Saved {new Date(save.timestamp).toLocaleString()}
          </DrawerDescription>
        </DrawerHeader>

        {/* Scroll Container Fixes:
            1. overscroll-contain: stops the "bounce" from triggering a page scroll
            2. snap-y: enables the snapping logic
            3. scroll-pt: ensures the snapping accounts for top padding
        */}
        <div className="snap-y snap-proximity scroll-pt-4 overflow-y-auto overscroll-contain px-4 pb-8">
          {/* ── Location ── */}
          <div className="snap-start">
            <SectionLabel>Location</SectionLabel>
            <Row label="Latitude" value={`${lat.toFixed(6)}°`} />
            <Separator />
            <Row label="Longitude" value={`${lng.toFixed(6)}°`} />
            <Separator />
            <Row
              label="Accuracy"
              value={acc.label}
              valueClass={acc.colorClass}
              icon={<MapPin className="size-3.5" />}
            />
            {save.gps.altitude != null && (
              <>
                <Separator />
                <Row
                  label="Altitude"
                  value={`${save.gps.altitude.toFixed(1)} m`}
                />
              </>
            )}
            <button
              onClick={copyCoords}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-border py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/40 active:bg-muted/60"
            >
              {copied ? (
                <Check className="size-3.5 text-emerald-400" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {copied ? "Copied!" : "Copy coordinates"}
            </button>
          </div>

          {/* ── Navigation ── */}
          <div className="snap-start">
            <SectionLabel>Navigation</SectionLabel>
            <Row
              label="Distance"
              value={formatDistance(distanceMeters, save.unit_system)}
            />
            {save.gps.heading != null && (
              <>
                <Separator />
                <Row
                  label="Heading when saved"
                  value={`${save.gps.heading.toFixed(0)}° ${save.heading_direction}`}
                  icon={<Compass className="size-3.5" />}
                />
              </>
            )}
          </div>

          {/* ── Light today ── */}
          <div className="snap-start">
            <SectionLabel>Light Today</SectionLabel>
            <TimelineRow
              dot="bg-indigo-500"
              label="Nautical dawn"
              time={photo.nauticalDawn}
              unitSystem={save.unit_system}
            />
            <TimelineRow
              dot="bg-blue-400"
              label="Blue hour"
              time={photo.blueHourStart}
              unitSystem={save.unit_system}
            />
            <TimelineRow
              dot="bg-amber-400"
              label="Sunrise"
              time={photo.sunrise}
              badge={formatBearing(photo.sunriseBearing)}
              unitSystem={save.unit_system}
            />
            <TimelineRow
              dot="bg-amber-300"
              label="Golden hour ends"
              time={photo.goldenHourMorningEnd}
              unitSystem={save.unit_system}
            />
            <TimelineRow
              dot="bg-orange-500"
              label="Solar noon"
              time={photo.solarNoon}
              unitSystem={save.unit_system}
            />
            <TimelineRow
              dot="bg-amber-300"
              label="Golden hour starts"
              time={photo.goldenHourEveningStart}
              unitSystem={save.unit_system}
            />
            <TimelineRow
              dot="bg-amber-400"
              label="Sunset"
              time={photo.sunset}
              badge={formatBearing(photo.sunsetBearing)}
              unitSystem={save.unit_system}
            />
            <TimelineRow
              dot="bg-blue-400"
              label="Blue hour ends"
              time={photo.blueHourEnd}
              unitSystem={save.unit_system}
            />
            <TimelineRow
              dot="bg-indigo-500"
              label="Nautical dusk"
              time={photo.nauticalDusk}
              unitSystem={save.unit_system}
            />
          </div>

          {/* ── Conditions when saved ── */}
          <div className="snap-start">
            <SectionLabel>When Saved</SectionLabel>
            <div
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2.5",
                savedLight.bgClass
              )}
            >
              <span
                className={cn("text-sm font-semibold", savedLight.colorClass)}
              >
                {savedLight.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {savedLight.detail}
              </span>
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="mt-5 flex snap-end flex-col gap-2">
            <button
              onClick={() => openInMaps(lat, lng, displayName)}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors active:brightness-90"
            >
              <Navigation className="size-4" />
              Open in Maps
              <ExternalLink className="size-3.5 opacity-60" />
            </button>
            <button
              onClick={() => {
                onDelete(save.id)
                onOpenChange(false)
              }}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-destructive py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 active:bg-destructive/20"
            >
              <Trash2 className="size-4" />
              Delete Save
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

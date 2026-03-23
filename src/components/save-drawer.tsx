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
  getMoonInfo,
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
    <p className="pt-5 pb-1.5 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
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
    <div className="flex items-center justify-between py-2">
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className={cn("text-sm font-medium tabular-nums", valueClass)}>
        {value}
      </p>
    </div>
  )
}

/**
 * A single row in the light timeline. The colored dot gives instant phase context
 * without needing to read the label. `badge` carries secondary info like bearing.
 */
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
      <div className={cn("size-2 flex-shrink-0 rounded-full", dot)} />
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
  const moon = getMoonInfo(today, lat, lng)
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
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{displayName}</DrawerTitle>
          <DrawerDescription>
            Saved {new Date(save.timestamp).toLocaleString()}
          </DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pb-8">
          {/* ── Location ── */}
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
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-border py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/40 active:bg-muted/60"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-400" />
            ) : (
              <Copy className="size-3.5" />
            )}
            {copied ? "Copied!" : "Copy coordinates"}
          </button>

          {/* ── Navigation ── */}
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

          {/* ── Light today ── */}
          {/*
           * Full twilight timeline — everything a photographer needs to plan
           * a shoot at this exact location, for today.
           *
           * Dot colours mirror the light-phase system used throughout the app:
           *   indigo  → nautical twilight (stars visible)
           *   blue    → blue hour (civil twilight)
           *   amber   → golden hour
           *   orange  → solar noon / harsh light
           */}
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

          {/* ── Moon tonight ── */}
          <SectionLabel>Moon Tonight</SectionLabel>
          <div className="flex items-center justify-between py-2">
            <p className="text-sm text-muted-foreground">Phase</p>
            <p className="text-sm font-medium">
              {moon.phaseEmoji} {moon.phaseLabel} · {moon.illumination}%
            </p>
          </div>
          {moon.rise && isValidDate(moon.rise) && (
            <>
              <Separator />
              <Row
                label="Moonrise"
                value={formatTime(moon.rise, save.unit_system)}
              />
            </>
          )}
          {moon.set && isValidDate(moon.set) && (
            <>
              <Separator />
              <Row
                label="Moonset"
                value={formatTime(moon.set, save.unit_system)}
              />
            </>
          )}

          {/* ── Conditions when saved ── */}
          {/*
           * Shows the light phase at the exact moment this spot was pinned.
           * Useful for understanding what you intended to capture (or revisit).
           */}
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

          {/* ── Actions ── */}
          <div className="mt-6 flex flex-col gap-2">
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

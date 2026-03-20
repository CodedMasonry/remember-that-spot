import SunCalc from "suncalc"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"
import { Separator } from "@/components/ui/separator"
import { Sunrise, Sunset } from "lucide-react"
import { formatTime, formatDistance } from "../lib/format"
import type { SaveRecord } from "../types/save"

interface Props {
  save: SaveRecord | null
  displayName: string
  distanceMeters: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: (id: number) => void
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}

export function SaveDrawer({
  save,
  displayName,
  distanceMeters,
  open,
  onOpenChange,
  onDelete,
}: Props) {
  if (!save) return null

  const { sunrise, sunset } = SunCalc.getTimes(
    new Date(),
    save.gps.latitude,
    save.gps.longitude
  )

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{displayName}</DrawerTitle>
          <DrawerDescription>
            {new Date(save.timestamp).toLocaleString()}
          </DrawerDescription>
        </DrawerHeader>

        <div className="space-y-1 px-4 pb-6">
          <Row label="Latitude" value={`${save.gps.latitude.toFixed(6)}°`} />
          <Separator />
          <Row label="Longitude" value={`${save.gps.longitude.toFixed(6)}°`} />
          <Separator />
          <Row label="Accuracy" value={`${save.gps.accuracy.toFixed(1)} m`} />
          <Separator />
          <Row
            label="Altitude"
            value={
              save.gps.altitude != null
                ? `${save.gps.altitude.toFixed(1)} m`
                : "N/A"
            }
          />
          <Separator />
          <Row
            label="Heading"
            value={
              save.gps.heading != null
                ? `${save.gps.heading.toFixed(1)}° ${save.heading_direction}`
                : "N/A"
            }
          />
          <Separator />
          <Row
            label="Distance"
            value={formatDistance(distanceMeters, save.unit_system)}
          />
          <Separator />
          <div className="flex items-center justify-between py-2">
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <Sunrise className="size-4 stroke-amber-500" /> Sunrise
            </p>
            <p className="text-sm font-medium">
              {formatTime(sunrise, save.unit_system)}
            </p>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <Sunset className="size-4 stroke-amber-500" /> Sunset
            </p>
            <p className="text-sm font-medium">
              {formatTime(sunset, save.unit_system)}
            </p>
          </div>
          <Separator />

          <button
            onClick={() => {
              onDelete(save.id)
              onOpenChange(false)
            }}
            className="mt-4 w-full rounded-md border border-destructive py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            Delete Save
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

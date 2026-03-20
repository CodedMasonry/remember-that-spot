import { Button } from "@/components/ui/button"
import {
  ArrowDown,
  ArrowDownLeft,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpLeft,
  ArrowUpRight,
  ChevronRight,
  Compass,
  Sunrise,
  Sunset,
} from "lucide-react"
import SunCalc from "suncalc"
import { Separator } from "./ui/separator"
import type { SaveRecord, CardinalDirection } from "../types/save"

type Direction = CardinalDirection | "N/A"

type Props = Omit<SaveRecord, "id"> & {
  id?: number
  distance_meters: number | null
  onDelete?: (id: number) => void
}

function formatRelativeTime(isoTimestamp: string): string {
  const diff = Date.now() - new Date(isoTimestamp).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr${hours !== 1 ? "s" : ""} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days !== 1 ? "s" : ""} ago`
}

function formatTime(date: Date, unitSystem: "imperial" | "metric"): string {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: unitSystem === "imperial",
  })
}

function formatDistance(
  meters: number | null,
  unitSystem: "imperial" | "metric"
): string {
  if (meters === null) return "—"
  if (unitSystem === "imperial") {
    const miles = meters / 1609.344
    return miles < 0.1
      ? `${Math.round(meters * 3.28084)} ft away`
      : `${miles.toFixed(1)} mi away`
  }
  return meters < 1000
    ? `${Math.round(meters)} m away`
    : `${(meters / 1000).toFixed(1)} km away`
}

export function RecentSave({
  id,
  name,
  timestamp,
  unit_system,
  gps,
  heading_direction,
  distance_meters,
  onDelete,
}: Props) {
  const direction: Direction = gps.heading != null ? heading_direction : "N/A"

  const { sunrise, sunset } = SunCalc.getTimes(
    new Date(),
    gps.latitude,
    gps.longitude
  )

  return (
    <div className="flex">
      <Button
        size="lg"
        variant="outline"
        className="flex w-full flex-col items-start py-7 active:scale-95"
      >
        <div className="flex w-full items-center">
          <p className="truncate font-semibold">{name}</p>
          <p className="ml-auto font-light">{formatRelativeTime(timestamp)}</p>
          <ChevronRight className="ml-2" />
        </div>
        <div className="flex w-full items-center gap-4 text-muted-foreground">
          <p className="flex items-center gap-1 font-light">
            <HeadingIcon direction={direction} />
            {direction}
          </p>
          <Separator orientation="vertical" />
          <p className="font-light">
            {formatDistance(distance_meters, unit_system)}
          </p>
          <Separator orientation="vertical" />
          <p className="flex gap-1 font-light">
            <Sunrise className="stroke-amber-500" />
            {formatTime(sunrise, unit_system)}
          </p>
          <p className="flex gap-1 font-light">
            <Sunset className="stroke-amber-500" />
            {formatTime(sunset, unit_system)}
          </p>
        </div>
      </Button>
    </div>
  )
}

function HeadingIcon({
  direction,
  className,
}: {
  direction: Direction
  className?: string
}) {
  const icons: Record<Direction, React.ElementType> = {
    N: ArrowUp,
    NE: ArrowUpRight,
    E: ArrowRight,
    SE: ArrowDownRight,
    S: ArrowDown,
    SW: ArrowDownLeft,
    W: ArrowLeft,
    NW: ArrowUpLeft,
    "N/A": Compass,
  }
  const IconComponent = icons[direction] ?? Compass
  return <IconComponent strokeWidth={2} className={className} />
}

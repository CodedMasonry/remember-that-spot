import { useRef } from "react"
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
import { formatRelativeTime, formatTime, formatDistance } from "../lib/format"
import type { SaveRecord, CardinalDirection } from "../types/save"

type Direction = CardinalDirection | "N/A"

type Props = Omit<SaveRecord, "id"> & {
  id?: number
  distance_meters: number | null
  onClick?: () => void
  onLongPress?: () => void
  selectionMode?: boolean
  selected?: boolean
  onSelect?: (id: number) => void
}

export function RecentSave({
  id,
  name,
  timestamp,
  unit_system,
  gps,
  heading_direction,
  distance_meters,
  onClick,
  onLongPress,
  selectionMode = false,
  selected = false,
  onSelect,
}: Props) {
  const direction: Direction = gps.heading != null ? heading_direction : "N/A"
  const { sunrise, sunset } = SunCalc.getTimes(
    new Date(),
    gps.latitude,
    gps.longitude
  )
  const pressTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const didLongPress = useRef(false)

  function handlePointerDown() {
    didLongPress.current = false
    if (!selectionMode) {
      pressTimer.current = setTimeout(() => {
        didLongPress.current = true
        onLongPress?.()
        if (id != null) onSelect?.(id)
      }, 500)
    }
  }
  function handlePointerUp() {
    clearTimeout(pressTimer.current)
  }
  function handleClick() {
    if (didLongPress.current) return
    if (selectionMode) {
      if (id != null) onSelect?.(id)
    } else {
      onClick?.()
    }
  }

  return (
    <Button
      size="lg"
      variant={selected ? "secondary" : "outline"}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={handleClick}
      className="flex h-16 w-full flex-col items-start px-2.5 transition-colors select-none active:scale-95"
    >
      <div className="flex w-full items-center">
        <p className="truncate font-semibold">{name}</p>
        <p className="ml-auto font-light">{formatRelativeTime(timestamp)}</p>
        {!selectionMode && <ChevronRight className="ml-2" />}
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

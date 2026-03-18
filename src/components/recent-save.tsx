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
import { Separator } from "./ui/separator"

export function RecentSave() {
  return (
    <div className="flex">
      <Button
        size="lg"
        variant="outline"
        className="flex w-full flex-col items-start py-7 active:scale-[0.99]"
      >
        <div className="flex w-full items-center">
          <p className="font-semibold">Football Stadium</p>
          <p className="ml-auto font-light">2 hrs ago</p>
          <ChevronRight className="ml-2" />
        </div>
        <div className="tex flex w-full items-center gap-4 text-muted-foreground">
          <p className="flex items-center gap-1 font-light">
            <HeadingIcon direction="NE" />
            NE
          </p>
          <Separator orientation="vertical" />
          <p className="font-light">1.3 mi away</p>
          <Separator orientation="vertical" />
          <p className="flex gap-1 font-light">
            <Sunrise className="stroke-amber-500" /> 7:14
          </p>
          <p className="flex gap-1 font-light">
            <Sunset className="stroke-amber-500" /> 18:27
          </p>
        </div>
      </Button>
    </div>
  )
}

type Direction = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW"

function HeadingIcon({
  direction,
  className,
}: {
  direction: Direction
  className?: string
}) {
  const icons: Record<string, React.ElementType> = {
    N: ArrowUp,
    NE: ArrowUpRight,
    E: ArrowRight,
    SE: ArrowDownRight,
    S: ArrowDown,
    SW: ArrowDownLeft,
    W: ArrowLeft,
    NW: ArrowUpLeft,
  }

  const IconComponent = icons[direction] || Compass

  return <IconComponent stroke-width={2} className={className} />
}

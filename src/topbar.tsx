import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "./components/ui/button"
import { Menu } from "@hugeicons/core-free-icons"

export function TopBar() {
  return (
    <div className="flex">
      <Button size="icon-lg" variant="outline">
        <HugeiconsIcon icon={Menu} />
      </Button>
    </div>
  )
}

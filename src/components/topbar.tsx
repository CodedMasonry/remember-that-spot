import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

export function TopBar() {
  return (
    <div className="flex">
      <Button size="icon-lg" variant="outline">
        <Menu />
      </Button>
    </div>
  )
}

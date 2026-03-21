import type { UnitSystem } from "../types/save"
import type { SaveRecord } from "../types/save"

export function formatRelativeTime(isoTimestamp: string): string {
  const diff = Date.now() - new Date(isoTimestamp).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr${hours !== 1 ? "s" : ""} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days !== 1 ? "s" : ""} ago`
}

export function formatTime(date: Date, unitSystem: UnitSystem): string {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: unitSystem === "imperial",
  })
}

export function formatDistance(
  meters: number | null,
  unitSystem: UnitSystem
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

/**
 * Groups saves into day buckets, most recent day first.
 * Each bucket label is a human-readable date string.
 */
export function groupByDay(
  saves: SaveRecord[]
): { label: string; saves: SaveRecord[] }[] {
  const map = new Map<string, SaveRecord[]>()

  for (const save of saves) {
    const date = new Date(save.timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    let label: string
    if (date.toDateString() === today.toDateString()) {
      label = "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      label = "Yesterday"
    } else {
      label = date.toLocaleDateString([], {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    }

    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(save)
  }

  return Array.from(map.entries()).map(([label, saves]) => ({ label, saves }))
}

import type { UnitSystem } from "../types/save"

/**
 * Returns a relative time string from an ISO 8601 timestamp.
 * e.g. "5 min ago", "2 hrs ago", "3 days ago"
 */
export function formatRelativeTime(isoTimestamp: string): string {
  const diff = Date.now() - new Date(isoTimestamp).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr${hours !== 1 ? "s" : ""} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days !== 1 ? "s" : ""} ago`
}

/**
 * Formats a Date object to a locale time string.
 * Uses 12-hour for imperial (US), 24-hour for metric.
 */
export function formatTime(date: Date, unitSystem: UnitSystem): string {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: unitSystem === "imperial",
  })
}

/**
 * Formats a distance in meters to a human-readable string.
 * Returns "—" if meters is null (no position fix yet).
 * Imperial: ft / mi. Metric: m / km.
 */
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

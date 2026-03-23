import type { CardinalDirection } from "../types/save"

const EARTH_RADIUS_METERS = 6_371_000

/**
 * Haversine formula — straight-line distance in meters between two lat/lng points.
 * Accurate to within ~0.5% for typical distances.
 */
export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Converts a compass bearing in degrees (0–360) to the nearest cardinal direction.
 */
export function bearingToCardinal(deg: number): CardinalDirection {
  const dirs: CardinalDirection[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
  return dirs[Math.round((((deg % 360) + 360) % 360) / 45) % 8]
}

/**
 * Formats a lat/lng pair as a human-readable coordinate string.
 * e.g. "37.7749° N, 122.4194° W"
 */
export function coordinateLabel(lat: number, lng: number): string {
  const latDir = lat >= 0 ? "N" : "S"
  const lngDir = lng >= 0 ? "E" : "W"
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`
}

/**
 * Opens the given coordinates in the platform's preferred maps app.
 * iOS → Apple Maps via maps:// URI.
 * Android/other → geo: URI which the OS routes to the user's default maps app
 * (Google Maps, OsmAnd, etc.).
 */
export function openInMaps(
  lat: number,
  lng: number,
  label = "Saved Location"
): void {
  const encoded = encodeURIComponent(label)
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const url = isIOS
    ? `maps://maps.apple.com/?ll=${lat},${lng}&q=${encoded}`
    : `geo:${lat},${lng}?q=${lat},${lng}(${encoded})`
  window.open(url, "_blank")
}

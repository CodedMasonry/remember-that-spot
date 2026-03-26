import SunCalc from "suncalc"
import { bearingToCardinal } from "./geo"

// ── Light phase ───────────────────────────────────────────────────────────────

export type LightPhase =
  | "golden-hour"
  | "blue-hour"
  | "harsh"
  | "soft"
  | "night"

export interface LightInfo {
  phase: LightPhase
  label: string
  detail: string
  colorClass: string
  bgClass: string
}

export function getLightInfo(lat: number, lng: number, now: Date): LightInfo {
  const sun = SunCalc.getPosition(now, lat, lng)
  const alt = sun.altitude * (180 / Math.PI)

  if (alt < -6)
    return {
      phase: "night",
      label: "Night",
      detail: `Sun ${Math.abs(alt).toFixed(1)}° below horizon`,
      colorClass: "text-indigo-400",
      bgClass: "bg-indigo-400/10",
    }
  if (alt < 0)
    return {
      phase: "blue-hour",
      label: "Blue Hour",
      detail: `Sun ${Math.abs(alt).toFixed(1)}° below horizon`,
      colorClass: "text-blue-400",
      bgClass: "bg-blue-400/10",
    }
  if (alt <= 6)
    return {
      phase: "golden-hour",
      label: "Golden Hour",
      detail: `Sun ${alt.toFixed(1)}° above horizon`,
      colorClass: "text-amber-400",
      bgClass: "bg-amber-400/10",
    }
  if (alt <= 20)
    return {
      phase: "soft",
      label: "Soft Light",
      detail: `Sun ${alt.toFixed(1)}° above horizon`,
      colorClass: "text-sky-400",
      bgClass: "bg-sky-400/10",
    }
  return {
    phase: "harsh",
    label: "Harsh Light",
    detail: `Sun ${alt.toFixed(1)}° above horizon`,
    colorClass: "text-orange-400",
    bgClass: "bg-orange-400/10",
  }
}

export function getNextGoldenLabel(
  lat: number,
  lng: number,
  now: Date
): string {
  const today = SunCalc.getTimes(now, lat, lng)
  const tomorrow = SunCalc.getTimes(
    new Date(now.getTime() + 86_400_000),
    lat,
    lng
  )
  const ms = now.getTime()

  const candidates = [
    today.goldenHourEnd,
    today.goldenHour,
    tomorrow.goldenHourEnd,
  ].filter((t) => t.getTime() > ms)

  if (!candidates.length) return ""
  const diffMs = candidates[0].getTime() - ms
  const h = Math.floor(diffMs / 3_600_000)
  const m = Math.floor((diffMs % 3_600_000) / 60_000)
  if (h === 0) return `Golden hour in ${m}m`
  if (h < 12) return `Golden hour in ${h}h ${m}m`
  return ""
}

// ── GPS accuracy ──────────────────────────────────────────────────────────────

export function accuracyInfo(meters: number): {
  label: string
  colorClass: string
} {
  if (meters <= 5)
    return { label: `±${Math.round(meters)}m`, colorClass: "text-emerald-400" }
  if (meters <= 15)
    return { label: `±${Math.round(meters)}m`, colorClass: "text-yellow-400" }
  return { label: `±${Math.round(meters)}m`, colorClass: "text-red-400" }
}

// ── Sun direction ─────────────────────────────────────────────────────────────

/**
 * SunCalc azimuth: radians from south, westward-positive.
 * Converts to compass bearing: degrees from north, clockwise.
 * south=0 → 180°, west=π/2 → 270°, north=±π → 0°, east=-π/2 → 90°
 */
export function azimuthToBearing(azimuthRad: number): number {
  return (azimuthRad * (180 / Math.PI) + 180 + 360) % 360
}

export function sunBearingAt(date: Date, lat: number, lng: number): number {
  return azimuthToBearing(SunCalc.getPosition(date, lat, lng).azimuth)
}

/** "NE · 67°" */
export function formatBearing(bearing: number): string {
  return `${bearingToCardinal(bearing)} · ${Math.round(bearing)}°`
}

// ── Photo times ───────────────────────────────────────────────────────────────

export interface PhotoTimes {
  /** Stars visible / deep twilight */
  nauticalDawn: Date
  /** Civil dawn — blue hour opens */
  blueHourStart: Date
  sunrise: Date
  sunriseBearing: number
  /** Morning golden hour closes */
  goldenHourMorningEnd: Date
  solarNoon: Date
  /** Evening golden hour opens */
  goldenHourEveningStart: Date
  sunset: Date
  sunsetBearing: number
  /** Civil dusk — blue hour closes */
  blueHourEnd: Date
  /** Stars return */
  nauticalDusk: Date
}

export function isValidDate(d: unknown): d is Date {
  return d instanceof Date && !isNaN((d as Date).getTime())
}

export function getPhotoTimes(
  date: Date,
  lat: number,
  lng: number
): PhotoTimes {
  const t = SunCalc.getTimes(date, lat, lng)
  return {
    nauticalDawn: t.nauticalDawn,
    blueHourStart: t.dawn,
    sunrise: t.sunrise,
    sunriseBearing: sunBearingAt(t.sunrise, lat, lng),
    goldenHourMorningEnd: t.goldenHourEnd,
    solarNoon: t.solarNoon,
    goldenHourEveningStart: t.goldenHour,
    sunset: t.sunset,
    sunsetBearing: sunBearingAt(t.sunset, lat, lng),
    blueHourEnd: t.dusk,
    nauticalDusk: t.nauticalDusk,
  }
}

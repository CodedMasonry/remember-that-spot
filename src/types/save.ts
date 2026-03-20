// types/save.ts

export type CardinalDirection =
  | "N"
  | "NE"
  | "E"
  | "SE"
  | "S"
  | "SW"
  | "W"
  | "NW"
export type UnitSystem = "imperial" | "metric"

export interface GpsReading {
  latitude: number
  longitude: number
  accuracy: number // meters
  altitude: number | null // meters above sea level
  heading: number | null // degrees 0–360, true north
}

export interface SaveRecord {
  id: number

  // User-facing
  name: string
  timestamp: string // ISO 8601
  unit_system: UnitSystem

  // GPS snapshot at time of save
  gps: GpsReading

  // Derived / display — computed at save time and stored so
  // they don't need to be recalculated on every render
  heading_direction: CardinalDirection
  distance_away_meters: number
  sunrise_timestamp: string // ISO 8601
  sunset_timestamp: string // ISO 8601
}

// Omit `id` for records that haven't been persisted yet
export type NewSaveRecord = Omit<SaveRecord, "id">

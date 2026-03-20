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
  accuracy: number
  altitude: number | null
  heading: number | null
}

export interface SaveRecord {
  id: number
  name: string
  display_name?: string
  timestamp: string
  unit_system: UnitSystem
  gps: GpsReading
  heading_direction: CardinalDirection
  sunrise_timestamp: string
  sunset_timestamp: string
}

export type NewSaveRecord = Omit<SaveRecord, "id">

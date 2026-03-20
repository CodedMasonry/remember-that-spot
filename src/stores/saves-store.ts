import { create } from "zustand"
import {
  getAllSaves,
  addSave,
  deleteSave,
  updateSave,
  clearAllSaves,
} from "@/lib/db"
import type { SaveRecord, NewSaveRecord } from "../types/save"

/**
 * Haversine formula — returns distance in meters between two lat/lng points.
 */
function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6_371_000 // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

interface CurrentPosition {
  latitude: number
  longitude: number
}

interface SavesStore {
  saves: SaveRecord[]
  hydrated: boolean
  currentPosition: CurrentPosition | null

  /**
   * Update the device's current position. Triggers recomputation of
   * distance_away_meters for all saves in memory.
   */
  setCurrentPosition: (pos: CurrentPosition) => void

  /** Returns the display label for a save — display_name if set, else name. */
  labelFor: (save: SaveRecord) => string

  /** Distance from currentPosition to a save's GPS coords, or null if unknown. */
  distanceFor: (save: SaveRecord) => number | null

  hydrate: () => Promise<void>
  add: (save: NewSaveRecord) => Promise<SaveRecord>
  remove: (id: number) => Promise<void>
  update: (id: number, patch: Partial<NewSaveRecord>) => Promise<void>
  clear: () => Promise<void>
}

export const useSavesStore = create<SavesStore>((set, get) => ({
  saves: [],
  hydrated: false,
  currentPosition: null,

  setCurrentPosition: (pos) => {
    set({ currentPosition: pos })
  },

  labelFor: (save) => save.display_name ?? save.name,

  distanceFor: (save) => {
    const pos = get().currentPosition
    if (!pos) return null
    return haversineMeters(
      pos.latitude,
      pos.longitude,
      save.gps.latitude,
      save.gps.longitude
    )
  },

  hydrate: async () => {
    if (get().hydrated) return
    const saves = await getAllSaves()
    set({ saves, hydrated: true })
  },

  add: async (save) => {
    const id = await addSave(save)
    const record: SaveRecord = { ...save, id }
    set((state) => ({ saves: [record, ...state.saves] }))
    return record
  },

  remove: async (id) => {
    await deleteSave(id)
    set((state) => ({ saves: state.saves.filter((s) => s.id !== id) }))
  },

  update: async (id, patch) => {
    const updated = await updateSave(id, patch)
    set((state) => ({
      saves: state.saves.map((s) => (s.id === id ? updated : s)),
    }))
  },

  clear: async () => {
    await clearAllSaves()
    set({ saves: [] })
  },
}))

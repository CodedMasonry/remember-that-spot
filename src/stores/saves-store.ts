import { create } from "zustand"
import {
  getAllSaves,
  addSave,
  deleteSave,
  updateSave,
  clearAllSaves,
} from "../lib/db"
import { haversineMeters } from "../lib/geo"
import type { SaveRecord, NewSaveRecord } from "../types/save"

interface CurrentPosition {
  latitude: number
  longitude: number
}

interface SavesStore {
  saves: SaveRecord[]
  hydrated: boolean
  currentPosition: CurrentPosition | null
  setCurrentPosition: (pos: CurrentPosition) => void
  labelFor: (save: SaveRecord) => string
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

  setCurrentPosition: (pos) => set({ currentPosition: pos }),

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

import { create } from "zustand"
import {
  getAllSaves,
  addSave,
  deleteSave,
  updateSave,
  clearAllSaves,
} from "@/lib/db"
import type { SaveRecord, NewSaveRecord } from "../types/save"

interface SavesStore {
  saves: SaveRecord[]
  hydrated: boolean

  /** Load all saves from IndexedDB into memory. Call once on app mount. */
  hydrate: () => Promise<void>

  /** Persist a new save and prepend it to the in-memory list. */
  add: (save: NewSaveRecord) => Promise<SaveRecord>

  /** Delete a save by id from both IndexedDB and memory. */
  remove: (id: number) => Promise<void>

  /** Patch fields on an existing save in both IndexedDB and memory. */
  update: (id: number, patch: Partial<NewSaveRecord>) => Promise<void>

  /** Wipe everything — useful for a "clear history" action. */
  clear: () => Promise<void>
}

export const useSavesStore = create<SavesStore>((set, get) => ({
  saves: [],
  hydrated: false,

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

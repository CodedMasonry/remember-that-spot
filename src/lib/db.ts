import { openDB, type DBSchema } from "idb"
import type { SaveRecord, NewSaveRecord } from "@/types/save"

interface SavesDB extends DBSchema {
  saves: {
    key: number
    value: SaveRecord
  }
}

const DB_NAME = "location-saves"
const DB_VERSION = 1
const STORE = "saves" as const

const dbPromise = openDB<SavesDB>(DB_NAME, DB_VERSION, {
  upgrade(db) {
    db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true })
  },
})

export async function getAllSaves(): Promise<SaveRecord[]> {
  const db = await dbPromise
  const saves = await db.getAll(STORE)
  // Most recent first
  return saves.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
}

export async function addSave(save: NewSaveRecord): Promise<number> {
  const db = await dbPromise
  return db.add(STORE, save as SaveRecord)
}

export async function deleteSave(id: number): Promise<void> {
  const db = await dbPromise
  return db.delete(STORE, id)
}

export async function updateSave(
  id: number,
  patch: Partial<NewSaveRecord>
): Promise<SaveRecord> {
  const db = await dbPromise
  const tx = db.transaction(STORE, "readwrite")
  const existing = await tx.store.get(id)
  if (!existing) throw new Error(`Save ${id} not found`)
  const updated: SaveRecord = { ...existing, ...patch }
  await tx.store.put(updated)
  await tx.done
  return updated
}

export async function clearAllSaves(): Promise<void> {
  const db = await dbPromise
  return db.clear(STORE)
}

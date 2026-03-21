import { useState, useEffect } from "react"
import { Trash2, CheckSquare, Square } from "lucide-react"
import { RecentSave } from "@/components/recent-save"
import { SaveDrawer } from "@/components/save-drawer"
import { useSavesStore } from "@/stores/saves-store"
import { groupByDay } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { SaveRecord } from "@/types/save"

export default function SaveList() {
  const { saves, hydrate, remove, labelFor, distanceFor } = useSavesStore()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [selectedSave, setSelectedSave] = useState<SaveRecord | null>(null)

  const groups = groupByDay(saves)
  const allIds = saves.map((s) => s.id)
  const allSelected = selectedIds.size === saves.length && saves.length > 0
  const noneSelected = selectedIds.size === 0

  function enterSelectionMode() {
    setSelectionMode(true)
  }

  function exitSelectionMode() {
    setSelectionMode(false)
    setSelectedIds(new Set())
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function toggleSelectAll() {
    setSelectedIds(allSelected ? new Set() : new Set(allIds))
  }

  async function deleteSelected() {
    for (const id of selectedIds) await remove(id)
    const remaining = saves.length - selectedIds.size
    setSelectedIds(new Set())
    if (remaining === 0) exitSelectionMode()
  }

  return (
    <div className="flex h-full flex-col gap-2 px-3 pt-3 pb-2">
      {/* ── Header strip ── */}
      <div className="flex items-stretch gap-2">
        {/* Title / selection count tile */}
        <div className="flex flex-1 flex-col justify-center rounded-lg bg-muted/40 px-3 py-2">
          <span className="text-xs font-semibold text-foreground">
            {selectionMode
              ? noneSelected
                ? "Select items"
                : `${selectedIds.size} of ${saves.length} selected`
              : "Saved Locations"}
          </span>
          <span className="mt-0.5 text-[10px] leading-tight text-muted-foreground">
            {saves.length === 0
              ? "No saves yet"
              : `${saves.length} location${saves.length === 1 ? "" : "s"}`}
          </span>
        </div>

        {/* Action tile — Cancel in selection mode, hold-hint otherwise */}
        <div className="flex min-w-18 flex-col items-center justify-center rounded-lg bg-muted/40 px-3 py-2">
          {selectionMode ? (
            <button
              onClick={exitSelectionMode}
              className="text-[11px] font-semibold text-muted-foreground active:opacity-60"
            >
              Cancel
            </button>
          ) : (
            <span className="text-center text-[10px] leading-tight text-muted-foreground">
              Hold to
              <br />
              select
            </span>
          )}
        </div>
      </div>

      {/* ── Save list ── */}
      <div className="flex-1 space-y-4 overflow-y-auto">
        {groups.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">No saves yet.</p>
          </div>
        ) : (
          groups.map(({ label, saves: daySaves }) => (
            <section key={label}>
              <p className="mb-1.5 px-0.5 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                {label}
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {daySaves.map((save) => (
                  <RecentSave
                    key={save.id}
                    {...save}
                    name={labelFor(save)}
                    distance_meters={distanceFor(save)}
                    selectionMode={selectionMode}
                    selected={selectedIds.has(save.id)}
                    onSelect={toggleSelect}
                    onLongPress={enterSelectionMode}
                    onClick={() => setSelectedSave(save)}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {/* ── Selection action bar ── */}
      {selectionMode && (
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSelectAll}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-2xl py-4",
              "bg-muted/40 text-sm font-semibold text-foreground",
              "transition-all duration-150 select-none active:scale-[0.985] active:brightness-95"
            )}
          >
            {allSelected ? (
              <>
                <Square className="size-4" /> Deselect All
              </>
            ) : (
              <>
                <CheckSquare className="size-4" /> Select All
              </>
            )}
          </button>

          <button
            disabled={noneSelected}
            onClick={deleteSelected}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-2xl py-4",
              "text-destructive-foreground bg-destructive text-sm font-semibold",
              "transition-all duration-150 select-none active:scale-[0.985] active:brightness-95",
              "disabled:opacity-40 disabled:active:scale-100"
            )}
          >
            <Trash2 className="size-4" />
            Delete{!noneSelected && ` (${selectedIds.size})`}
          </button>
        </div>
      )}

      {/* ── Drawer ── */}
      <SaveDrawer
        save={selectedSave}
        displayName={selectedSave ? labelFor(selectedSave) : ""}
        distanceMeters={selectedSave ? distanceFor(selectedSave) : null}
        open={selectedSave !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedSave(null)
        }}
        onDelete={remove}
      />
    </div>
  )
}

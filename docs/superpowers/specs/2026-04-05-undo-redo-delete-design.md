# Undo/Redo & Obstacle Deletion — Design Spec

**Date:** 2026-04-05
**Status:** Approved

---

## Overview

Add full session undo/redo (Ctrl+Z / Ctrl+Y) and two ways to delete a selected obstacle: the Delete/Backspace key and a × badge on the selection rect corner.

---

## Undo/Redo

### Approach
Snapshot-based. Before every mutating action, the current `{ placed, visits }` slice is pushed onto a `past` stack. Undo restores the top of `past`; redo restores from a `future` stack. No external library required.

### State additions (not persisted to localStorage)
```ts
past:   Array<{ placed: PlacedObstacle[]; visits: Visit[] }>  // capped at 50
future: Array<{ placed: PlacedObstacle[]; visits: Visit[] }>
undo:   () => void
redo:   () => void
```

### Snapshot helper (internal)
A `snapshot()` function called at the top of every mutating action:
1. Deep-copies `placed` and `visits` arrays (shallow array copy — objects themselves are immutable via Zustand's replace pattern, so a spread is sufficient)
2. Pushes onto `past`; trims to 50 entries if exceeded
3. Clears `future`

### Actions that call snapshot()
- `placeObstacle`
- `moveObstacle` (records final drop position only, not intermediate drag positions)
- `rotateObstacle`
- `deleteObstacle`
- `addVisit`
- `updateVisit`
- `deleteVisit`
- `clearAll`

### undo() / redo()
```
undo():
  if past is empty → no-op
  push current { placed, visits } to future
  pop top of past → restore as current state
  runCompliance()

redo():
  if future is empty → no-op
  push current { placed, visits } to past (no trim needed — redo only moves states that were already in history)
  pop top of future → restore as current state
  runCompliance()
```

### Persistence
`past` and `future` are **not** added to the persisted localStorage slice. Undo history is session-only and resets on page reload.

### Keyboard shortcuts
Handled in Canvas.tsx, added to the existing `keydown` listener:
- **Ctrl+Z** → `undo()`
- **Ctrl+Y** or **Ctrl+Shift+Z** → `redo()`
- Guard: skip if focus is on INPUT or TEXTAREA

---

## Obstacle Deletion

### Delete / Backspace key — priority order
1. If `selectedVisitId` is set → delete the selected visit (existing behavior, unchanged)
2. Else if `selectedId` is set → delete the selected obstacle (new)
3. Otherwise → no-op

This prevents accidentally deleting an obstacle while a visit's approach arrow is selected.

### Delete badge
A × button rendered on the Konva canvas as part of ObstacleGroup, visible only when the obstacle is selected (`isSelected === true`).

**Position:** top-right corner of the selection rect — `(drawW/2 + 5, -drawH/2 - 5)` in local obstacle coordinates, outside the draggable Group so it doesn't trigger a drag.

**Appearance:**
- `Circle` radius 9, fill `#1a1a18` (matches obstacle stroke color)
- `Text` "×" centered, white, bold, font size 11
- Cursor: pointer

**Behaviour:** clicking calls `deleteObstacle(placed.id)` via the `onDelete` prop passed down from Canvas.

### New prop on ObstacleGroup
```ts
onDelete: () => void
```

---

## Files to change

| File | Change |
|------|--------|
| `src/store/useStore.ts` | Add `past`, `future`, `undo`, `redo`; add `snapshot()` helper; call it in all mutating actions; exclude from persisted slice |
| `src/components/Canvas.tsx` | Extend keydown handler for Ctrl+Z/Y/Shift+Z and obstacle delete; pass `onDelete` to ObstacleGroup |
| `src/components/ObstacleGroup.tsx` | Accept `onDelete` prop; render × badge when selected |

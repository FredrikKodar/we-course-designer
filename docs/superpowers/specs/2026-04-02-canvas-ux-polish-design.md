# Canvas UX Polish Design

**Date:** 2026-04-02
**Status:** Approved

## Scope

Three small independent UX improvements. Rotation-aware bounds checking is explicitly deferred — POC users are aware of the limitation.

1. Zoom anchors to pointer position
2. clearAll confirmation dialog
3. Draggable number badge

---

## 1. Zoom Anchors to Pointer

**Problem:** `handleWheel` in `Canvas.tsx` calls `setZoom(zoom * delta)` without adjusting pan, so the view drifts away from the cursor on every scroll.

**Fix:** After computing the new zoom, adjust `panX`/`panY` so the world point under the cursor remains fixed:

```
newPanX = pointerX - (pointerX - panX) * (newZoom / zoom)
newPanY = pointerY - (pointerY - panY) * (newZoom / zoom)
```

`stage.getPointerPosition()` provides the cursor position in stage coordinates. Both zoom and pan are updated together in a single `handleWheel` call via `setZoom` + `setPan`.

**File:** `src/components/Canvas.tsx` — `handleWheel` only.

---

## 2. clearAll Confirmation

**Problem:** The Clear button in Topbar calls `clearAll()` immediately with no confirmation, making it easy to accidentally wipe the course.

**Fix:** Wrap the call with `window.confirm()`:

```ts
if (window.confirm('Rensa alla hinder?')) clearAll();
```

No store changes, no new components.

**File:** `src/components/Topbar.tsx` — Clear button `onClick` only.

---

## 3. Draggable Number Badge

**Problem:** Badge position is fixed relative to the obstacle centre. On a crowded canvas, badges overlap each other or the obstacle. `badgeOffX`/`badgeOffY` exist on `PlacedObstacle` and are already persisted, but there is no way to change them in the UI.

**Design:**

- When an obstacle is **selected**, its badge becomes draggable.
- Dragging updates `badgeOffX`/`badgeOffY` in world meters via a new store action.
- When the obstacle is **not selected**, the badge is inert (not draggable).

**Store change:** Add `updateBadgeOffset(id: string, offX: number, offY: number): void` action that maps over `placed` and updates the matching obstacle's `badgeOffX`/`badgeOffY`. The fields are already in the persisted state subset (inside `placed`).

**ObstacleGroup change:** Wrap the badge `<Circle>` and `<Text>` in a `<Group>` positioned at `(badgeSx, badgeSy)`. When `isSelected`, set `draggable` on the Group. On `dragEnd`:

1. Read the Group's current screen position (`node.x()`, `node.y()`)
2. Compute displacement from obstacle screen centre `(sx, sy)` in screen pixels
3. Divide by `scale` to convert to world meters → new `offX`, `offY`
4. Call `updateBadgeOffset(placed.id, offX, offY)`
5. Reset the Konva Group position back to `(badgeSx, badgeSy)` — the store update will re-render at the correct position

The leader line from obstacle centre to badge updates automatically since it reads `badgeSx`/`badgeSy` which are derived from the stored offsets.

**Files:**
- `src/store/useStore.ts` — add `updateBadgeOffset` to interface and implementation
- `src/components/ObstacleGroup.tsx` — wrap badge in draggable Group when selected

---

## File Changelist

| File | Change |
|---|---|
| `src/components/Canvas.tsx` | Fix `handleWheel` to anchor zoom to pointer |
| `src/components/Topbar.tsx` | Add `window.confirm` to Clear button |
| `src/store/useStore.ts` | Add `updateBadgeOffset` action |
| `src/components/ObstacleGroup.tsx` | Wrap badge in draggable Group when selected |

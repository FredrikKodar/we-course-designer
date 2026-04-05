# Undo/Redo & Obstacle Deletion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 50-step session undo/redo (Ctrl+Z/Y) and obstacle deletion via Delete key and a × badge on the selection rect.

**Architecture:** Snapshot-based undo in Zustand — a `snapshot()` helper captures `{ placed, visits }` before each mutating action and pushes it onto a `past` stack (max 50). `undo()`/`redo()` swap states between `past` and `future`. A `×` badge is rendered outside the draggable Group in ObstacleGroup at the top-right corner of the selection rect.

**Tech Stack:** React 18, Zustand, Konva/react-konva, TypeScript

---

## Files changed

| File | What changes |
|------|-------------|
| `src/store/useStore.ts` | Add `past`/`future`/`undo`/`redo` to state; `snapshot()` helper; wire into 8 mutating actions |
| `src/components/Canvas.tsx` | Extend keydown handler for Ctrl+Z/Y and obstacle delete; pass `onDelete` prop |
| `src/components/ObstacleGroup.tsx` | Add `onDelete` prop; render × badge when selected |

---

## Task 1: Add undo/redo state and actions to the store

**Files:**
- Modify: `src/store/useStore.ts`

- [ ] **Step 1: Add `past`, `future`, `undo`, `redo` to `StoreState` interface**

In `src/store/useStore.ts`, add these fields to the `StoreState` interface after the `selectedVisitId` line:

```ts
// Undo/redo (session-only, not persisted)
past: Array<{ placed: PlacedObstacle[]; visits: Visit[] }>;
future: Array<{ placed: PlacedObstacle[]; visits: Visit[] }>;
undo: () => void;
redo: () => void;
```

- [ ] **Step 2: Add initial values in the store creator**

Inside `persist((set, get) => ({`, after `selectedVisitId: null,`, add:

```ts
// Undo/redo
past: [],
future: [],
```

- [ ] **Step 3: Define the `snapshot()` helper inside the persist callback**

Add this function inside `persist((set, get) => {`, before the `return {` (you need to convert the arrow function shorthand to a block body). Place it just before the returned object:

```ts
const snapshot = () => {
  const { past, placed, visits } = get();
  return {
    past: [...past, { placed, visits }].slice(-50) as Array<{ placed: PlacedObstacle[]; visits: Visit[] }>,
    future: [] as Array<{ placed: PlacedObstacle[]; visits: Visit[] }>,
  };
};
```

Note: `placed` and `visits` references are captured by value (array reference). Since Zustand replaces arrays rather than mutating them, these references are stable snapshots — no deep copy needed.

- [ ] **Step 4: Add `undo` and `redo` actions**

Inside the returned object, after `setSelectedVisitId`:

```ts
undo: () => {
  const { past, placed, visits, future } = get();
  if (past.length === 0) return;
  const prev = past[past.length - 1];
  set({
    past: past.slice(0, -1),
    future: [{ placed, visits }, ...future],
    placed: prev.placed,
    visits: prev.visits,
    selectedId: null,
    selectedVisitId: null,
  });
  get().runCompliance();
},

redo: () => {
  const { past, placed, visits, future } = get();
  if (future.length === 0) return;
  const next = future[0];
  set({
    past: [...past, { placed, visits }],
    future: future.slice(1),
    placed: next.placed,
    visits: next.visits,
    selectedId: null,
    selectedVisitId: null,
  });
  get().runCompliance();
},
```

Both clear `selectedId` and `selectedVisitId` to avoid dangling references after state is swapped.

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd /home/fredrik/Documents/dev/Personal_Projects/we-course-designer
npx tsc --noEmit
```

Expected: no errors relating to `past`, `future`, `undo`, `redo`.

- [ ] **Step 6: Commit**

```bash
git add src/store/useStore.ts
git commit -m "feat: add undo/redo state and actions to store"
```

---

## Task 2: Wire `snapshot()` into all mutating actions

**Files:**
- Modify: `src/store/useStore.ts`

The `persist` callback currently uses an arrow-function shorthand. After Task 1 it should already be a block body (to host the `snapshot` function). Each action below needs `...snapshot()` spread into its `set()` call.

- [ ] **Step 1: Update `placeObstacle`**

```ts
placeObstacle: (type, wx, wy) => {
  const { snapToGrid: snap } = get();
  const cx = snap ? Math.round(wx) : wx;
  const cy = snap ? Math.round(wy) : wy;
  const pieces = buildPresetPieces(type, cx, cy);
  set((s) => ({ ...snapshot(), placed: [...s.placed, ...pieces] }));
  get().runCompliance();
},
```

- [ ] **Step 2: Update `moveObstacle`**

```ts
moveObstacle: (id, wx, wy) => {
  const { snapToGrid: snap, placed } = get();
  const ob = placed.find((p) => p.id === id);
  if (!ob) return;
  const cx = wx + ob.w / 2;
  const cy = wy + ob.h / 2;
  const snappedCx = snap ? Math.round(cx) : cx;
  const snappedCy = snap ? Math.round(cy) : cy;
  const nx = snappedCx - ob.w / 2;
  const ny = snappedCy - ob.h / 2;
  set((s) => ({ ...snapshot(), placed: s.placed.map((p) => (p.id === id ? { ...p, x: nx, y: ny } : p)) }));
  get().runCompliance();
},
```

- [ ] **Step 3: Update `rotateObstacle`**

```ts
rotateObstacle: (id, degrees) => {
  const newRot = ((degrees % 360) + 360) % 360;
  set((s) => ({ ...snapshot(), placed: s.placed.map((p) => (p.id === id ? { ...p, rotation: newRot } : p)) }));
  get().runCompliance();
},
```

- [ ] **Step 4: Update `deleteObstacle`**

```ts
deleteObstacle: (id) => {
  set((s) => {
    const removedVisitIds = new Set(s.visits.filter((v) => v.obstacleId === id).map((v) => v.id));
    return {
      ...snapshot(),
      placed: s.placed.filter((p) => p.id !== id),
      visits: s.visits.filter((v) => v.obstacleId !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
      selectedVisitId: removedVisitIds.has(s.selectedVisitId ?? '') ? null : s.selectedVisitId,
    };
  });
  get().runCompliance();
},
```

- [ ] **Step 5: Update `addVisit`**

Snapshot must be taken before both the early-return path and the normal path:

```ts
addVisit: (obstacleId, entryPoint, approachAngle, approachLength) => {
  const { visits } = get();
  const existing = visits.find((v) => v.obstacleId === obstacleId && v.entryPoint === entryPoint);
  if (existing) {
    set((s) => ({
      ...snapshot(),
      visits: s.visits.map((v) =>
        v.id === existing.id ? { ...v, approachAngle, approachLength } : v,
      ),
    }));
    return;
  }
  const maxNum = visits.reduce((max, v) => {
    const n = parseInt(v.num, 10);
    return isNaN(n) ? max : Math.max(max, n);
  }, 0);
  const newVisit: Visit = {
    id: crypto.randomUUID(),
    obstacleId,
    entryPoint,
    num: String(maxNum + 1),
    approachAngle,
    approachLength,
    badgeOffX: 0,
    badgeOffY: -1.5,
  };
  set((s) => ({ ...snapshot(), visits: [...s.visits, newVisit] }));
},
```

- [ ] **Step 6: Update `updateVisit`**

```ts
updateVisit: (id, patch) => {
  set((s) => ({
    ...snapshot(),
    visits: s.visits.map((v) => (v.id === id ? { ...v, ...patch } : v)),
  }));
},
```

- [ ] **Step 7: Update `deleteVisit`**

```ts
deleteVisit: (id) => {
  set((s) => ({
    ...snapshot(),
    visits: s.visits.filter((v) => v.id !== id),
    selectedVisitId: s.selectedVisitId === id ? null : s.selectedVisitId,
  }));
},
```

- [ ] **Step 8: Update `clearAll`**

```ts
clearAll: () => {
  set((s) => ({
    ...snapshot(),
    placed: [],
    visits: [],
    selectedId: null,
    selectedVisitId: null,
    violations: new Map(),
  }));
},
```

- [ ] **Step 9: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 10: Manual smoke test**

Run the dev server (`npm run dev`), place two obstacles, move one, then open the browser console and run:
```js
window.__store = useStore  // store isn't globally exposed, so just check via UI
```
Place an obstacle → move it → confirm the app still works. Undo/redo keyboard wiring comes in Task 3.

- [ ] **Step 11: Commit**

```bash
git add src/store/useStore.ts
git commit -m "feat: wire snapshot() into all mutating store actions"
```

---

## Task 3: Keyboard shortcuts and delete priority in Canvas.tsx

**Files:**
- Modify: `src/components/Canvas.tsx`

- [ ] **Step 1: Subscribe to `deleteObstacle` from the store**

In Canvas.tsx, add this alongside the existing store subscriptions (around line 116–130). `undo` and `redo` are called via `useStore.getState()` inside the keydown handler (same pattern as `deleteVisit` already uses) so no subscription needed for them:

```ts
const deleteObstacle = useStore((s) => s.deleteObstacle);
```

- [ ] **Step 2: Replace the existing `keydown` handler**

The current handler (around line 179) only handles visit deletion. Replace the entire `useEffect` with:

```ts
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
      e.preventDefault();
      useStore.getState().undo();
      return;
    }

    if (
      (e.key === 'y' && (e.ctrlKey || e.metaKey)) ||
      (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey)
    ) {
      e.preventDefault();
      useStore.getState().redo();
      return;
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
      const { selectedVisitId: svId, selectedId: obId } = useStore.getState();
      if (svId) {
        useStore.getState().deleteVisit(svId);
        e.preventDefault();
      } else if (obId) {
        useStore.getState().deleteObstacle(obId);
        e.preventDefault();
      }
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Manual smoke test**

`npm run dev` → place two obstacles → move one → press Ctrl+Z → confirm the obstacle moves back → press Ctrl+Z again → confirm placement is undone → press Ctrl+Y → confirm it's back. Also: select an obstacle → press Delete → confirm it's removed.

- [ ] **Step 5: Commit**

```bash
git add src/components/Canvas.tsx
git commit -m "feat: add Ctrl+Z/Y undo/redo and obstacle Delete key shortcut"
```

---

## Task 4: Delete badge in ObstacleGroup.tsx + wire from Canvas.tsx

Both files are changed together to avoid a TypeScript error between commits (ObstacleGroup requires `onDelete` as soon as it's declared).

**Files:**
- Modify: `src/components/ObstacleGroup.tsx`
- Modify: `src/components/Canvas.tsx`

- [ ] **Step 1: Add `onDelete` to the props interface**

In `ObstacleGroupProps`, add after `onUpdateVisit`:

```ts
onDelete: () => void;
```

And add it to the destructured props in the function signature:

```ts
export default function ObstacleGroup({
  // ... existing props ...
  onDelete,
}: ObstacleGroupProps) {
```

- [ ] **Step 2: Compute the badge screen position**

The badge sits at the top-right corner of the selection rect in local obstacle coordinates: `(drawW/2 + 5, -drawH/2 - 5)`. Since the badge is rendered **outside** the rotated `<Group>`, the local position must be rotated to screen coords manually. Add these after the `handleX`/`handleY` lines:

```ts
const BADGE_R = 9;
const badgeLocalX = drawW / 2 + 5;
const badgeLocalY = -drawH / 2 - 5;
const badgeX = sx + badgeLocalX * Math.cos(rotRad) - badgeLocalY * Math.sin(rotRad);
const badgeY = sy + badgeLocalX * Math.sin(rotRad) + badgeLocalY * Math.cos(rotRad);
```

- [ ] **Step 3: Render the × badge**

Add this block inside the `<>` fragment, after the rotation handle block (end of the return), only when `isSelected`:

```tsx
{/* Delete badge — top-right corner of selection rect */}
{isSelected && (
  <Group
    x={badgeX}
    y={badgeY}
    onClick={(e) => { e.cancelBubble = true; onDelete(); }}
    onTap={(e) => { e.cancelBubble = true; onDelete(); }}
    cursor="pointer"
  >
    <Circle radius={BADGE_R} fill="#1a1a18" />
    <Text
      text="×"
      fontSize={13}
      fontStyle="bold"
      fill="white"
      width={BADGE_R * 2}
      height={BADGE_R * 2}
      x={-BADGE_R}
      y={-BADGE_R}
      align="center"
      verticalAlign="middle"
      listening={false}
    />
  </Group>
)}
```

`cancelBubble` prevents the click from deselecting the obstacle via the stage click handler.

- [ ] **Step 4: Pass `onDelete` to `ObstacleGroup` in Canvas.tsx**

In the `placed.map(...)` block in Canvas.tsx, add `onDelete` to the `<ObstacleGroup>` JSX alongside the existing props:

```tsx
onDelete={() => deleteObstacle(p.id)}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Full manual smoke test**

`npm run dev`:
1. Place three obstacles
2. Select one → click × badge → confirm it disappears, visits for it are gone
3. Press Ctrl+Z → confirm the obstacle is back
4. Press Ctrl+Z again → previous state restored
5. Press Ctrl+Y → redo works
6. Select obstacle → press Delete key → confirm deletion
7. Add a visit (approach arrow) to an obstacle → select the visit → press Delete → confirm visit is deleted, obstacle stays
8. Place obstacles until history > 50 (or just trust the `.slice(-50)`) — no crash

- [ ] **Step 7: Commit**

```bash
git add src/components/ObstacleGroup.tsx src/components/Canvas.tsx
git commit -m "feat: delete badge on selected obstacle, wire onDelete from Canvas"
```

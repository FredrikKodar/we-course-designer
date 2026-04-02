# Canvas UX Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add zoom-to-pointer, clearAll confirmation, and a draggable number badge to the canvas editor.

**Architecture:** Four targeted changes across four files — no new files needed. Each task is independent and can be committed separately. The badge drag builds on existing `badgeOffX`/`badgeOffY` fields already on `PlacedObstacle`.

**Tech Stack:** React 18, Konva / react-konva, Zustand, TypeScript

---

## File Map

| File | Change |
|---|---|
| `src/components/Canvas.tsx` | Fix `handleWheel` zoom math; subscribe to `updateBadgeOffset`; pass `onUpdateBadgeOffset` prop |
| `src/components/Topbar.tsx` | Wrap Clear button `onClick` in `window.confirm` |
| `src/store/useStore.ts` | Add `updateBadgeOffset` action |
| `src/components/ObstacleGroup.tsx` | Add `onUpdateBadgeOffset` prop; wrap badge in draggable `<Group>` |

---

## Task 1: Zoom anchors to pointer

**Files:**
- Modify: `src/components/Canvas.tsx`

- [ ] **Step 1: Replace `handleWheel`**

  Find `handleWheel` (currently lines 171–175). Replace the entire function:

  ```tsx
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const delta = e.evt.deltaY > 0 ? 0.9 : 1.1;
    // Clamp here so pan math uses the actual resulting zoom, not an unclamped value
    const newZoom = Math.min(4, Math.max(0.25, zoom * delta));
    const pointer = e.target.getStage()?.getPointerPosition();
    if (!pointer) {
      setZoom(newZoom);
      return;
    }
    // Keep the world point under the pointer fixed after zoom
    const newPanX = pointer.x - (pointer.x - panX) * (newZoom / zoom);
    const newPanY = pointer.y - (pointer.y - panY) * (newZoom / zoom);
    setZoom(newZoom);
    setPan(newPanX, newPanY);
  };
  ```

- [ ] **Step 2: Verify TypeScript**

  ```bash
  npm run typecheck
  ```

  Expected: no errors.

- [ ] **Step 3: Verify manually**

  ```bash
  npm run dev
  ```

  Place an obstacle. Hover the cursor over it and scroll to zoom. The obstacle should stay under the cursor as the zoom changes. Previously the view would drift toward the top-left.

- [ ] **Step 4: Commit**

  ```bash
  git add src/components/Canvas.tsx
  git commit -m "fix: anchor zoom to pointer position"
  ```

---

## Task 2: clearAll confirmation

**Files:**
- Modify: `src/components/Topbar.tsx`

- [ ] **Step 1: Wrap the Clear button onClick**

  Find the Clear button in `Topbar.tsx`. Change its `onClick`:

  ```tsx
  <button
    className="text-xs px-3 py-1.5 border border-gray-200 rounded-md bg-white text-gray-500 hover:border-red-400 hover:text-red-500 cursor-pointer transition-all"
    onClick={() => { if (window.confirm('Rensa alla hinder?')) clearAll(); }}
  >
    Clear
  </button>
  ```

- [ ] **Step 2: Verify TypeScript**

  ```bash
  npm run typecheck
  ```

  Expected: no errors.

- [ ] **Step 3: Verify manually**

  ```bash
  npm run dev
  ```

  Place some obstacles. Click Clear. A browser confirmation dialog should appear with "Rensa alla hinder?". Click Cancel — obstacles remain. Click Clear again, click OK — obstacles cleared.

- [ ] **Step 4: Commit**

  ```bash
  git add src/components/Topbar.tsx
  git commit -m "feat: confirm before clearing all obstacles"
  ```

---

## Task 3: Add `updateBadgeOffset` to store

**Files:**
- Modify: `src/store/useStore.ts`

- [ ] **Step 1: Add action to `StoreState` interface**

  In the `StoreState` interface, add after `updateObstacleMeta`:

  ```ts
  updateBadgeOffset: (id: string, offX: number, offY: number) => void;
  ```

- [ ] **Step 2: Add action implementation**

  In the `create()` call, add after the `updateObstacleMeta` implementation:

  ```ts
  updateBadgeOffset: (id, offX, offY) => {
    set((s) => ({
      placed: s.placed.map((p) =>
        p.id === id ? { ...p, badgeOffX: offX, badgeOffY: offY } : p,
      ),
    }));
  },
  ```

- [ ] **Step 3: Verify TypeScript**

  ```bash
  npm run typecheck
  ```

  Expected: no errors.

- [ ] **Step 4: Commit**

  ```bash
  git add src/store/useStore.ts
  git commit -m "feat: add updateBadgeOffset store action"
  ```

---

## Task 4: Draggable badge in ObstacleGroup + Canvas wiring

**Files:**
- Modify: `src/components/ObstacleGroup.tsx`
- Modify: `src/components/Canvas.tsx`

- [ ] **Step 1: Add `onUpdateBadgeOffset` to the props interface in `ObstacleGroup.tsx`**

  In the `ObstacleGroupProps` interface, add after `onRotate`:

  ```ts
  onUpdateBadgeOffset: (offX: number, offY: number) => void;
  ```

  Destructure it in the function signature:

  ```tsx
  export default function ObstacleGroup({
    placed,
    def,
    index,
    scale,
    coordCtx,
    isSelected,
    snapToGrid,
    violation,
    onSelect,
    onMove,
    onRotate,
    onUpdateBadgeOffset,
  }: ObstacleGroupProps) {
  ```

- [ ] **Step 2: Replace the badge section with a draggable Group**

  Find the badge section (the `{/* Leader line */}` comment through the end of the `<Text>` element). Replace everything from `{/* Leader line from centre to badge */}` through the closing `</Text>` tag (but NOT the rotation handle section) with:

  ```tsx
  {/* Leader line from centre to badge */}
  <Line
    points={[sx, sy, badgeSx, badgeSy]}
    stroke="rgba(186,117,23,0.35)"
    strokeWidth={1}
    dash={[3, 4]}
  />

  {/* Number badge — draggable when selected */}
  <Group
    x={badgeSx}
    y={badgeSy}
    draggable={isSelected}
    onDragEnd={(e) => {
      const node = e.target;
      onUpdateBadgeOffset((node.x() - sx) / scale, (node.y() - sy) / scale);
      node.position({ x: badgeSx, y: badgeSy });
    }}
  >
    <Circle radius={badgeR} fill={violation ? '#E24B4A' : '#BA7517'} />
    {isSelected && (
      <Circle radius={badgeR + 4} stroke="rgba(186,117,23,0.5)" strokeWidth={2} />
    )}
    <Text
      x={-badgeR}
      y={-badgeR / 2}
      width={badgeR * 2}
      height={badgeR}
      text={placed.sequenceNum || String(index + 1)}
      fontSize={Math.max(8, badgeR)}
      fontFamily="monospace"
      fontStyle="bold"
      fill="#fff"
      align="center"
      verticalAlign="middle"
    />
  </Group>
  ```

  Key changes from the original:
  - The three separate badge elements (`<Circle>`, conditional `<Circle>`, `<Text>`) are now inside a `<Group>` positioned at `(badgeSx, badgeSy)`
  - Inner elements use relative coordinates: circles at `(0,0)` (no x/y props needed), Text at `(-badgeR, -badgeR/2)`
  - `draggable={isSelected}` — only draggable when selected
  - `onDragEnd` converts the Group's screen position back to world-space offset and resets the Konva node

- [ ] **Step 3: Wire `onUpdateBadgeOffset` in `Canvas.tsx`**

  Add the store subscription near the other store subscriptions at the top of the `Canvas` component:

  ```tsx
  const updateBadgeOffset = useStore((s) => s.updateBadgeOffset);
  ```

  Add the prop to the `<ObstacleGroup>` render (after `onRotate`):

  ```tsx
  onUpdateBadgeOffset={(offX, offY) => updateBadgeOffset(p.id, offX, offY)}
  ```

  The full `<ObstacleGroup>` render becomes:

  ```tsx
  <ObstacleGroup
    key={p.id}
    placed={p}
    def={def}
    index={idx}
    scale={scale}
    coordCtx={coordCtx}
    isSelected={p.id === selectedId}
    snapToGrid={snapToGrid}
    violation={violations.get(p.id) || null}
    onSelect={() => selectObstacle(p.id)}
    onMove={(wx, wy) => moveObstacle(p.id, wx, wy)}
    onRotate={(deg) => rotateObstacle(p.id, deg)}
    onUpdateBadgeOffset={(offX, offY) => updateBadgeOffset(p.id, offX, offY)}
  />
  ```

- [ ] **Step 4: Verify TypeScript**

  ```bash
  npm run typecheck
  ```

  Expected: no errors.

- [ ] **Step 5: Verify manually**

  ```bash
  npm run dev
  ```

  1. Place an obstacle and select it
  2. The badge should show a drag cursor on hover
  3. Drag the badge away from the obstacle — the leader line should follow
  4. Deselect the obstacle — badge should be inert (no drag cursor)
  5. Re-select — badge position should be persisted at its dragged location
  6. Reload the page — badge position should survive (persisted in localStorage)

- [ ] **Step 6: Commit**

  ```bash
  git add src/components/ObstacleGroup.tsx src/components/Canvas.tsx
  git commit -m "feat: draggable number badge when obstacle selected"
  ```

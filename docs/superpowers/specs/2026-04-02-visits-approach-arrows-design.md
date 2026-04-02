# Visits & Approach Arrows Design

**Date:** 2026-04-02
**Status:** Approved

## Scope

Part A of the routing system: introduce the Visit data model and render per-Visit approach arrows on the canvas. Part B (RouteSegments — full connected bezier path between obstacles) is explicitly deferred.

---

## 1. Data Model

### Visit (updated)

```ts
type Visit = {
  id: string;
  obstacleId: string;        // references PlacedObstacle.id
  num: string;               // "1", "2a", "11" — string to support letter suffixes
  entryPoint: 'entry' | 'exit';
  approachAngle: number;     // degrees, 0 = up (north), clockwise
  approachLength: number;    // world meters, 0–5 (max clamped on drag)
  badgeOffX: number;         // badge offset from connection dot, world meters (obstacle-local)
  badgeOffY: number;
}
```

### PlacedObstacle (updated)

Remove `sequenceNum: string`, `badgeOffX: number`, `badgeOffY: number`. These move to `Visit`. Keep `note: string` — it is obstacle-level context, not visit-level.

### Store state

`visits: Visit[]` and `selectedVisitId: string | null` are already stubbed in the store. `visits` is added to the persisted state subset (`partialize`). `selectedVisitId` is ephemeral UI state and is NOT persisted (same as `selectedId`).

### Store actions (new)

```ts
addVisit: (obstacleId: string, entryPoint: 'entry' | 'exit', approachAngle: number, approachLength: number) => void;
updateVisit: (id: string, patch: Partial<Pick<Visit, 'num' | 'approachAngle' | 'approachLength' | 'badgeOffX' | 'badgeOffY'>>) => void;
deleteVisit: (id: string) => void;
setSelectedVisitId: (id: string | null) => void;
```

`addVisit` auto-assigns `num` by incrementing the highest existing integer num (e.g. if visits have "1", "2a", "3", next is "4"). `id` is a `crypto.randomUUID()`.

`updateObstacleMeta` loses the `sequenceNum` param — signature becomes `(id: string, note: string) => void`.

---

## 2. Connection Dots

Connection dots mark the obstacle's entry and exit points on the canvas.

**Visibility:** Shown when the obstacle is hovered (`isHovered` prop on ObstacleGroup). Hidden when not hovered.

**Position:** `ObstacleDef.entry` and `ObstacleDef.exit` are defined in obstacle-local space (origin = obstacle centre, in world meters). Convert to screen:

```
dotScreenX = sx + (localX * cos(rotRad) - localY * sin(rotRad)) * scale
dotScreenY = sy + (localX * sin(rotRad) + localY * cos(rotRad)) * scale
```

Where `sx, sy` = obstacle centre in screen pixels, `rotRad` = obstacle rotation in radians.

**Appearance:** Filled circle, radius 5px, dark fill (`#333`), white stroke. Entry and exit dots look identical — direction is determined by the `entryPoint` field on Visit.

**Same-position dots:** Some obstacles (e.g. fålla, ring) have entry and exit at the same coordinates. For these, show only one dot; creating a Visit from it always uses `entryPoint: 'entry'`.

**Hover detection:** ObstacleGroup gains `onHoverChange: (hovered: boolean) => void` callback, fired from `onMouseEnter`/`onMouseLeave` on the main obstacle Group. Canvas tracks `hoveredId: string | null` in local React state.

---

## 3. Visit Creation

**Interaction:** Hover obstacle → connection dots appear → drag a dot outward → live preview arrow follows cursor → release to create Visit.

**Drag handling (in Canvas.tsx):**
1. `onMouseDown` on a connection dot → begin Visit drag, record `obstacleId`, `entryPoint`, dot screen position
2. `onMouseMove` on Stage → update preview arrow tip
3. `onMouseUp` on Stage → if drag distance > 0: call `addVisit`; clear drag state

**Approach angle and length from drag:**
```
dx = releaseX - dotX  (screen pixels)
dy = releaseY - dotY
approachLength = min(sqrt(dx²+dy²) / scale, 5)   // clamped to 5m
approachAngle = atan2(dx, -dy) * 180/π            // 0 = up, clockwise (matches rotation convention)
```

The arrow tail is at `(dotX + dx, dotY + dy)` — i.e. the user drags the tail, the tip stays at the dot.

**One Visit per connection point:** If a Visit already exists for `(obstacleId, entryPoint)`, dragging that dot replaces it (calls `updateVisit`) rather than creating a second one.

---

## 4. Approach Arrow Rendering

**Visibility:** Only rendered when `showPath` is true (existing toggle).

**Konva shape:** Use react-konva `<Arrow>` with:
- `points={[tailX, tailY, tipX, tipY]}` — tip at the connection dot
- `stroke` / `fill` — black (`#111`)
- `strokeWidth` — `pathLineWeight`
- `pointerLength` / `pointerWidth` — `pathArrowSize * 6` (px)
- `dash` — `pathLineType === 'dashed' ? [5,4] : pathLineType === 'dotted' ? [2,4] : undefined`

**Tail and tip positions:**
```
tailX = dotScreenX + sin(approachAngleRad) * approachLength * scale
tailY = dotScreenY - cos(approachAngleRad) * approachLength * scale
tipX  = dotScreenX
tipY  = dotScreenY
```

**Tail handle:** Small open circle (radius 5px, white fill, dark stroke) at the tail position, `draggable`. On `onDragEnd`: recompute `approachAngle` and `approachLength` from new handle position, call `updateVisit`. Reset node position (same pattern as badge drag).

**Selection:** Clicking an arrow (or its badge) calls `setSelectedVisitId(visit.id)` and `selectObstacle(visit.obstacleId)`. Selected arrow strokes `#BA7517` instead of `#111`.

**Deletion:** `Delete` key when `selectedVisitId` is set → `deleteVisit(selectedVisitId)`.

---

## 5. Per-Visit Badge

Each Visit renders a number badge, replacing the per-PlacedObstacle badge.

**Default position:** At the connection dot (badgeOffX=0, badgeOffY=0 = dot centre). In practice, the badge offset should be initialised to a small default offset away from the dot so the badge isn't hidden under it — initialise `addVisit` with `badgeOffX: 0, badgeOffY: -1.5` (1.5m above the dot in obstacle-local space).

**Position computation:** Same rotation math as the existing badge:
```
badgeScreenX = dotScreenX + (offX * cos(rotRad) - offY * sin(rotRad)) * scale
badgeScreenY = dotScreenY + (offX * sin(rotRad) + offY * cos(rotRad)) * scale
```

**Leader line:** Dashed amber line from `dotScreen` to `badgeScreen` (same style as current leader line).

**Drag:** Identical to current badge drag, but offset is stored on Visit via `updateVisit` and computed relative to the connection dot.

**Appearance:** Same amber circle with white bold monospace number. If Visit is selected, shows the outer ring highlight.

---

## 6. SequenceList Migration

Replace the PlacedObstacle list with a Visit list.

**Sort order:** Natural sort on `num` (`localeCompare` with `numeric: true`).

**Each row:**
- Inline-editable `num` field (click → text input → Enter/blur saves via `updateVisit`)
- Obstacle label from `OBSTACLES.find(o => o.id === placed.type)?.label`
- Small tag: "entry" or "exit"
- ✕ button → `deleteVisit`

**Drag to reorder:** Reorders the visit array and reassigns `num` as sequential integers ("1", "2", "3"…) preserving letter suffixes on manually-edited nums. Simplest implementation: just update the array order; num values update only if they were auto-assigned integers, otherwise leave them.

**Empty state:** "Hover an obstacle and drag its entry or exit dot to add a visit." when `visits.length === 0`.

---

## 7. PropertiesPanel

Remove the Seq# input field. The `note` field remains. No other changes. When a Visit is selected, `selectedId` is set to the visit's obstacle so the panel shows that obstacle's properties.

---

## File Changelist

| File | Change |
|---|---|
| `src/types.ts` | Add `approachAngle`, `approachLength`, `badgeOffX`, `badgeOffY` to Visit; remove `sequenceNum`, `badgeOffX`, `badgeOffY` from PlacedObstacle |
| `src/store/useStore.ts` | Add `addVisit`, `updateVisit`, `deleteVisit`, `setSelectedVisitId`; update `updateObstacleMeta`; add visits/selectedVisitId to persist |
| `src/components/ObstacleGroup.tsx` | Add `isHovered`, `onHoverChange`, `visits`, `onSelectVisit` props; render connection dots + Arrow shapes + per-Visit badges; remove old badge/sequenceNum rendering |
| `src/components/Canvas.tsx` | Track `hoveredId`; wire Visit creation drag (mousedown on dot → mousemove → mouseup); wire Visit selection and Delete key; subscribe to new store actions |
| `src/components/SequenceList.tsx` | Replace PlacedObstacle list with Visit list; inline num editing; drag reorder |
| `src/components/PropertiesPanel.tsx` | Remove Seq# input; update `updateObstacleMeta` call signature |

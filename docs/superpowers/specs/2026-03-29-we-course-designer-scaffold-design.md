# WE Course Designer — Phase 1 Scaffold Design

**Date:** 2026-03-29
**Scope:** React + Vite project scaffold, store shape, obstacle data, working canvas with arena/grid/draggable obstacles. No routing.

---

## Context

`we-course-designer-v4.html` is a working single-file HTML prototype. This spec covers porting it into a proper React codebase, Phase 1 only. The authoritative obstacle definitions (SVG, dimensions, compliance rules, preset logic) live in `docs/obstacles.js` and are copied verbatim into `src/data/obstacles.js`.

---

## Stack

| Concern | Decision |
|---|---|
| Framework | React 18 + Vite |
| Canvas | Konva.js + react-konva |
| State | Zustand with `persist` middleware |
| Styling | Tailwind CSS |
| Persistence | localStorage (Phase 1 MVP) |

---

## File Structure

All files at repo root (no `ecuestre/` subdirectory — the repo is the app).

```
/
├── CLAUDE.md
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── store/
    │   └── useStore.js
    ├── data/
    │   └── obstacles.js
    ├── utils/
    │   ├── coords.js
    │   ├── compliance.js
    │   ├── presets.js
    │   └── export.js              ← stub
    ├── components/
    │   ├── Topbar.jsx
    │   ├── Sidebar.jsx
    │   ├── Canvas.jsx
    │   ├── ObstacleGroup.jsx
    │   ├── RightPanel.jsx
    │   ├── PropertiesPanel.jsx
    │   ├── SequenceList.jsx
    │   ├── CompliancePanel.jsx
    │   ├── ClassesModal.jsx       ← empty stub
    │   └── PrintPreview.jsx       ← empty stub
    └── styles/
        └── index.css
```

---

## Architecture

### Canvas structure (Option B — chosen)

`Canvas.jsx` is the Stage container and drop target. `ObstacleGroup.jsx` is a separate component for per-obstacle rendering and interaction. No store imports inside `ObstacleGroup` — it receives obstacle data and callbacks as props.

### SVG rendering

Obstacles render via a `useSvgImage(svg, viewBox, pixelW, pixelH)` hook:
- Intrinsic SVG size: `pixelW = placed.w * SCALE`, `pixelH = placed.h * SCALE` (where `SCALE = 20` px/m from `data/obstacles.js`)
- Builds a complete SVG string: `<svg xmlns="..." width="${pixelW}" height="${pixelH}" viewBox="${viewBox}">${svg}</svg>`
- Creates a blob URL, loads into an `HTMLImageElement`
- Memoised in a module-level `Map` keyed by `svg + pixelW + pixelH`
- At render time, the `KonvaImage` is scaled from intrinsic SVG pixels to screen pixels: `scaleX = (placed.w * scale) / pixelW`
- Passed to react-konva `Image`

### Drag-drop placement

Standard HTML5 drag API: sidebar chips are `draggable`, canvas container `div` has `onDragOver` + `onDrop`. Drop handler extracts `obstacleType` from `dataTransfer`, converts `e.clientX/Y` to world coords via `screenToWorld`, calls `placeObstacle`.

---

## Store Shape

```js
{
  // Arena
  arenaW: 60,
  arenaH: 40,

  // Obstacles (active Phase 1)
  placed: [],              // PlacedObstacle[]
  selectedId: null,
  violations: new Map(),   // Map<id, message> — recomputed after every mutation; use .has(id) for boolean checks, .get(id) for message text

  // Display
  showGrid: true,
  snapToGrid: true,
  showPath: true,
  viewMode: 'side',        // 'side' | 'end'

  // Canvas transform
  zoom: 1,
  panX: 0,
  panY: 0,

  // Path style (stored Phase 1, used Phase 2)
  pathLineType: 'dashed',
  pathLineWeight: 1.8,
  pathArrowSize: 1,

  // Routing (stubbed — shape only)
  visits: [],
  segments: [],
  classes: [],
  activeClassIdx: 0,
  selectedVisitId: null,
}
```

**Actions active in Phase 1:**
`placeObstacle`, `moveObstacle`, `rotateObstacle`, `deleteObstacle`, `selectObstacle`, `setArena`, `setShowGrid`, `setSnapToGrid`, `setShowPath`, `setViewMode`, `setZoom`, `setPan`, `setPathStyle`, `runCompliance`, `clearAll`

**localStorage persistence** via `persist` middleware with `partialize` — only persists: `placed`, `arenaW`, `arenaH`, `pathLineType`, `pathLineWeight`, `pathArrowSize`. Excluded: zoom/pan, selectedId, violations (`Map` — not JSON-serialisable, and recomputed on load anyway), routing stubs.

---

## Data Model

### PlacedObstacle
```js
{
  id: string,           // `${Date.now()}_${Math.random()}`
  type: string,         // OBSTACLES[].id
  x: number,           // world position, meters (top-left of bounding box); screen centre = worldToScreen(x + w/2, y + h/2)
  y: number,
  w: number,
  h: number,
  rotation: number,    // degrees
  groupId: string | null,
  badgeOffX: number,   // world units offset from centre
  badgeOffY: number,
}
```

---

## Utilities

### `coords.js`
```js
worldToScreen(wx, wy, { panX, panY, scale, viewMode, arenaH }) → [sx, sy]
screenToWorld(sx, sy, { panX, panY, scale, viewMode, arenaH }) → [wx, wy]
getConnectionPoints(placed, def) → { entry: {x,y}, exit: {x,y} }  // rotation-aware, world coords
```

Side view: `sx = panX + wx * scale`, `sy = panY + wy * scale`
End view: `sx = panX + (arenaH - wy) * scale`, `sy = panY + wx * scale`

### `compliance.js`
Pluggable rule engine. Each rule: `(placed, arenaW, arenaH) => Map<id, message>`.

Phase 1 rules:
- **spacingRule** — centre-to-centre < 6m between obstacles in *different* groups → `"⚠ avstånd < 6 m"` on both
- **boundsRule** — any corner of unrotated bounding box outside arena → `"⚠ utanför banan"`
- **groupRule** — for obstacles sharing a `groupId`, extracts preset type from `groupId` (split on last `_`), looks up `GROUP_RULES[presetType]`, checks pairwise centre-to-centre distance is within `[minDist, maxDist]` → fires automatically when `groupId` is present

### `presets.js`
Thin wrapper over `expandPreset` from `data/obstacles.js`. Stamps each piece with a unique `id` and a shared `groupId = \`${type}_${Date.now()}\`` (format: `{presetType}_{timestamp}` — preset types use hyphens, so split on last `_` to recover the type). For non-preset types returns a single `PlacedObstacle`.

Preset chips (e.g. `tva-tunnor`) do not appear on the canvas as a single entity — the chip drops N individual pieces which are each independently draggable.

---

## Components

### `Topbar.jsx`
- Title: **WE Course Designer**
- Arena label pill (e.g. `60 × 40 m`)
- View toggle: Sideline / Endline
- Buttons: Grid (active state), Path (active state), Fit, Reset Path (stub), Classes & Criteria (opens stub modal), Clear

### `Sidebar.jsx`
- Arena Width / Length inputs → `setArena`
- Toggle rows: Grid, Snap to grid, Course path
- Path style: line type select, weight slider, arrow size S/M/L
- Obstacle chips grouped by category (Tunnor / Slalom / Barriärer / Strukturer / Lans & ring)
- Each chip: small SVG thumbnail + Swedish label, `draggable`

### `Canvas.jsx`
- `ResizeObserver` on container → tracks stage dimensions
- Computes `baseScale`, exposes `fitArena` via store action
- `Stage` → `Layer` → arena `Rect` + grid `Line`s + `Text` labels + `ObstacleGroup` per obstacle
- `onWheel` → zoom (clamped 0.25–4×)
- Middle-mouse / space+drag → pan
- `onDrop` on container div → `placeObstacle`
- Click empty canvas → `selectObstacle(null)`

### `ObstacleGroup.jsx`
Props: `placed`, `def`, `scale`, `isSelected`, `snapToGrid`, `violation`, `onSelect`, `onMove`, `onRotate`

Renders:
- `Group` at screen position (draggable body)
- `Image` from `useSvgImage`
- Selection `Rect` (dashed, when selected)
- Rotation handle `Circle` above obstacle (when selected); drag computes angle → `onRotate`; snaps to 45° when `snapToGrid`
- Number badge: `Circle` + `Text` at `badgeOffX/Y`; `Line` leader from centre
- Red stroke on violation

### `RightPanel.jsx`
Layout wrapper: stacks `PropertiesPanel`, `SequenceList`, `CompliancePanel`.

### `PropertiesPanel.jsx`
Selected obstacle: type, x/y (m), rotation input + ↺90 / ↻90 / ↻45 / Reset buttons. Empty state: "Select an obstacle".

### `SequenceList.jsx`
Placed obstacles in drop order. Click → select. ✕ → delete. Drag handle → reorder (HTML5 drag). Empty state: "No obstacles placed".

### `CompliancePanel.jsx`
Reads `violations` from store. Shows: spacing status, bounds status. Updates live on every mutation.

---

## Verification

1. `npm install && npm run dev` — app loads
2. Topbar shows "WE Course Designer", correct layout
3. Arena inputs update canvas live
4. Grid toggle shows/hides grid
5. Drag obstacle chip → drops at cursor, snapped to 1m grid, renders as SVG symbol
6. Drag obstacle on canvas → moves, snaps, badge follows
7. Click obstacle → Properties panel updates; selection outline + rotation handle appear
8. Drag rotation handle → rotates; snaps 45° with snap on
9. Sequence list shows placed obstacles; reorder + delete work
10. Two obstacles < 6m apart → compliance warning
11. Obstacle partly outside arena → bounds warning
12. `tva-tunnor` chip → drops two `tunna` pieces with shared `groupId`
13. Mouse wheel → zoom; Fit → recenters
14. Reload → obstacles restored from localStorage
15. Sideline/Endline toggle → coordinate axes swap

---

## Out of Scope (Phase 1)

- Route drawing (path lines, connection dots, bezier segments)
- Visits and RouteSegments
- Classes & Criteria modal (stub only)
- Print / PDF export (stub only)
- Draggable number badge
- Auto-route generation

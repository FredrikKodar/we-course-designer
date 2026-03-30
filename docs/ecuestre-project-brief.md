# Ecuestre — Working Equitation Course Designer
## Project Brief & Living Spec

---

## Overview

Ecuestre is a web-based course design tool for Working Equitation (WE). It allows course designers and riders to plan, visualise, and export competition course layouts on a true-to-scale arena canvas. The app serves two primary user types equally: course designers (who need precision, compliance checking, and printable exports) and riders (who use it for practice planning).

A functional single-file HTML prototype (v4) has been built through iterative design sessions. The next step is scaffolding this into a proper React codebase. The prototype file `we-course-designer-v4.html` is the authoritative reference for all interactions to replicate.

---

## Key Decisions Made

### Platform & Stack
| Concern | Decision | Rationale |
|---|---|---|
| Platform | Web app (browser) | Accessible everywhere, no install, easy sharing |
| Framework | React + Vite | Component model suits the multi-panel UI |
| Canvas | Konva.js + React-Konva | Built for interactive 2D canvas, handles drag/drop, zoom/pan elegantly |
| Styling | Tailwind CSS | Fast iteration, consistent design system |
| State | Zustand | Lightweight, low boilerplate, scales well |
| PDF Export | Browser native print (MVP) → jsPDF + Konva (v2) | Native print works now; Konva export gives more control later |
| Persistence | localStorage (MVP) → cloud save (v2) | Simple start, upgrade path clear |

### Units
- Metric only (meters)

### Scale
- True-to-scale canvas — arena dimensions in meters map directly to pixels at a consistent ratio
- Core design requirement, not optional

### Saving (MVP)
- localStorage — auto-save as you work
- No user accounts for MVP

---

## Obstacle Set

### Visual style
- Official WE schematic style: black filled circles for stakes/barrels, solid lines for bars/structures
- Top-down view only
- No colour fills — black on white, matches competition course maps

### Full obstacle list (Swedish official names)

#### Tunnor
| ID | Label | Dimensions | Notes |
|---|---|---|---|
| `tunna` | Tunna | ⌀0.8 m | Single barrel — the atomic primitive |
| `tva-tunnor` | Två tunnor | 6 × 1 m | Preset: 2 tunnor, 3 m apart |
| `tre-tunnor` | Tre tunnor | 5 × 4 m | Preset: equilateral triangle, 3 m sides |
| `lans-tunna` | Lans ur/i tunna | 1 × 3 m | Tunna with lance |

#### Slalom
| ID | Label | Dimensions | Notes |
|---|---|---|---|
| `enkelslalom` | Enkelslalom | 10 × 0.8 m | 5 stakes, 2 m spacing |
| `parallellslalom` | Parallellslalom | 12 × 7 m | 7 stakes in two staggered rows, 6 m between rows |
| `ryggning` | Ryggning i mönster | 8 × 2 m | 6 stakes in 2 rows forming corridor, X mark |
| `korridor` | Klocka i korridor | 3 × 5 m | 6 stakes forming corridor, X at far end |

#### Barriärer
| ID | Label | Dimensions | Notes |
|---|---|---|---|
| `grind` | Grind | 3.5 × 0.3 m | Filled circle (hinge) + open circle (latch) |
| `sidvarts` | Sidvärts med bom | 4 × 0.3 m | Single horizontal bar |
| `lydnad` | Lydnadshinder | 4 × 0.4 m | Striped bar (obedience obstacle) |

#### Strukturer
| ID | Label | Dimensions | Notes |
|---|---|---|---|
| `trabro` | Träbro | 4 × 1.5 m | Hatched rect, ramp triangles at ends |
| `vatten` | Vattenhinder | 5 × 3 m | Rect with horizontal wave lines |
| `falla` | Fålla | 8 × 8 m | Two concentric circles, gap in outer ring |
| `bord` | Bord | 1 × 1 m | Table outline with jug on top |
| `hopp` | Hopp / Bank | 4 × 0.2 m | Two short parallel bars |

#### Lans & ring
| ID | Label | Dimensions | Notes |
|---|---|---|---|
| `ring` | Ring | 0.5 × 1.5 m | Vertical stand with ring target |

### Obstacle SVG format
Each obstacle definition carries an inline SVG string, rendered centered on the obstacle's world position and scaled to its meter dimensions:

```js
{
  id: 'tunna',
  label: 'Tunna',
  w: 0.8,
  h: 0.8,
  svg: `<circle cx="0" cy="0" r="12" fill="#1a1a18"/>`,
  viewBox: '-16 -16 32 32',
  entry: { x: 0, y: -0.4 },
  exit:  { x: 0, y:  0.4 }
}
```

### Multi-tunna presets
- Två tunnor and Tre tunnor are **presets** that drop multiple individual `tunna` objects in the correct geometric relationship
- After placement, each tunna is independently draggable and routable
- They share a `groupId` so the compliance checker can apply intra-group rules

---

## Data Model

### PlacedObstacle
```js
{
  id: string,           // unique, e.g. "1721234567_0.42"
  type: string,         // obstacle id, e.g. "tunna"
  x: number,           // world position, meters from arena top-left
  y: number,
  w: number,           // width in meters
  h: number,           // height in meters
  rotation: number,    // degrees, 0 = default orientation
  groupId: string | null,  // shared id for preset groups (två/tre tunnor, parallellslalom etc.)
  badgeOffX: number,   // number badge offset from centre, world units
  badgeOffY: number,
}
```

### Visit
A Visit is a directed traversal of a placed obstacle at a specific point in the course sequence. An obstacle can have multiple visits (e.g. a jump ridden from both directions).

```js
{
  id: string,
  obstacleId: string,   // references PlacedObstacle.id
  num: number,          // sequence number, 1-based, manually assigned or auto-incremented
  entryPoint: 'entry' | 'exit',  // which connection point the rider approaches from
}
```

### RouteSegment
A bezier curve segment connecting the exit of one visit to the entry of the next.

```js
{
  id: string,
  fromVisitId: string,
  toVisitId: string,
  controlPoint: { wx: number, wy: number } | null,  // null = straight midpoint default
}
```

### Class
```js
{
  id: string,
  name: string,         // e.g. "Lätt B"
  obstacles: {
    [visitId]: {        // keyed by Visit.id (not PlacedObstacle.id, since same obstacle can appear twice)
      criteria: string,
      notUsed: boolean
    }
  }
}
```

### App state (Zustand store shape)
```js
{
  arenaW: number,
  arenaH: number,
  placed: PlacedObstacle[],
  visits: Visit[],
  segments: RouteSegment[],
  classes: Class[],
  activeClassIdx: number,
  showGrid: boolean,
  snapToGrid: boolean,
  showPath: boolean,
  pathLineType: 'solid' | 'dashed' | 'dotted',
  pathLineWeight: number,
  pathArrowSize: number,
  viewMode: 'side' | 'end',
  zoom: number,
  panX: number,
  panY: number,
  selectedId: string | null,   // selected PlacedObstacle id
  selectedVisitId: string | null,
}
```

---

## Routing Model

### Manual routing (MVP)
- No auto-route button
- Designer draws the route by dragging from an obstacle's entry/exit dot to another obstacle's entry/exit dot
- That drag creates a Visit for the source obstacle (if none exists at that connection point) and a Visit for the target, and a RouteSegment connecting them
- Visit numbers auto-assign in connection order, can be manually overridden
- An obstacle can be visited multiple times — each drag from a connection point creates a new Visit

### Connection points
Each obstacle definition specifies `entry` and `exit` offsets in local space (origin = obstacle centre). These rotate with the obstacle. The path connects to these points rather than the obstacle centre.

### Bezier path editing
Each RouteSegment has one quadratic bezier control point, draggable on the canvas. Defaults to the midpoint between entry and exit (straight). Reset button in topbar clears all control points.

### Path visual style (designer-controlled)
- Line type: solid / dashed / dotted
- Line weight: 0.5–5 px slider
- Arrow size: S / M / L (multiplier on top of line-weight-based base size)
- All settings feed through to print/PDF export

---

## Compliance Rules

Run on every obstacle move, drop, and rotation change. Results stored as a Set of violating obstacle IDs.

| Rule | Scope | Trigger | Message |
|---|---|---|---|
| Minimum spacing | All obstacles | Centre-to-centre < 6 m | ⚠ avstånd < 6 m |
| Out of bounds | All obstacles | Any corner outside arena | ⚠ utanför banan |
| Tunna group spacing | Tunnor with same groupId | Pair distance outside 3–4 m | ⚠ avstånd X.X m — ska vara 3–4 m |
| Parallellslalom spacing | Parallellslalom group | Row spacing ≠ 6 m, stake spacing ≠ 6 m | ⚠ pinnavstånd felaktigt |

The rule engine is pluggable — rules are functions that take the full `placed` array and return a Set of violating IDs with messages.

---

## Interaction Design

### Placing obstacles
- Drag from sidebar chip onto arena
- Drops at cursor position, snapped to grid if snap enabled
- Preset groups (Två tunnor, Tre tunnor) drop all pieces simultaneously with correct geometry, each stamped with a shared `groupId`

### Selecting
- Click obstacle body to select
- Click empty canvas to deselect
- Selected obstacle shows dashed selection outline and rotation handle

### Moving
- Drag obstacle body to reposition
- Snaps to 1 m grid if snap enabled
- Clamped to arena bounds (unrotated bounding box)

### Rotating
- Drag the ↻ handle above the obstacle (appears when selected)
- Snaps to 45° increments when grid snap is on, free rotation when off
- ±90°, ±45°, and Reset buttons in Properties panel
- Numeric input for precise angle

### Number badge
- Freely draggable, independent of obstacle
- Thin dashed leader line from obstacle centre to badge
- Reset button in Properties panel returns badge to default position (just above obstacle)
- One badge per Visit (not per PlacedObstacle) — if an obstacle has two visits, it has two badges

### Drawing the route
- Hover an obstacle → entry (green) and exit (red) dots appear at the connection points
- Drag from a dot → live dashed preview line follows cursor
- Drop on another obstacle's dot → creates Visits and RouteSegment
- Drop on empty canvas → cancels
- Control points on each segment are draggable to curve the path

### Sequence panel
- Lists Visits in order, not PlacedObstacles
- Each row shows: visit number, obstacle type, which side (entry/exit)
- Drag to reorder — numbers update live
- Delete button removes the visit and its connected segments

---

## Architecture Notes

### Canvas rendering
- Konva stage fills the canvas area
- Arena is a Konva.Rect at true-to-scale dimensions
- Grid drawn as Konva.Lines
- PlacedObstacles rendered as Konva.Group (SVG image + rotation + badge)
- Entry/exit dots rendered as small circles on each obstacle when path is visible
- Route segments rendered as quadratic bezier paths with arrowheads
- Control point handles rendered as small draggable dots on each segment
- Zoom/pan via Konva stage scale and position

### Coordinate system
- World coordinates in meters, origin at arena top-left
- Screen coordinates in pixels
- `worldToScreen(wx, wy)` / `screenToWorld(sx, sy)` in `src/utils/coords.js`
- Endline view rotates 90°: `screen_x = panX + (arenaH - wy) * scale`, `screen_y = panY + wx * scale`

### Obstacle SVG rendering
- Each obstacle type has an SVG string and viewBox in its definition
- Rendered via Konva.Image (rasterised from SVG blob URL) or inline SVG element
- Scaled to obstacle's world dimensions × current pixel-per-meter ratio
- Rotation applied via Konva group rotation

---

## File Structure

```
ecuestre/
├── CLAUDE.md
├── index.html
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── store/
│   │   └── useStore.js           ← Zustand store
│   ├── components/
│   │   ├── Topbar.jsx
│   │   ├── Sidebar.jsx           ← obstacle library chips
│   │   ├── Canvas.jsx            ← Konva stage, arena, obstacles, path
│   │   ├── RightPanel.jsx
│   │   ├── SequenceList.jsx      ← visit list, drag to reorder
│   │   ├── PropertiesPanel.jsx   ← rotation, badge reset, position
│   │   ├── CompliancePanel.jsx
│   │   ├── ClassesModal.jsx
│   │   └── PrintPreview.jsx
│   ├── data/
│   │   └── obstacles.js          ← OBSTACLES[] with SVG, dimensions, entry/exit
│   ├── utils/
│   │   ├── coords.js             ← worldToScreen, screenToWorld, getConnectionPoints
│   │   ├── compliance.js         ← pluggable rule engine
│   │   ├── presets.js            ← två/tre tunnor, parallellslalom drop logic
│   │   └── export.js             ← print/PDF rendering
│   └── styles/
│       └── index.css
├── public/
│   └── assets/                   ← any static SVG assets if needed
└── package.json
```

---

## CLAUDE.md (for repo root)

```markdown
# Ecuestre — Working Equitation Course Designer

## What this is
A React web app for designing Working Equitation (WE) competition courses.
Course designers place obstacles on a true-to-scale arena canvas, draw the
intended ride route between them, assign per-obstacle criteria per class,
and export a printable course sheet.

## Stack
- React + Vite
- Konva.js + React-Konva (canvas rendering)
- Zustand (state management)
- Tailwind CSS (styling)
- localStorage (persistence, MVP)

## Key concepts
- **PlacedObstacle** — a physical object on the arena (position, rotation, dimensions)
- **Visit** — a directed traversal of an obstacle at a specific sequence position
  - One obstacle can have multiple visits (e.g. a jump ridden from both directions)
- **RouteSegment** — a bezier curve from one visit's exit to the next visit's entry
- The sequence panel lists Visits, not PlacedObstacles

## Key conventions
- All measurements in meters (metric only)
- World coordinates: origin at arena top-left, x = width axis, y = length axis
- Obstacle positions stored in world coords; screen coords computed at render time
- Connection points (entry/exit) are defined in obstacle-local space and rotated at render time
- Compliance rules are pluggable functions in src/utils/compliance.js
- Zustand store is the single source of truth

## Obstacle groups
Presets (Två tunnor, Tre tunnor, Parallellslalom) drop multiple PlacedObstacles
simultaneously with correct geometry. Each piece gets a shared `groupId`.
The compliance checker uses groupId to apply intra-group spacing rules.

## Current status
HTML prototype v4 is the reference implementation (we-course-designer-v4.html).
Scaffolding into React is the next step.

## What's deliberately deferred
- Auto-route generation (manual routing only for now)
- Stake snapping / intersecting slaloms
- Custom SVG obstacle import
- Right-click criteria picker
- Cloud save / user accounts
- Multi-course management
```

---

## Backlog

| Feature | Notes |
|---|---|
| Auto-route generation | Generates visits + segments as a first draft from obstacle placement order; designer edits manually. Deferred until manual routing is solid. |
| Stake snapping | Individual stakes from different obstacles can snap to shared positions (e.g. shared slalom stake). Complex data model change. |
| Custom SVG obstacle import | Designer provides image, Claude generates SVG symbol, user defines dimensions and connection points. |
| Right-click criteria picker | Context menu on placed obstacle → preset criteria library per obstacle type and class. |
| Preset criteria library | Standard WE criteria per obstacle type and level, selectable from right-click menu. |
| Arena shape presets | Quick-select common sizes: 60×40, 40×20, 20×20 etc. |
| Cloud save | User accounts, saved courses, shareable links. |
| Multi-course management | Multiple saved courses, tabs or list view. |
| PDF export refinement | Event name, logo, judge name in print header. Better multi-page layout. |
| Grid interval selection | User chooses 1m or 5m grid label density based on zoom. |

---

## Reference Documents

- `we-course-designer-v4.html` — HTML prototype, authoritative reference for all interactions
- `TR_X_2025_hinderbilaga.pdf` — Official Swedish WE obstacle rules (dimensions, execution, judging)
- `TR_X_2025_hinderbilaga_mark_up.pdf` — Annotated version with schematic diagrams

---

*Last updated: after v4 prototype session, before React scaffold*

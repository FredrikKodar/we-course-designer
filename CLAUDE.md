# WE Course Designer

## Git workflow
- Never commit directly to `main`. All work goes on a separate branch
  (`feature/...`, `fix/...`, etc.) and gets merged/PR'd in.
- Use Conventional Commits for all commit messages (`feat:`, `fix:`,
  `chore:`, `docs:`, etc.) — release-please uses this to automate
  changelog/release generation.

## What this is
A React web app for designing Working Equitation (WE) competition courses.
Course designers place obstacles on a true-to-scale arena canvas, draw the
intended ride route between them, assign per-obstacle criteria per class,
and export a printable course sheet.

## Stack
- React 18 + Vite
- Konva.js + react-konva (canvas rendering)
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
Phase 1: scaffold, store, obstacle data, canvas with arena/grid/draggable obstacles.
No routing yet.

## What's deliberately deferred
- Auto-route generation (manual routing only for now)
- Stake snapping / intersecting slaloms
- Custom SVG obstacle import
- Right-click criteria picker
- Cloud save / user accounts
- Multi-course management

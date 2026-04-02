# Print / Export — Phase 1 Design

**Date:** 2026-04-02
**Status:** Approved

## Overview

A "Print" button in the Topbar opens a new browser tab containing a formatted A4 portrait course sheet. The user presses Ctrl+P (or uses the browser print dialog) to print or save as PDF. No extra libraries required.

## Reference

Real-world WE course sheets (`docs/LA 1.pdf`) use A4 portrait with a narrow text column on the left (~28%) and the arena map on the right (~72%). The left column contains venue metadata and a numbered obstacle list per class.

## Canvas Color Changes

Applies globally to the editor (not just print). Current green-tinted arena is replaced with high-contrast black-and-white for better UX and print quality.

| Element | Before | After |
|---|---|---|
| Arena fill | `#b4c4aa` | `white` |
| Grid minor lines | `rgba(0,0,0,0.06)` | `rgba(0,0,0,0.12)` |
| Grid major lines | `rgba(0,0,0,0.15)` | `rgba(0,0,0,0.35)` |
| Arena border | `#4a7044` | `#111` |

The canvas container background (`#c8d4c4`) stays unchanged — it provides visual context in the editor and is outside the Konva Stage so it won't appear in the export.

No `printMode` flag is needed since colors are consistent between editor and print.

## Data Model Changes

Two new fields added to `PlacedObstacle`:

```ts
sequenceNum: string  // e.g. "1", "2a", "2b" — empty string if unset
note: string         // free-text obstacle description for the print sheet
```

Both default to `""` when an obstacle is placed. Both are persisted in localStorage.

Sequencing is manual (Phase 1). In Phase 2, `Visit.num` will take over sequencing and these fields become irrelevant.

## Store Changes

New action:

```ts
updateObstacleMeta(id: string, sequenceNum: string, note: string): void
```

`stageRef` (a `Konva.Stage` instance) is stored on the Zustand store — set by `Canvas.tsx` after mount, same pattern as `fitArena`. Used by `export.ts` to call `toDataURL`.

```ts
stageRef?: Konva.Stage
```

`sequenceNum` and `note` are included in the persisted state subset.

## Component Changes

### `Canvas.tsx`
- Update arena/grid/border colors per table above
- Set `stageRef` on store after Stage mounts (via `ref` prop on `<Stage>` + `useEffect`)

### `PropertiesPanel.tsx`
- Add "Seq #" text input (short, e.g. `"1"`, `"2a"`) and "Note" text input
- Both wired to `updateObstacleMeta` on change
- Shown when an obstacle is selected

### `Topbar.tsx`
- Add "Print" button (same style as existing buttons)
- On click: calls `printCourse()` from `export.ts`

### `src/utils/export.ts`
- Implements `printCourse(placed, arenaW, arenaH)` — reads `stageRef` from store internally

## Print Page — `printCourse()`

### Algorithm

1. Get `stageRef` from store; call `stage.toDataURL({ pixelRatio: 3 })`
2. Sort `placed` by `sequenceNum`: numbered entries first (natural sort — handles `"2a"` < `"2b"` < `"10"`), then unnumbered appended at end
3. Build self-contained HTML string (see structure below)
4. `const w = window.open(); w.document.write(html); w.document.close()`

### Sequencing sort

- Obstacles with non-empty `sequenceNum`: sorted with a natural sort (handles `"2a"` < `"2b"` < `"10"`)
- Obstacles with `sequenceNum === ""`: appended at bottom, displayed without a number

### Print page HTML structure

```
@page { size: A4 portrait; margin: 10mm; }
body { display: flex; height: 100vh; font-family: sans-serif; font-size: 11px; }

Left column (28%):
  - Placeholder header block:
      Tävlingsplats (bold)
      Klass
      Datum
      Domare
  - Obstacle list:
      [sequenceNum] [obstacle type label] [note]
      (one line per obstacle)
  - Footer: arena dimensions (e.g. "60 × 40 m")

Right column (72%):
  - <img> with stage.toDataURL() dataURL
  - width: 100%, height: 100%, object-fit: contain
```

### Out of scope (Phase 1)

- Venue / date / judge editing (placeholders only in print output)
- Class criteria table (Phase 2 — classes and disciplines not yet modelled)
- Route arrows on map (Phase 2 — visits and segments not yet implemented)
- Automatic sequencing (Phase 2 — will use `Visit.num`)
- Multiple arena borders per class size (Phase 2)

## File Changelist

| File | Change |
|---|---|
| `src/types.ts` | Add `sequenceNum`, `note` to `PlacedObstacle` |
| `src/store/useStore.ts` | Add `stageRef`, `updateObstacleMeta`; include new fields in persist |
| `src/components/Canvas.tsx` | Color updates; set `stageRef` on store |
| `src/components/PropertiesPanel.tsx` | Add Seq # and Note inputs |
| `src/components/Topbar.tsx` | Add Print button |
| `src/utils/export.ts` | Implement `printCourse()` |
| `src/components/PrintPreview.tsx` | Remains as stub (not needed) |

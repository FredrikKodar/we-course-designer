# Print / Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Print button that opens an A4 portrait course sheet in a new browser tab using a Konva canvas snapshot, with a left column obstacle list and right-column arena map.

**Architecture:** `PlacedObstacle` gains `sequenceNum` and `note` fields edited via `PropertiesPanel`. `Canvas` exposes its Konva `Stage` instance on the Zustand store. `printCourse()` in `export.ts` reads the store, calls `stage.toDataURL({ pixelRatio: 3 })`, builds a self-contained HTML string, and opens it in a new tab.

**Tech Stack:** React 18, Konva / react-konva, Zustand, Tailwind CSS, Vite

---

## File Map

| File | Change |
|---|---|
| `src/types.ts` | Add `sequenceNum: string` and `note: string` to `PlacedObstacle` |
| `src/store/useStore.ts` | Add `stageRef`, `updateObstacleMeta`; default new fields in `placeObstacle` |
| `src/components/Canvas.tsx` | Update arena/grid/border colors; expose `stageRef` on store via `ref` |
| `src/components/ObstacleGroup.tsx` | Badge shows `sequenceNum` when set, falls back to index |
| `src/components/PropertiesPanel.tsx` | Add Seq # and Note inputs wired to `updateObstacleMeta` |
| `src/components/Topbar.tsx` | Add Print button calling `printCourse()` |
| `src/utils/export.ts` | Implement `printCourse()` |

---

## Task 1: Add `sequenceNum` and `note` to the data model and store

**Files:**
- Modify: `src/types.ts`
- Modify: `src/store/useStore.ts`

- [ ] **Step 1: Add fields to `PlacedObstacle` in `src/types.ts`**

  Find the `PlacedObstacle` interface (lines 41–51) and add two fields:

  ```ts
  export interface PlacedObstacle {
    id: string;
    type: string;
    x: number;
    y: number;
    w: number;
    h: number;
    rotation: number;
    groupId: string | null;
    badgeOffX: number;
    badgeOffY: number;
    sequenceNum: string;
    note: string;
  }
  ```

- [ ] **Step 2: Add `stageRef`, `updateObstacleMeta` to the store interface in `src/store/useStore.ts`**

  Add a Konva import at the top of the file (after existing imports):

  ```ts
  import type Konva from 'konva';
  ```

  In the `StoreState` interface, add after `fitArena?`:

  ```ts
  stageRef?: Konva.Stage;

  updateObstacleMeta: (id: string, sequenceNum: string, note: string) => void;
  ```

- [ ] **Step 3: Add new fields to `buildPresetPieces` in `src/utils/presets.ts`**

  `buildPresetPieces` has two construction paths. Add `sequenceNum: ''` and `note: ''` to both:

  **Preset path** (the `pieces.map(...)` return):

  ```ts
  return pieces.map((piece, i) => ({
    ...piece,
    id: `${timestamp}_${Math.random().toString(36).slice(2, 8)}_${i}`,
    groupId,
    sequenceNum: '',
    note: '',
  }));
  ```

  **Single path** (the `[{ id: ..., type, ... }]` return):

  ```ts
  return [
    {
      id: `${timestamp}_${Math.random().toString(36).slice(2, 8)}`,
      type,
      x: cx - def.w / 2,
      y: cy - def.h / 2,
      w: def.w,
      h: def.h,
      rotation: 0,
      groupId: null,
      badgeOffX: 0,
      badgeOffY: -(def.h / 2 + 1.5),
      sequenceNum: '',
      note: '',
    },
  ];
  ```

- [ ] **Step 4: Implement `updateObstacleMeta` in `src/store/useStore.ts`**

  Add the action implementation inside the `create()` call, after `clearAll`:

  ```ts
  updateObstacleMeta: (id, sequenceNum, note) => {
    set((s) => ({
      placed: s.placed.map((p) =>
        p.id === id ? { ...p, sequenceNum, note } : p,
      ),
    }));
  },
  ```

- [ ] **Step 5: Verify TypeScript compiles cleanly**

  ```bash
  npm run typecheck
  ```

  Expected: no errors.

- [ ] **Step 6: Commit**

  ```bash
  git add src/types.ts src/store/useStore.ts src/utils/presets.ts
  git commit -m "feat: add sequenceNum and note fields to PlacedObstacle"
  ```

---

## Task 2: Canvas color changes + expose stageRef

**Files:**
- Modify: `src/components/Canvas.tsx`

- [ ] **Step 1: Update arena fill color**

  In `Canvas.tsx`, find the arena background `<Rect>` (the one with `fill="#b4c4aa"`):

  ```tsx
  <Rect
    x={panX}
    y={panY}
    width={ea.w * scale}
    height={ea.h * scale}
    fill="white"
  />
  ```

- [ ] **Step 2: Update grid line colors**

  In `GridLines`, there are four `<Line>` groups. Update their stroke values:

  - Minor vertical (`vm`): `stroke="rgba(0,0,0,0.12)"` strokeWidth stays `0.5`
  - Minor horizontal (`hm`): `stroke="rgba(0,0,0,0.12)"` strokeWidth stays `0.5`
  - Major vertical (`vM`): `stroke="rgba(0,0,0,0.35)"` strokeWidth stays `0.8`
  - Major horizontal (`hM`): `stroke="rgba(0,0,0,0.35)"` strokeWidth stays `0.8`

- [ ] **Step 3: Update arena border color**

  Find the arena border `<Rect>` (the one with `stroke="#4a7044"`):

  ```tsx
  <Rect
    x={panX}
    y={panY}
    width={ea.w * scale}
    height={ea.h * scale}
    stroke="#111"
    strokeWidth={2}
  />
  ```

- [ ] **Step 4: Add a stageRef and expose it on the store**

  At the top of the `Canvas` component function body, add a ref:

  ```tsx
  const stageRef = useRef<Konva.Stage>(null);
  ```

  Add a `useEffect` to set it on the store (place after the existing `fitArena` effect):

  ```tsx
  useEffect(() => {
    if (stageRef.current) {
      useStore.setState({ stageRef: stageRef.current });
    }
  }, []);
  ```

  Pass the ref to `<Stage>`:

  ```tsx
  <Stage
    ref={stageRef}
    width={stageSize.width}
    height={stageSize.height}
    onWheel={handleWheel}
    onMouseDown={handleMouseDown}
    onMouseMove={handleMouseMove}
    onMouseUp={handleMouseUp}
    onClick={handleStageClick}
  >
  ```

- [ ] **Step 5: Verify TypeScript and check the app visually**

  ```bash
  npm run typecheck
  npm run dev
  ```

  Open the app. Arena should now be white with dark grid lines. The exterior canvas container remains green (`#c8d4c4`).

- [ ] **Step 6: Commit**

  ```bash
  git add src/components/Canvas.tsx
  git commit -m "feat: white arena + black grid; expose stageRef on store"
  ```

---

## Task 3: Badge shows sequenceNum

**Files:**
- Modify: `src/components/ObstacleGroup.tsx`

- [ ] **Step 1: Update badge text to prefer sequenceNum**

  In `ObstacleGroup.tsx`, find the `<Text>` that renders the badge label (around line 207). Change its `text` prop:

  ```tsx
  <Text
    x={badgeSx - badgeR}
    y={badgeSy - badgeR / 2}
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
  ```

- [ ] **Step 2: Verify**

  ```bash
  npm run typecheck
  npm run dev
  ```

  Place an obstacle. Badge shows its drop index. Set a sequence number via Properties panel (once Task 4 is done) — badge updates.

- [ ] **Step 3: Commit**

  ```bash
  git add src/components/ObstacleGroup.tsx
  git commit -m "feat: obstacle badge shows sequenceNum when set"
  ```

---

## Task 4: Seq # and Note inputs in PropertiesPanel

**Files:**
- Modify: `src/components/PropertiesPanel.tsx`

- [ ] **Step 1: Subscribe to `updateObstacleMeta` in the component**

  In `PropertiesPanel`, add to the store subscriptions at the top of the component:

  ```tsx
  const updateObstacleMeta = useStore((s) => s.updateObstacleMeta);
  ```

- [ ] **Step 2: Add the Seq # and Note inputs to the JSX**

  After the rotation button row (`<div className="flex gap-0.5 mt-1">`), add:

  ```tsx
  <div className="mt-2 border-t border-gray-100 pt-2 flex flex-col gap-1.5">
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-gray-400">Seq #</span>
      <input
        type="text"
        value={obstacle.sequenceNum}
        onChange={(e) =>
          updateObstacleMeta(obstacle.id, e.target.value, obstacle.note)
        }
        placeholder="1, 2a…"
        className="w-[60px] text-[11px] font-mono border border-gray-200 rounded px-1 py-0.5 bg-[#f9f9f7] text-right focus:outline-none focus:border-[#BA7517]"
      />
    </div>
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] text-gray-400 shrink-0">Note</span>
      <input
        type="text"
        value={obstacle.note}
        onChange={(e) =>
          updateObstacleMeta(obstacle.id, obstacle.sequenceNum, e.target.value)
        }
        placeholder="Description…"
        className="flex-1 min-w-0 text-[11px] border border-gray-200 rounded px-1 py-0.5 bg-[#f9f9f7] focus:outline-none focus:border-[#BA7517]"
      />
    </div>
  </div>
  ```

- [ ] **Step 3: Verify**

  ```bash
  npm run typecheck
  npm run dev
  ```

  Select an obstacle → Properties panel shows Seq # and Note fields. Type `"1"` in Seq # — badge on canvas updates to `"1"`. Type a note — it persists on re-select.

- [ ] **Step 4: Commit**

  ```bash
  git add src/components/PropertiesPanel.tsx
  git commit -m "feat: add Seq # and Note inputs to PropertiesPanel"
  ```

---

## Task 5: Implement `printCourse()` in export.ts

**Files:**
- Modify: `src/utils/export.ts`

- [ ] **Step 1: Implement `printCourse`**

  Replace the entire contents of `src/utils/export.ts` with:

  ```ts
  import type { PlacedObstacle } from '../types';
  import { OBSTACLES } from '../data/obstacles';
  import useStore from '../store/useStore';

  function naturalCompare(a: string, b: string): number {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  }

  function buildObstacleRows(placed: PlacedObstacle[]): string {
    const numbered = placed
      .filter((p) => p.sequenceNum !== '')
      .sort((a, b) => naturalCompare(a.sequenceNum, b.sequenceNum));
    const unnumbered = placed.filter((p) => p.sequenceNum === '');
    const sorted = [...numbered, ...unnumbered];

    return sorted
      .map((p) => {
        const def = OBSTACLES.find((o) => o.id === p.type);
        const label = def?.label ?? p.type;
        const num = p.sequenceNum ? `${p.sequenceNum}.` : '–';
        const note = p.note ? ` ${p.note}` : '';
        return `<div style="margin-bottom:4px;font-size:10px;line-height:1.4;">${num} <strong>${label}</strong>${note}</div>`;
      })
      .join('');
  }

  function buildPrintHtml(dataUrl: string, obstacleRows: string, arenaW: number, arenaH: number): string {
    return `<!DOCTYPE html>
  <html lang="sv">
  <head>
  <meta charset="utf-8">
  <title>WE Course Sheet</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      display: flex;
      height: 100vh;
      font-family: Arial, sans-serif;
      font-size: 11px;
      color: #111;
      gap: 12px;
    }
    .left {
      width: 28%;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .right {
      flex: 1;
      min-width: 0;
    }
    .right img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      object-position: top left;
    }
    .header-block {
      font-size: 10px;
      line-height: 1.8;
      border-bottom: 1px solid #ccc;
      padding-bottom: 8px;
    }
    .header-block strong {
      font-size: 12px;
      display: block;
      margin-bottom: 2px;
    }
    .obstacle-list { flex: 1; overflow: hidden; }
    .obstacle-list h3 {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #555;
      margin-bottom: 6px;
      border-bottom: 1px solid #eee;
      padding-bottom: 3px;
    }
    .footer {
      font-size: 9px;
      color: #666;
      border-top: 1px solid #ccc;
      padding-top: 6px;
    }
  </style>
  </head>
  <body>
    <div class="left">
      <div class="header-block">
        <strong>Tävlingsplats</strong>
        Klass<br>
        Datum<br>
        Domare
      </div>
      <div class="obstacle-list">
        <h3>Hinder</h3>
        ${obstacleRows}
      </div>
      <div class="footer">${arenaW} × ${arenaH} m</div>
    </div>
    <div class="right">
      <img src="${dataUrl}" alt="Course map">
    </div>
  </body>
  </html>`;
  }

  export function printCourse(): void {
    const { stageRef, placed, arenaW, arenaH } = useStore.getState();
    if (!stageRef) {
      console.warn('printCourse: stageRef not set');
      return;
    }

    const dataUrl = stageRef.toDataURL({ pixelRatio: 3 });
    const obstacleRows = buildObstacleRows(placed);
    const html = buildPrintHtml(dataUrl, obstacleRows, arenaW, arenaH);

    const w = window.open('', '_blank');
    if (!w) {
      alert('Pop-up blocked. Please allow pop-ups for this site and try again.');
      return;
    }
    w.document.write(html);
    w.document.close();
  }
  ```

- [ ] **Step 2: Verify TypeScript**

  ```bash
  npm run typecheck
  ```

  Expected: no errors.

- [ ] **Step 3: Commit**

  ```bash
  git add src/utils/export.ts
  git commit -m "feat: implement printCourse() — A4 portrait course sheet"
  ```

---

## Task 6: Print button in Topbar

**Files:**
- Modify: `src/components/Topbar.tsx`

- [ ] **Step 1: Import `printCourse`**

  Add at the top of `src/components/Topbar.tsx`, after existing imports:

  ```ts
  import { printCourse } from '../utils/export';
  ```

- [ ] **Step 2: Add the Print button**

  In the right-side button group (after the "Fit" button, before "Clear"):

  ```tsx
  <button className={btnClass(false)} onClick={printCourse}>
    Print
  </button>
  ```

- [ ] **Step 3: Verify end-to-end**

  ```bash
  npm run dev
  ```

  1. Place a few obstacles
  2. Select each, assign Seq # (`1`, `2`, `3`) and a short note
  3. Verify badges update on canvas
  4. Click **Print** — a new tab should open with:
     - Left column: placeholder header + obstacle list sorted by seq number + arena dimensions
     - Right column: white arena map with black grid and obstacle badges
  5. Press Ctrl+P in the new tab — verify A4 portrait layout with correct margins

- [ ] **Step 4: Commit**

  ```bash
  git add src/components/Topbar.tsx
  git commit -m "feat: add Print button to Topbar"
  ```

---

## Task 7: Add `.superpowers/` to `.gitignore`

**Files:**
- Modify: `.gitignore` (or create if absent)

- [ ] **Step 1: Check `.gitignore`**

  ```bash
  cat .gitignore 2>/dev/null || echo "no .gitignore"
  ```

- [ ] **Step 2: Add the entry if missing**

  If `.superpowers/` is not already in `.gitignore`, add it:

  ```
  .superpowers/
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add .gitignore
  git commit -m "chore: ignore .superpowers/ brainstorm artifacts"
  ```

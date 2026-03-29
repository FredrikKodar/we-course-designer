# WE Course Designer — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a React + Vite app that renders an interactive WE arena canvas with draggable obstacles, grid, compliance checking, and localStorage persistence.

**Architecture:** Repo-root Vite project. Zustand store is the single source of truth. `Canvas.jsx` renders a react-konva Stage with arena/grid/obstacles. `ObstacleGroup.jsx` is a prop-driven component for per-obstacle rendering and interaction (no store imports). HTML5 drag-and-drop from `Sidebar.jsx` chips to the canvas container div.

**Tech Stack:** React 18, Vite, Konva.js + react-konva, Zustand (with persist), Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-03-29-we-course-designer-scaffold-design.md`

**Obstacle data:** `docs/obstacles.js` — copy verbatim to `src/data/obstacles.js`

---

## File Map

| File | Responsibility |
|---|---|
| `package.json` | Dependencies and scripts |
| `vite.config.js` | Vite + React plugin |
| `tailwind.config.js` | Tailwind content globs |
| `postcss.config.js` | PostCSS plugins |
| `index.html` | Vite entry, mounts `#root` |
| `CLAUDE.md` | Project context for AI assistants |
| `src/main.jsx` | React entry point |
| `src/styles/index.css` | Tailwind directives + global resets |
| `src/App.jsx` | Layout shell |
| `src/data/obstacles.js` | Obstacle definitions, GROUP_RULES, expandPreset, SCALE |
| `src/utils/coords.js` | worldToScreen, screenToWorld, getConnectionPoints |
| `src/utils/compliance.js` | Pluggable rule engine (spacing, bounds, group) |
| `src/utils/presets.js` | buildPresetPieces — stamps id/groupId onto expandPreset results |
| `src/utils/export.js` | Stub |
| `src/store/useStore.js` | Zustand store with all state, actions, and persist |
| `src/components/Topbar.jsx` | Title, arena label, view toggle, toolbar buttons |
| `src/components/Sidebar.jsx` | Arena inputs, toggles, path style, obstacle chips |
| `src/components/Canvas.jsx` | Konva Stage, arena rect, grid, drop target, zoom/pan |
| `src/components/ObstacleGroup.jsx` | Per-obstacle: SVG image, drag, rotate handle, badge |
| `src/components/RightPanel.jsx` | Layout wrapper for right-side panels |
| `src/components/PropertiesPanel.jsx` | Selected obstacle properties + rotation controls |
| `src/components/SequenceList.jsx` | Placed obstacles list, reorder, delete |
| `src/components/CompliancePanel.jsx` | Violation status display |
| `src/components/ClassesModal.jsx` | Empty stub |
| `src/components/PrintPreview.jsx` | Empty stub |

---

## Task 1: Vite project scaffold

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `index.html`
- Create: `CLAUDE.md`
- Create: `src/main.jsx`
- Create: `src/styles/index.css`
- Create: `src/App.jsx`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "we-course-designer",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "konva": "^9.3.18",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-konva": "^18.2.10",
    "zustand": "^5.0.5"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.21",
    "postcss": "^8.5.3",
    "tailwindcss": "^3.4.17",
    "vite": "^6.3.1"
  }
}
```

- [ ] **Step 2: Create `vite.config.js`**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

- [ ] **Step 3: Create `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

- [ ] **Step 4: Create `postcss.config.js`**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 5: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>WE Course Designer</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create `src/styles/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f5f5f0;
  height: 100vh;
  overflow: hidden;
}
```

- [ ] **Step 7: Create `src/main.jsx`**

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 8: Create `src/App.jsx`** (placeholder)

```jsx
export default function App() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f5f5f0]">
      <div className="h-[46px] border-b border-gray-200 bg-white flex items-center px-4 text-sm font-semibold">
        WE Course Designer
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[162px] border-r border-gray-200 bg-white">Sidebar</div>
        <div className="flex-1 bg-[#c8d4c4]">Canvas</div>
        <div className="w-[172px] border-l border-gray-200 bg-white">Right panel</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Create `CLAUDE.md`**

```markdown
# WE Course Designer

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
```

- [ ] **Step 10: Install dependencies and verify dev server starts**

Run: `npm install && npm run dev`
Expected: Vite dev server starts, browser shows the three-column placeholder layout with "WE Course Designer" in the header.

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json vite.config.js tailwind.config.js postcss.config.js index.html CLAUDE.md src/main.jsx src/styles/index.css src/App.jsx
git commit -m "scaffold: Vite + React + Tailwind project skeleton"
```

---

## Task 2: Obstacle data and utility functions

**Files:**
- Create: `src/data/obstacles.js`
- Create: `src/utils/coords.js`
- Create: `src/utils/compliance.js`
- Create: `src/utils/presets.js`
- Create: `src/utils/export.js`

- [ ] **Step 1: Copy `docs/obstacles.js` to `src/data/obstacles.js`**

Copy the file verbatim. It exports `OBSTACLES`, `GROUP_RULES`, `MIN_OBSTACLE_SPACING`, `SCALE`, and `expandPreset`.

- [ ] **Step 2: Create `src/utils/coords.js`**

```js
/**
 * Convert world coordinates (meters) to screen coordinates (pixels).
 * @param {number} wx - world x (meters from arena left)
 * @param {number} wy - world y (meters from arena top)
 * @param {object} ctx - { panX, panY, scale, viewMode, arenaH }
 * @returns {[number, number]} [sx, sy] screen pixels
 */
export function worldToScreen(wx, wy, ctx) {
  const { panX, panY, scale, viewMode, arenaH } = ctx;
  if (viewMode === 'end') {
    return [panX + (arenaH - wy) * scale, panY + wx * scale];
  }
  return [panX + wx * scale, panY + wy * scale];
}

/**
 * Convert screen coordinates (pixels) to world coordinates (meters).
 * @param {number} sx - screen x
 * @param {number} sy - screen y
 * @param {object} ctx - { panX, panY, scale, viewMode, arenaH }
 * @returns {[number, number]} [wx, wy] world meters
 */
export function screenToWorld(sx, sy, ctx) {
  const { panX, panY, scale, viewMode, arenaH } = ctx;
  if (viewMode === 'end') {
    const ru = (sx - panX) / scale;
    const rv = (sy - panY) / scale;
    return [rv, arenaH - ru];
  }
  return [(sx - panX) / scale, (sy - panY) / scale];
}

/**
 * Get rotation-aware connection points in world coordinates.
 * @param {object} placed - PlacedObstacle { x, y, w, h, rotation }
 * @param {object} def - OBSTACLES entry { entry, exit }
 * @returns {{ entry: {x,y}, exit: {x,y} }}
 */
export function getConnectionPoints(placed, def) {
  const cx = placed.x + placed.w / 2;
  const cy = placed.y + placed.h / 2;
  const rot = ((placed.rotation || 0) * Math.PI) / 180;
  const cosR = Math.cos(rot);
  const sinR = Math.sin(rot);

  function rotate(lx, ly) {
    return {
      x: cx + lx * cosR - ly * sinR,
      y: cy + lx * sinR + ly * cosR,
    };
  }

  return {
    entry: rotate(def.entry.x, def.entry.y),
    exit: rotate(def.exit.x, def.exit.y),
  };
}
```

- [ ] **Step 3: Create `src/utils/compliance.js`**

```js
import { MIN_OBSTACLE_SPACING, GROUP_RULES } from '../data/obstacles';

function spacingRule(placed, arenaW, arenaH) {
  const violations = new Map();
  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) {
      const a = placed[i];
      const b = placed[j];
      // Skip obstacles in the same group
      if (a.groupId && a.groupId === b.groupId) continue;
      const acx = a.x + a.w / 2;
      const acy = a.y + a.h / 2;
      const bcx = b.x + b.w / 2;
      const bcy = b.y + b.h / 2;
      const d = Math.sqrt((acx - bcx) ** 2 + (acy - bcy) ** 2);
      if (d < MIN_OBSTACLE_SPACING) {
        const msg = `⚠ avstånd < ${MIN_OBSTACLE_SPACING} m`;
        violations.set(a.id, msg);
        violations.set(b.id, msg);
      }
    }
  }
  return violations;
}

function boundsRule(placed, arenaW, arenaH) {
  const violations = new Map();
  for (const p of placed) {
    if (p.x < 0 || p.y < 0 || p.x + p.w > arenaW || p.y + p.h > arenaH) {
      violations.set(p.id, '⚠ utanför banan');
    }
  }
  return violations;
}

function groupRule(placed) {
  const violations = new Map();
  const groups = new Map();
  for (const p of placed) {
    if (!p.groupId) continue;
    if (!groups.has(p.groupId)) groups.set(p.groupId, []);
    groups.get(p.groupId).push(p);
  }
  for (const [groupId, members] of groups) {
    // Extract preset type: groupId format is "{presetType}_{timestamp}"
    const lastUnderscore = groupId.lastIndexOf('_');
    if (lastUnderscore === -1) continue;
    const presetType = groupId.substring(0, lastUnderscore);
    const rule = GROUP_RULES[presetType];
    if (!rule) continue;
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const a = members[i];
        const b = members[j];
        const acx = a.x + a.w / 2;
        const acy = a.y + a.h / 2;
        const bcx = b.x + b.w / 2;
        const bcy = b.y + b.h / 2;
        const d = Math.sqrt((acx - bcx) ** 2 + (acy - bcy) ** 2);
        if (d < rule.minDist || d > rule.maxDist) {
          const msg = '⚠ ' + rule.message(d);
          violations.set(a.id, msg);
          violations.set(b.id, msg);
        }
      }
    }
  }
  return violations;
}

const rules = [spacingRule, boundsRule, groupRule];

/**
 * Run all compliance rules against the placed obstacles.
 * @param {Array} placed - PlacedObstacle[]
 * @param {number} arenaW
 * @param {number} arenaH
 * @returns {Map<string, string>} id → violation message
 */
export function runRules(placed, arenaW, arenaH) {
  const violations = new Map();
  for (const rule of rules) {
    for (const [id, msg] of rule(placed, arenaW, arenaH)) {
      violations.set(id, msg);
    }
  }
  return violations;
}
```

- [ ] **Step 4: Create `src/utils/presets.js`**

```js
import { OBSTACLES, expandPreset } from '../data/obstacles';

/**
 * Build PlacedObstacle(s) for a given type at (cx, cy) world centre.
 * For presets, returns N individual pieces with shared groupId.
 * For single obstacles, returns an array of one.
 * @param {string} type - OBSTACLES[].id
 * @param {number} cx - world centre x
 * @param {number} cy - world centre y
 * @returns {Array} PlacedObstacle[] ready to append to store
 */
export function buildPresetPieces(type, cx, cy) {
  const pieces = expandPreset(type, cx, cy);
  const timestamp = Date.now();

  if (pieces) {
    const groupId = `${type}_${timestamp}`;
    return pieces.map((piece, i) => ({
      ...piece,
      id: `${timestamp}_${Math.random().toString(36).slice(2, 8)}_${i}`,
      groupId,
    }));
  }

  // Single obstacle
  const def = OBSTACLES.find((o) => o.id === type);
  if (!def) return [];
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
    },
  ];
}
```

- [ ] **Step 5: Create `src/utils/export.js`**

```js
// Stub — print/PDF export, implemented in Phase 2
export function renderPrintMap() {
  return null;
}
```

- [ ] **Step 6: Verify the dev server still runs**

Run: `npm run dev`
Expected: No import errors. App still renders the placeholder layout.

- [ ] **Step 7: Commit**

```bash
git add src/data/obstacles.js src/utils/coords.js src/utils/compliance.js src/utils/presets.js src/utils/export.js
git commit -m "feat: add obstacle data, coordinate utils, compliance engine, preset logic"
```

---

## Task 3: Zustand store

**Files:**
- Create: `src/store/useStore.js`

- [ ] **Step 1: Create `src/store/useStore.js`**

```js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { runRules } from '../utils/compliance';
import { buildPresetPieces } from '../utils/presets';

const useStore = create(
  persist(
    (set, get) => ({
      // Arena
      arenaW: 60,
      arenaH: 40,

      // Obstacles
      placed: [],
      selectedId: null,
      violations: new Map(),

      // Display
      showGrid: true,
      snapToGrid: true,
      showPath: true,
      viewMode: 'side',

      // Canvas transform
      zoom: 1,
      panX: 0,
      panY: 0,

      // Path style (stored now, used in Phase 2)
      pathLineType: 'dashed',
      pathLineWeight: 1.8,
      pathArrowSize: 1,

      // Routing (stubbed)
      visits: [],
      segments: [],
      classes: [],
      activeClassIdx: 0,
      selectedVisitId: null,

      // ── Actions ──

      setArena: (w, h) => {
        set({ arenaW: w, arenaH: h });
        get().runCompliance();
      },

      placeObstacle: (type, wx, wy) => {
        const { snapToGrid: snap } = get();
        const cx = snap ? Math.round(wx) : wx;
        const cy = snap ? Math.round(wy) : wy;
        const pieces = buildPresetPieces(type, cx, cy);
        set((s) => ({ placed: [...s.placed, ...pieces] }));
        get().runCompliance();
      },

      moveObstacle: (id, wx, wy) => {
        const { snapToGrid: snap, placed } = get();
        const ob = placed.find((p) => p.id === id);
        if (!ob) return;
        // Snap the centre, then store top-left
        const cx = wx + ob.w / 2;
        const cy = wy + ob.h / 2;
        const snappedCx = snap ? Math.round(cx) : cx;
        const snappedCy = snap ? Math.round(cy) : cy;
        const nx = snappedCx - ob.w / 2;
        const ny = snappedCy - ob.h / 2;
        set((s) => ({
          placed: s.placed.map((p) =>
            p.id === id ? { ...p, x: nx, y: ny } : p,
          ),
        }));
        get().runCompliance();
      },

      rotateObstacle: (id, degrees) => {
        set((s) => ({
          placed: s.placed.map((p) =>
            p.id === id
              ? { ...p, rotation: ((degrees % 360) + 360) % 360 }
              : p,
          ),
        }));
        get().runCompliance();
      },

      deleteObstacle: (id) => {
        set((s) => ({
          placed: s.placed.filter((p) => p.id !== id),
          selectedId: s.selectedId === id ? null : s.selectedId,
        }));
        get().runCompliance();
      },

      selectObstacle: (id) => set({ selectedId: id }),

      setShowGrid: (v) => set({ showGrid: v }),
      setSnapToGrid: (v) => set({ snapToGrid: v }),
      setShowPath: (v) => set({ showPath: v }),
      setViewMode: (v) => set({ viewMode: v }),
      setZoom: (z) => set({ zoom: Math.min(4, Math.max(0.25, z)) }),
      setPan: (x, y) => set({ panX: x, panY: y }),
      setPathStyle: (lineType, weight, arrowSize) =>
        set({ pathLineType: lineType, pathLineWeight: weight, pathArrowSize: arrowSize }),

      clearAll: () => set({ placed: [], selectedId: null, violations: new Map() }),

      runCompliance: () => {
        const { placed, arenaW, arenaH } = get();
        const violations = runRules(placed, arenaW, arenaH);
        set({ violations });
      },
    }),
    {
      name: 'we-course-designer',
      partialize: (state) => ({
        placed: state.placed,
        arenaW: state.arenaW,
        arenaH: state.arenaH,
        pathLineType: state.pathLineType,
        pathLineWeight: state.pathLineWeight,
        pathArrowSize: state.pathArrowSize,
      }),
    },
  ),
);

export default useStore;
```

- [ ] **Step 2: Smoke-test the store by importing it in `App.jsx`**

Temporarily add to `src/App.jsx`:

```jsx
import useStore from './store/useStore';

export default function App() {
  const arenaW = useStore((s) => s.arenaW);
  const arenaH = useStore((s) => s.arenaH);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f5f5f0]">
      <div className="h-[46px] border-b border-gray-200 bg-white flex items-center px-4 text-sm font-semibold">
        WE Course Designer — {arenaW} x {arenaH} m
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[162px] border-r border-gray-200 bg-white">Sidebar</div>
        <div className="flex-1 bg-[#c8d4c4]">Canvas</div>
        <div className="w-[172px] border-l border-gray-200 bg-white">Right panel</div>
      </div>
    </div>
  );
}
```

Run: `npm run dev`
Expected: Header shows "WE Course Designer — 60 x 40 m". No console errors.

- [ ] **Step 3: Commit**

```bash
git add src/store/useStore.js src/App.jsx
git commit -m "feat: add Zustand store with full state shape and localStorage persist"
```

---

## Task 4: Topbar component

**Files:**
- Create: `src/components/Topbar.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create `src/components/Topbar.jsx`**

```jsx
import useStore from '../store/useStore';

export default function Topbar() {
  const arenaW = useStore((s) => s.arenaW);
  const arenaH = useStore((s) => s.arenaH);
  const viewMode = useStore((s) => s.viewMode);
  const showGrid = useStore((s) => s.showGrid);
  const showPath = useStore((s) => s.showPath);
  const setViewMode = useStore((s) => s.setViewMode);
  const setShowGrid = useStore((s) => s.setShowGrid);
  const setShowPath = useStore((s) => s.setShowPath);
  const clearAll = useStore((s) => s.clearAll);

  const btnClass = (active) =>
    `text-xs px-3 py-1.5 border rounded-md cursor-pointer transition-all whitespace-nowrap ${
      active
        ? 'bg-[#f5f5f0] border-[#BA7517] text-[#BA7517] font-medium'
        : 'bg-white border-gray-200 text-gray-500 hover:bg-[#f5f5f0] hover:border-gray-400 hover:text-gray-800'
    }`;

  const viewBtnClass = (active) =>
    `text-[11px] px-2.5 py-1.5 border-r border-gray-200 last:border-r-0 cursor-pointer ${
      active ? 'bg-[#f0f8e8] text-[#3B6D11] font-medium' : 'bg-white text-gray-500 hover:text-gray-800'
    }`;

  return (
    <div className="h-[46px] border-b border-gray-200 bg-white flex items-center px-3.5 gap-2.5 shrink-0 shadow-sm">
      <div className="text-[15px] font-semibold text-[#1a1a18] tracking-tight whitespace-nowrap">
        WE Course Designer
      </div>
      <div className="text-[11px] text-gray-400 font-mono px-2 py-0.5 bg-[#f5f5f0] border border-[#e0e0da] rounded whitespace-nowrap">
        {arenaW} &times; {arenaH} m
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-gray-400">View:</span>
        <div className="flex border border-gray-200 rounded-md overflow-hidden">
          <button
            className={viewBtnClass(viewMode === 'side')}
            onClick={() => setViewMode('side')}
          >
            Sideline
          </button>
          <button
            className={viewBtnClass(viewMode === 'end')}
            onClick={() => setViewMode('end')}
          >
            Endline
          </button>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <button className={btnClass(showGrid)} onClick={() => setShowGrid(!showGrid)}>
          Grid
        </button>
        <button className={btnClass(showPath)} onClick={() => setShowPath(!showPath)}>
          Path
        </button>
        <button className={btnClass(false)} onClick={() => useStore.getState().fitArena?.()}>
          Fit
        </button>
        <button
          className="text-xs px-3 py-1.5 border border-gray-200 rounded-md bg-white text-gray-500 hover:border-red-400 hover:text-red-500 cursor-pointer transition-all"
          onClick={clearAll}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update `src/App.jsx` to use `Topbar`**

```jsx
import Topbar from './components/Topbar';

export default function App() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f5f5f0]">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[162px] border-r border-gray-200 bg-white">Sidebar</div>
        <div className="flex-1 bg-[#c8d4c4]">Canvas</div>
        <div className="w-[172px] border-l border-gray-200 bg-white">Right panel</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm run dev`
Expected: Topbar renders with title, arena pill, view toggle, Grid/Path/Fit/Clear buttons. Grid and Path start active. Clicking toggles them.

- [ ] **Step 4: Commit**

```bash
git add src/components/Topbar.jsx src/App.jsx
git commit -m "feat: add Topbar component with view toggle and toolbar"
```

---

## Task 5: Sidebar component

**Files:**
- Create: `src/components/Sidebar.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create `src/components/Sidebar.jsx`**

```jsx
import useStore from '../store/useStore';
import { OBSTACLES } from '../data/obstacles';

const CATEGORIES = [
  { label: 'Tunnor', ids: ['tunna', 'tva-tunnor', 'tre-tunnor', 'lans-tunna'] },
  { label: 'Slalom', ids: ['enkelslalom', 'parallellslalom', 'ryggning', 'korridor'] },
  { label: 'Barriärer', ids: ['grind', 'sidvarts', 'lydnad'] },
  { label: 'Strukturer', ids: ['trabro', 'vatten', 'falla', 'bord', 'hopp'] },
  { label: 'Lans & ring', ids: ['ring'] },
];

function Toggle({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-[11px] text-gray-500">{label}</span>
      <button
        className={`w-8 h-[17px] rounded-full relative cursor-pointer transition-colors ${
          value ? 'bg-[#3B6D11]' : 'bg-gray-300'
        }`}
        onClick={() => onChange(!value)}
      >
        <div
          className={`w-[11px] h-[11px] rounded-full bg-white absolute top-[3px] transition-[left] shadow-sm ${
            value ? 'left-[18px]' : 'left-[3px]'
          }`}
        />
      </button>
    </div>
  );
}

function ObstacleChip({ def }) {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('obstacleType', def.id);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-md border border-[#e8e8e4] bg-[#fafaf8] text-[11px] text-gray-500 cursor-grab select-none transition-all hover:border-[#BA7517] hover:text-[#1a1a18] hover:bg-[#fff8ee]"
    >
      <svg
        width="20"
        height="20"
        viewBox={def.viewBox}
        className="shrink-0"
        dangerouslySetInnerHTML={{ __html: def.svg }}
      />
      <span className="truncate">{def.label}</span>
    </div>
  );
}

export default function Sidebar() {
  const arenaW = useStore((s) => s.arenaW);
  const arenaH = useStore((s) => s.arenaH);
  const showGrid = useStore((s) => s.showGrid);
  const snapToGrid = useStore((s) => s.snapToGrid);
  const showPath = useStore((s) => s.showPath);
  const pathLineType = useStore((s) => s.pathLineType);
  const pathLineWeight = useStore((s) => s.pathLineWeight);
  const pathArrowSize = useStore((s) => s.pathArrowSize);
  const setArena = useStore((s) => s.setArena);
  const setShowGrid = useStore((s) => s.setShowGrid);
  const setSnapToGrid = useStore((s) => s.setSnapToGrid);
  const setShowPath = useStore((s) => s.setShowPath);
  const setPathStyle = useStore((s) => s.setPathStyle);

  return (
    <div className="w-[162px] border-r border-gray-200 flex flex-col shrink-0 bg-white overflow-y-auto">
      {/* Arena inputs */}
      <div className="p-2.5 border-b border-gray-100">
        <div className="text-[9px] tracking-widest uppercase text-gray-300 font-mono mb-2">
          Arena (meters)
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-500">Width</span>
            <input
              type="number"
              min="10"
              max="120"
              value={arenaW}
              onChange={(e) => setArena(Number(e.target.value) || 10, arenaH)}
              className="w-14 text-[11px] font-mono border border-gray-200 rounded px-1.5 py-0.5 bg-[#f9f9f7] text-[#1a1a18] text-right focus:outline-none focus:border-[#BA7517]"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-500">Length</span>
            <input
              type="number"
              min="10"
              max="120"
              value={arenaH}
              onChange={(e) => setArena(arenaW, Number(e.target.value) || 10)}
              className="w-14 text-[11px] font-mono border border-gray-200 rounded px-1.5 py-0.5 bg-[#f9f9f7] text-[#1a1a18] text-right focus:outline-none focus:border-[#BA7517]"
            />
          </div>
        </div>
      </div>

      {/* Display toggles */}
      <div className="p-2.5 border-b border-gray-100">
        <div className="text-[9px] tracking-widest uppercase text-gray-300 font-mono mb-2">
          Display
        </div>
        <Toggle label="Grid" value={showGrid} onChange={setShowGrid} />
        <Toggle label="Snap to grid" value={snapToGrid} onChange={setSnapToGrid} />
        <Toggle label="Course path" value={showPath} onChange={setShowPath} />
      </div>

      {/* Path style */}
      <div className="p-2.5 border-b border-gray-100">
        <div className="text-[9px] tracking-widest uppercase text-gray-300 font-mono mb-2">
          Path style
        </div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-gray-500">Line</span>
          <select
            value={pathLineType}
            onChange={(e) => setPathStyle(e.target.value, pathLineWeight, pathArrowSize)}
            className="text-[11px] border border-gray-200 rounded px-1 py-0.5 bg-[#f9f9f7] text-[#1a1a18]"
          >
            <option value="dashed">Dashed</option>
            <option value="solid">Solid</option>
            <option value="dotted">Dotted</option>
          </select>
        </div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-gray-500">Weight</span>
          <div className="flex items-center gap-1">
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.5"
              value={pathLineWeight}
              onChange={(e) => setPathStyle(pathLineType, Number(e.target.value), pathArrowSize)}
              className="w-[60px]"
            />
            <span className="text-[10px] font-mono text-gray-400 min-w-[22px]">
              {pathLineWeight}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-500">Arrows</span>
          <div className="flex gap-0.5">
            {[
              { label: 'S', value: 0.5 },
              { label: 'M', value: 1 },
              { label: 'L', value: 1.8 },
            ].map(({ label, value }) => (
              <button
                key={label}
                className={`text-[11px] px-2 py-0.5 border rounded cursor-pointer ${
                  pathArrowSize === value
                    ? 'bg-[#f5f5f0] border-[#BA7517] text-[#BA7517] font-medium'
                    : 'bg-white border-gray-200 text-gray-500'
                }`}
                onClick={() => setPathStyle(pathLineType, pathLineWeight, value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Obstacle chips */}
      <div className="p-2.5">
        <div className="text-[9px] tracking-widest uppercase text-gray-300 font-mono mb-2">
          Obstacles — drag to arena
        </div>
        <div className="flex flex-col gap-2">
          {CATEGORIES.map((cat) => (
            <div key={cat.label}>
              <div className="text-[9px] text-gray-300 font-mono mb-1">{cat.label}</div>
              <div className="flex flex-col gap-0.5">
                {cat.ids.map((id) => {
                  const def = OBSTACLES.find((o) => o.id === id);
                  return def ? <ObstacleChip key={id} def={def} /> : null;
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update `src/App.jsx`**

```jsx
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';

export default function App() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f5f5f0]">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 bg-[#c8d4c4]">Canvas</div>
        <div className="w-[172px] border-l border-gray-200 bg-white">Right panel</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm run dev`
Expected: Sidebar renders with arena inputs, toggles, path style controls, and obstacle chips grouped by category. Chips show SVG thumbnails. Dragging a chip starts HTML5 drag (ghost image follows cursor).

- [ ] **Step 4: Commit**

```bash
git add src/components/Sidebar.jsx src/App.jsx
git commit -m "feat: add Sidebar with arena inputs, toggles, path style, obstacle chips"
```

---

## Task 6: Canvas with arena and grid

**Files:**
- Create: `src/components/Canvas.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create `src/components/Canvas.jsx`**

```jsx
import { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect, Line, Text } from 'react-konva';
import useStore from '../store/useStore';
import { OBSTACLES } from '../data/obstacles';
import { worldToScreen, screenToWorld } from '../utils/coords';
import ObstacleGroup from './ObstacleGroup';

const MARGIN = 60;

function getEffectiveArena(arenaW, arenaH, viewMode) {
  return viewMode === 'side' ? { w: arenaW, h: arenaH } : { w: arenaH, h: arenaW };
}

function getBaseScale(stageW, stageH, arenaW, arenaH, viewMode) {
  const ea = getEffectiveArena(arenaW, arenaH, viewMode);
  return Math.min((stageW - MARGIN) / ea.w, (stageH - MARGIN) / ea.h);
}

function GridLines({ ea, scale, panX, panY }) {
  const lines = [];

  // Minor grid (1m)
  for (let i = 0; i <= ea.w; i++) {
    const x = panX + i * scale;
    lines.push(
      <Line key={`vm${i}`} points={[x, panY, x, panY + ea.h * scale]} stroke="rgba(0,0,0,0.06)" strokeWidth={0.5} />,
    );
  }
  for (let j = 0; j <= ea.h; j++) {
    const y = panY + j * scale;
    lines.push(
      <Line key={`hm${j}`} points={[panX, y, panX + ea.w * scale, y]} stroke="rgba(0,0,0,0.06)" strokeWidth={0.5} />,
    );
  }
  // Major grid (5m)
  for (let i = 0; i <= ea.w; i += 5) {
    const x = panX + i * scale;
    lines.push(
      <Line key={`vM${i}`} points={[x, panY, x, panY + ea.h * scale]} stroke="rgba(0,0,0,0.15)" strokeWidth={0.8} />,
    );
  }
  for (let j = 0; j <= ea.h; j += 5) {
    const y = panY + j * scale;
    lines.push(
      <Line key={`hM${j}`} points={[panX, y, panX + ea.w * scale, y]} stroke="rgba(0,0,0,0.15)" strokeWidth={0.8} />,
    );
  }

  return <>{lines}</>;
}

function GridLabels({ ea, scale, panX, panY }) {
  const labels = [];
  const fs = Math.max(9, Math.min(11, scale * 0.7));

  for (let i = 0; i <= ea.w; i += 5) {
    labels.push(
      <Text
        key={`lx${i}`}
        x={panX + i * scale + 2}
        y={panY + ea.h * scale + 3}
        text={`${i}m`}
        fontSize={fs}
        fontFamily="monospace"
        fill="rgba(0,0,0,0.28)"
      />,
    );
  }
  for (let j = 0; j <= ea.h; j += 5) {
    labels.push(
      <Text
        key={`ly${j}`}
        x={panX - 28}
        y={panY + j * scale - fs / 2}
        text={`${j}m`}
        fontSize={fs}
        fontFamily="monospace"
        fill="rgba(0,0,0,0.28)"
      />,
    );
  }

  return <>{labels}</>;
}

export default function Canvas() {
  const containerRef = useRef(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });

  const arenaW = useStore((s) => s.arenaW);
  const arenaH = useStore((s) => s.arenaH);
  const viewMode = useStore((s) => s.viewMode);
  const zoom = useStore((s) => s.zoom);
  const panX = useStore((s) => s.panX);
  const panY = useStore((s) => s.panY);
  const showGrid = useStore((s) => s.showGrid);
  const placed = useStore((s) => s.placed);
  const selectedId = useStore((s) => s.selectedId);
  const snapToGrid = useStore((s) => s.snapToGrid);
  const violations = useStore((s) => s.violations);
  const setZoom = useStore((s) => s.setZoom);
  const setPan = useStore((s) => s.setPan);
  const selectObstacle = useStore((s) => s.selectObstacle);
  const placeObstacle = useStore((s) => s.placeObstacle);
  const moveObstacle = useStore((s) => s.moveObstacle);
  const rotateObstacle = useStore((s) => s.rotateObstacle);

  // ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setStageSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const baseScale = getBaseScale(stageSize.width, stageSize.height, arenaW, arenaH, viewMode);
  const scale = baseScale * zoom;
  const ea = getEffectiveArena(arenaW, arenaH, viewMode);

  // Fit arena (called from Topbar via store)
  const fitArena = useCallback(() => {
    const bs = getBaseScale(stageSize.width, stageSize.height, arenaW, arenaH, viewMode);
    const ea2 = getEffectiveArena(arenaW, arenaH, viewMode);
    useStore.setState({
      zoom: 1,
      panX: (stageSize.width - ea2.w * bs) / 2,
      panY: (stageSize.height - ea2.h * bs) / 2,
    });
  }, [stageSize.width, stageSize.height, arenaW, arenaH, viewMode]);

  // Expose fitArena on store so Topbar can call it
  useEffect(() => {
    useStore.setState({ fitArena });
  }, [fitArena]);

  // Auto-fit on first render and when arena dimensions change
  useEffect(() => {
    fitArena();
  }, [fitArena]);

  // Coordinate context for worldToScreen/screenToWorld
  const coordCtx = { panX, panY, scale, viewMode, arenaH };

  // Wheel zoom
  const handleWheel = (e) => {
    e.evt.preventDefault();
    const delta = e.evt.deltaY > 0 ? 0.9 : 1.1;
    setZoom(zoom * delta);
  };

  // Pan state
  const panRef = useRef({ isPanning: false, startX: 0, startY: 0, startPanX: 0, startPanY: 0 });

  const handleMouseDown = (e) => {
    // Middle mouse or space+click
    if (e.evt.button === 1 || (e.evt.button === 0 && e.evt.shiftKey)) {
      panRef.current = {
        isPanning: true,
        startX: e.evt.clientX,
        startY: e.evt.clientY,
        startPanX: panX,
        startPanY: panY,
      };
      e.evt.preventDefault();
    }
  };

  const handleMouseMove = (e) => {
    if (!panRef.current.isPanning) return;
    const dx = e.evt.clientX - panRef.current.startX;
    const dy = e.evt.clientY - panRef.current.startY;
    setPan(panRef.current.startPanX + dx, panRef.current.startPanY + dy);
  };

  const handleMouseUp = () => {
    panRef.current.isPanning = false;
  };

  // Click on empty canvas → deselect
  const handleStageClick = (e) => {
    if (e.target === e.target.getStage()) {
      selectObstacle(null);
    }
  };

  // Drop from sidebar
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('obstacleType');
    if (!type) return;
    const rect = containerRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const [wx, wy] = screenToWorld(sx, sy, coordCtx);
    placeObstacle(type, wx, wy);
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden bg-[#c8d4c4] cursor-crosshair"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Stage
        width={stageSize.width}
        height={stageSize.height}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleStageClick}
      >
        <Layer>
          {/* Arena background */}
          <Rect
            x={panX}
            y={panY}
            width={ea.w * scale}
            height={ea.h * scale}
            fill="#b4c4aa"
          />

          {/* Grid */}
          {showGrid && <GridLines ea={ea} scale={scale} panX={panX} panY={panY} />}
          {showGrid && <GridLabels ea={ea} scale={scale} panX={panX} panY={panY} />}

          {/* Arena border */}
          <Rect
            x={panX}
            y={panY}
            width={ea.w * scale}
            height={ea.h * scale}
            stroke="#4a7044"
            strokeWidth={2}
          />

          {/* Obstacles */}
          {placed.map((p, idx) => {
            const def = OBSTACLES.find((o) => o.id === p.type);
            if (!def) return null;
            return (
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
              />
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}
```

- [ ] **Step 2: Update `src/App.jsx`**

```jsx
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';

export default function App() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f5f5f0]">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <Canvas />
        <div className="w-[172px] border-l border-gray-200 bg-white">Right panel</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create a minimal `src/components/ObstacleGroup.jsx` stub so the import doesn't break**

```jsx
export default function ObstacleGroup() {
  return null;
}
```

- [ ] **Step 4: Verify**

Run: `npm run dev`
Expected: Green arena rect fills the canvas centre. Grid lines visible (1m minor, 5m major). Grid labels at 5m intervals along edges. Arena border drawn. Scroll wheel zooms. Shift+drag pans. Grid toggle hides/shows grid.

- [ ] **Step 5: Commit**

```bash
git add src/components/Canvas.jsx src/components/ObstacleGroup.jsx src/App.jsx
git commit -m "feat: add Canvas with arena, grid, zoom/pan, and drop target"
```

---

## Task 7: ObstacleGroup — SVG rendering and drag

**Files:**
- Modify: `src/components/ObstacleGroup.jsx`

- [ ] **Step 1: Implement `useSvgImage` hook and full `ObstacleGroup`**

```jsx
import { useRef, useState, useEffect, useMemo } from 'react';
import { Group, Image as KonvaImage, Rect, Circle, Line, Text } from 'react-konva';
import { SCALE } from '../data/obstacles';
import { worldToScreen, screenToWorld } from '../utils/coords';

// Module-level cache: key → HTMLImageElement
const imageCache = new Map();

function useSvgImage(svg, viewBox, pixelW, pixelH) {
  const [image, setImage] = useState(null);
  const key = `${svg}|${pixelW}|${pixelH}`;

  useEffect(() => {
    if (imageCache.has(key)) {
      setImage(imageCache.get(key));
      return;
    }

    const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${pixelW}" height="${pixelH}" viewBox="${viewBox}">${svg}</svg>`;
    const blob = new Blob([fullSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new window.Image();
    img.onload = () => {
      imageCache.set(key, img);
      setImage(img);
    };
    img.src = url;

    return () => URL.revokeObjectURL(url);
  }, [key, svg, viewBox, pixelW, pixelH]);

  return image;
}

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
}) {
  const groupRef = useRef(null);

  // SVG image
  const pixelW = def.w * SCALE;
  const pixelH = def.h * SCALE;
  const image = useSvgImage(def.svg, def.viewBox, pixelW, pixelH);

  // Screen position of obstacle centre
  const [sx, sy] = worldToScreen(placed.x + placed.w / 2, placed.y + placed.h / 2, coordCtx);

  // Scaled dimensions on screen
  const drawW = placed.w * scale;
  const drawH = placed.h * scale;

  // Number badge
  const badgeSx = sx + (placed.badgeOffX || 0) * scale;
  const badgeSy = sy + (placed.badgeOffY || 0) * scale;
  const badgeR = Math.max(9, Math.min(14, scale * 0.6));

  // Rotation handle position (above obstacle, in local coords before rotation)
  const handleDist = drawH / 2 + badgeR * 2 + 18;

  // Obstacle stroke colour
  const strokeColor = violation ? '#E24B4A' : isSelected ? '#BA7517' : 'rgba(0,0,0,0.3)';

  // Handle drag end — convert screen position back to world top-left
  const handleDragEnd = (e) => {
    const node = e.target;
    const newSx = node.x();
    const newSy = node.y();
    const [wx, wy] = screenToWorld(newSx, newSy, coordCtx);
    // wx, wy is the centre; moveObstacle expects top-left
    onMove(wx - placed.w / 2, wy - placed.h / 2);
    // Reset Konva node position to the store-driven position
    node.position({ x: sx, y: sy });
  };

  // Rotation handle drag
  const handleRotateDrag = (e) => {
    const node = e.target;
    const dx = node.x() - sx;
    const dy = node.y() - sy;
    let angle = (Math.atan2(dx, -dy) * 180) / Math.PI;
    if (snapToGrid) {
      angle = Math.round(angle / 45) * 45;
    }
    angle = ((angle % 360) + 360) % 360;
    onRotate(angle);

    // Reset handle position — it will be redrawn from rotation state
    const rotRad = (angle * Math.PI) / 180;
    node.position({
      x: sx + Math.sin(rotRad) * handleDist,
      y: sy - Math.cos(rotRad) * handleDist,
    });
  };

  const rotRad = ((placed.rotation || 0) * Math.PI) / 180;
  const handleX = sx + Math.sin(rotRad) * handleDist;
  const handleY = sy - Math.cos(rotRad) * handleDist;

  return (
    <>
      {/* Main draggable group */}
      <Group
        ref={groupRef}
        x={sx}
        y={sy}
        draggable
        onDragEnd={handleDragEnd}
        onClick={(e) => {
          e.cancelBubble = true;
          onSelect();
        }}
        rotation={placed.rotation || 0}
        offsetX={0}
        offsetY={0}
      >
        {/* SVG image, centred */}
        {image && (
          <KonvaImage
            image={image}
            x={-drawW / 2}
            y={-drawH / 2}
            width={drawW}
            height={drawH}
          />
        )}

        {/* Obstacle bounding rect */}
        <Rect
          x={-drawW / 2}
          y={-drawH / 2}
          width={drawW}
          height={drawH}
          stroke={strokeColor}
          strokeWidth={isSelected ? 2.5 : 1}
        />

        {/* Selection outline */}
        {isSelected && (
          <Rect
            x={-drawW / 2 - 5}
            y={-drawH / 2 - 5}
            width={drawW + 10}
            height={drawH + 10}
            stroke="rgba(186,117,23,0.4)"
            strokeWidth={1}
            dash={[4, 3]}
          />
        )}
      </Group>

      {/* Leader line from centre to badge */}
      <Line
        points={[sx, sy, badgeSx, badgeSy]}
        stroke="rgba(186,117,23,0.35)"
        strokeWidth={1}
        dash={[3, 4]}
      />

      {/* Number badge */}
      <Circle
        x={badgeSx}
        y={badgeSy}
        radius={badgeR}
        fill={violation ? '#E24B4A' : '#BA7517'}
      />
      {isSelected && (
        <Circle
          x={badgeSx}
          y={badgeSy}
          radius={badgeR + 4}
          stroke="rgba(186,117,23,0.5)"
          strokeWidth={2}
        />
      )}
      <Text
        x={badgeSx - badgeR}
        y={badgeSy - badgeR / 2}
        width={badgeR * 2}
        height={badgeR}
        text={String(index + 1)}
        fontSize={Math.max(8, badgeR)}
        fontFamily="monospace"
        fontStyle="bold"
        fill="#fff"
        align="center"
        verticalAlign="middle"
      />

      {/* Rotation handle (visible when selected) */}
      {isSelected && (
        <>
          <Line
            points={[sx, sy - drawH / 2, handleX, handleY + 7]}
            stroke="rgba(186,117,23,0.6)"
            strokeWidth={1}
            dash={[3, 3]}
          />
          <Circle
            x={handleX}
            y={handleY}
            radius={7}
            fill="#BA7517"
            draggable
            onDragMove={handleRotateDrag}
          />
        </>
      )}
    </>
  );
}
```

- [ ] **Step 2: Verify drag-drop placement and obstacle rendering**

Run: `npm run dev`
Expected: Drag a "Tunna" chip from sidebar → drops on canvas as a black filled circle. Drag it on canvas → moves. Click → selection outline appears. Rotation handle visible above selected obstacle.

- [ ] **Step 3: Verify rotation handle**

Expected: Drag the orange rotation handle circle → obstacle rotates. With "Snap to grid" on, rotates in 45° increments. The obstacle's SVG image rotates with it.

- [ ] **Step 4: Verify preset drops**

Drag "Två tunnor" from sidebar → two individual tunna circles appear with ~3m spacing. Each is independently draggable.

- [ ] **Step 5: Commit**

```bash
git add src/components/ObstacleGroup.jsx
git commit -m "feat: add ObstacleGroup with SVG rendering, drag, rotation handle, badge"
```

---

## Task 8: Right panel — Properties, Sequence, Compliance

**Files:**
- Create: `src/components/RightPanel.jsx`
- Create: `src/components/PropertiesPanel.jsx`
- Create: `src/components/SequenceList.jsx`
- Create: `src/components/CompliancePanel.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create `src/components/PropertiesPanel.jsx`**

```jsx
import useStore from '../store/useStore';
import { OBSTACLES } from '../data/obstacles';

export default function PropertiesPanel() {
  const selectedId = useStore((s) => s.selectedId);
  const placed = useStore((s) => s.placed);
  const rotateObstacle = useStore((s) => s.rotateObstacle);

  const obstacle = placed.find((p) => p.id === selectedId);

  if (!obstacle) {
    return <div className="text-gray-300 text-[11px]">Select an obstacle</div>;
  }

  const def = OBSTACLES.find((o) => o.id === obstacle.type);
  const rotation = Math.round(obstacle.rotation || 0);

  const handleRotationInput = (e) => {
    const deg = parseFloat(e.target.value) || 0;
    rotateObstacle(obstacle.id, deg);
  };

  const rotate = (delta) => rotateObstacle(obstacle.id, rotation + delta);
  const resetRotation = () => rotateObstacle(obstacle.id, 0);

  return (
    <div>
      <PropRow label="Type" value={def?.label || obstacle.type} />
      <PropRow label="X" value={`${obstacle.x.toFixed(1)} m`} />
      <PropRow label="Y" value={`${obstacle.y.toFixed(1)} m`} />
      <PropRow label="Width" value={`${obstacle.w} m`} />
      <PropRow label="Height" value={`${obstacle.h} m`} />

      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-gray-400">Rotation</span>
        <span className="flex items-center gap-1">
          <input
            type="number"
            min="0"
            max="359"
            step="1"
            value={rotation}
            onChange={handleRotationInput}
            className="w-[46px] text-[11px] font-mono border border-gray-200 rounded px-1 py-0.5 bg-[#f9f9f7] text-right focus:outline-none focus:border-[#BA7517]"
          />
          <span className="text-[10px] text-gray-400">&deg;</span>
        </span>
      </div>

      <div className="flex gap-0.5 mt-1">
        <RotBtn label="↺ 90°" onClick={() => rotate(-90)} />
        <RotBtn label="↻ 90°" onClick={() => rotate(90)} />
        <RotBtn label="↻ 45°" onClick={() => rotate(45)} />
        <RotBtn label="Reset" onClick={resetRotation} />
      </div>
    </div>
  );
}

function PropRow({ label, value }) {
  return (
    <div className="flex items-center justify-between mb-1">
      <span className="text-[10px] text-gray-400">{label}</span>
      <span className="font-mono text-[10px] text-[#1a1a18] bg-[#f5f5f0] border border-[#e0e0da] px-1.5 py-0.5 rounded">
        {value}
      </span>
    </div>
  );
}

function RotBtn({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-[11px] px-2 py-0.5 border border-gray-200 rounded bg-white text-gray-500 hover:bg-[#f5f5f0] hover:border-gray-400 cursor-pointer"
    >
      {label}
    </button>
  );
}
```

- [ ] **Step 2: Create `src/components/SequenceList.jsx`**

```jsx
import { useRef } from 'react';
import useStore from '../store/useStore';
import { OBSTACLES } from '../data/obstacles';

export default function SequenceList() {
  const placed = useStore((s) => s.placed);
  const selectedId = useStore((s) => s.selectedId);
  const selectObstacle = useStore((s) => s.selectObstacle);
  const deleteObstacle = useStore((s) => s.deleteObstacle);
  const dragIdx = useRef(null);

  if (!placed.length) {
    return <div className="text-gray-300 text-[11px]">No obstacles placed</div>;
  }

  const handleDragStart = (idx) => {
    dragIdx.current = idx;
  };

  const handleDrop = (targetIdx) => {
    if (dragIdx.current === null || dragIdx.current === targetIdx) return;
    const newPlaced = [...placed];
    const [moved] = newPlaced.splice(dragIdx.current, 1);
    newPlaced.splice(targetIdx, 0, moved);
    useStore.setState({ placed: newPlaced });
    dragIdx.current = null;
  };

  return (
    <div className="flex flex-col gap-0.5">
      {placed.map((p, idx) => {
        const def = OBSTACLES.find((o) => o.id === p.type);
        const isSel = p.id === selectedId;

        return (
          <div
            key={p.id}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(idx)}
            onClick={() => selectObstacle(p.id)}
            className={`flex items-center gap-1.5 px-1.5 py-1 rounded border text-[11px] cursor-pointer select-none transition-colors ${
              isSel
                ? 'border-[#BA7517] bg-[#fff8ee] text-[#1a1a18]'
                : 'border-gray-100 bg-[#fafaf8] text-gray-500 hover:border-[#BA7517]'
            }`}
          >
            <span className="text-gray-300 text-[11px] cursor-grab shrink-0">&#x2807;</span>
            <span
              className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold font-mono shrink-0"
              style={{ background: '#BA7517' }}
            >
              {idx + 1}
            </span>
            <span className="flex-1 truncate">{def?.label || p.type}</span>
            <span
              className="text-gray-300 text-[10px] cursor-pointer shrink-0 hover:text-red-500"
              onClick={(e) => {
                e.stopPropagation();
                deleteObstacle(p.id);
              }}
            >
              &#x2715;
            </span>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/CompliancePanel.jsx`**

```jsx
import useStore from '../store/useStore';

export default function CompliancePanel() {
  const placed = useStore((s) => s.placed);
  const violations = useStore((s) => s.violations);

  if (!placed.length) {
    return <div className="text-gray-300 text-[11px]">No obstacles placed</div>;
  }

  const spacingOk = ![...violations.values()].some((msg) => msg.includes('avstånd') || msg.includes('pinnavstånd'));
  const boundsOk = ![...violations.values()].some((msg) => msg.includes('utanför'));

  return (
    <div className="flex flex-col gap-0.5">
      <ComplianceItem
        ok={spacingOk}
        text={spacingOk ? 'Spacing OK' : `${violations.size} spacing issue(s)`}
      />
      <ComplianceItem
        ok={boundsOk}
        text={boundsOk ? 'All within arena' : 'Obstacle out of bounds'}
      />
      <ComplianceItem ok={true} text={`${placed.length} obstacle(s)`} />
    </div>
  );
}

function ComplianceItem({ ok, text }) {
  return (
    <div
      className={`flex items-center gap-1.5 px-1.5 py-1 rounded border text-[10px] ${
        ok
          ? 'bg-[#f0f8ea] border-[#b8dda0] text-[#3B6D11]'
          : 'bg-[#fef0ee] border-[#f5b8b0] text-[#A32D2D]'
      }`}
    >
      <div
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${ok ? 'bg-[#3B6D11]' : 'bg-[#E24B4A]'}`}
      />
      {text}
    </div>
  );
}
```

- [ ] **Step 4: Create `src/components/RightPanel.jsx`**

```jsx
import PropertiesPanel from './PropertiesPanel';
import SequenceList from './SequenceList';
import CompliancePanel from './CompliancePanel';

function Section({ label, children }) {
  return (
    <div className="p-2.5 border-b border-gray-100 last:border-b-0">
      <div className="text-[9px] tracking-widest uppercase text-gray-300 font-mono mb-2">
        {label}
      </div>
      {children}
    </div>
  );
}

export default function RightPanel() {
  return (
    <div className="w-[172px] border-l border-gray-200 flex flex-col shrink-0 bg-white overflow-y-auto">
      <Section label="Properties">
        <PropertiesPanel />
      </Section>
      <Section label="Sequence — drag to reorder">
        <SequenceList />
      </Section>
      <Section label="Compliance">
        <CompliancePanel />
      </Section>
    </div>
  );
}
```

- [ ] **Step 5: Create stub components**

`src/components/ClassesModal.jsx`:
```jsx
export default function ClassesModal() {
  return null;
}
```

`src/components/PrintPreview.jsx`:
```jsx
export default function PrintPreview() {
  return null;
}
```

- [ ] **Step 6: Update `src/App.jsx` to use all components**

```jsx
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import RightPanel from './components/RightPanel';

export default function App() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f5f5f0]">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <Canvas />
        <RightPanel />
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Verify the full UI**

Run: `npm run dev`
Expected:
- Full three-column layout with Topbar
- Drop obstacle → appears in canvas AND sequence list
- Click obstacle → properties panel shows type/x/y/rotation
- Rotation buttons work (↺90° / ↻90° / ↻45° / Reset)
- Delete from sequence list removes obstacle from canvas
- Place two obstacles close → compliance panel shows spacing warning
- Drag obstacle outside arena → compliance panel shows bounds warning

- [ ] **Step 8: Commit**

```bash
git add src/components/RightPanel.jsx src/components/PropertiesPanel.jsx src/components/SequenceList.jsx src/components/CompliancePanel.jsx src/components/ClassesModal.jsx src/components/PrintPreview.jsx src/App.jsx
git commit -m "feat: add right panel with properties, sequence list, compliance"
```

---

## Task 9: End-to-end verification and polish

**Files:**
- Possibly adjust: any file with minor bugs found during testing

- [ ] **Step 1: Verify all 15 acceptance criteria**

Run `npm run dev` and check each:

1. App loads with topbar, sidebar, canvas, right panel
2. Topbar shows "WE Course Designer"
3. Arena inputs update canvas live
4. Grid toggle shows/hides grid
5. Drag obstacle chip → drops at cursor, snapped to 1m grid, renders as SVG
6. Drag obstacle on canvas → moves, snaps, badge follows
7. Click → properties panel updates; selection outline + rotation handle
8. Drag rotation handle → rotates; snaps 45° with snap on
9. Sequence list shows placed obstacles; reorder + delete work
10. Two obstacles < 6m apart → compliance warning
11. Obstacle partly outside arena → bounds warning
12. `tva-tunnor` chip → drops two `tunna` pieces with shared `groupId`
13. Mouse wheel → zoom; Fit → recenters
14. Reload → obstacles restored from localStorage
15. Sideline/Endline toggle → coordinate axes swap

- [ ] **Step 2: Fix any issues found**

If bugs are found, fix them in the relevant file and re-verify.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "fix: address issues found during end-to-end verification"
```

(Skip this commit if no fixes were needed.)

- [ ] **Step 4: Verify build succeeds**

Run: `npm run build`
Expected: Vite build completes with no errors. Output in `dist/`.

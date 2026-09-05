# Tutorial Tour Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 9-step guided spotlight tour that runs on a user's first visit and can be replayed from an **Introduktion** button in the topbar.

**Architecture:** A non-persisted Zustand store (`useTourStore`) holds `{active, stepIdx}`. Step copy lives in a plain data module (`src/data/tourSteps.ts`). A single `TourOverlay` component, portalled to `document.body`, reads the current step, resolves its target via `document.querySelector('[data-tour="..."]')`, and paints a spotlight using a large `box-shadow` spread. Target components gain only `data-tour` attributes — no logic changes — except `RightPanel`, whose tab state moves into the main store so the tour can drive it.

**Tech Stack:** React 18.3.1, TypeScript 6.0.2, Zustand 5.0.5, Tailwind 3.4.17, Vite 6.3.1. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-04-tutorial-tour-design.md`

## Global Constraints

- **Branch:** all work on `feature/tutorial-tour`. Never commit to `main`.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).
- **No test suite exists in this project.** There is no `npm test`. Every task's verification is `npm run typecheck` plus, where the task changes visible behaviour, driving the running app with Playwright. Do not invent a test framework or add one.
- **All UI copy is in Swedish**, matching existing text (Spara, Öppna, Rensa, Ridväg, Rutnät, Anpassa, Skriv ut, Sekvens, Klasser).
- **Styling tokens:** `#BA7517` accent, `#f5f5f0` card ground, `#1a1a18` primary text, `text-gray-600` body copy, `font-mono` + `text-[10px] tracking-widest uppercase` for small labels.
- **No new npm dependencies.** The overlay is hand-built; no tour library.
- **Step count is never hardcoded** — always derived from `tourSteps.length`.
- Existing sidebars are `w-[192px]`; the topbar is `h-[46px]`; the print dropdown uses `z-50`, so the overlay must sit above it.

---

### Task 1: Move right-panel tab state into the store

`RightPanel` currently owns its active tab in a local `useState`. The tour needs to switch it (step 7 → Klasser, step 8 → Sekvens) and restore it on exit, so it becomes non-persisted store state alongside `selectedId`/`showGrid`/`viewMode`.

**Files:**
- Modify: `src/store/useStore.ts` (interface ~line 27-31, initial state ~line 160-167, actions ~line 365-368, `partialize` ~line 575)
- Modify: `src/components/RightPanel.tsx:1-42`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `type RightPanelTab = 'sequence' | 'classes'` exported from `src/store/useStore.ts`
  - `StoreState.rightPanelTab: RightPanelTab`
  - `StoreState.setRightPanelTab: (t: RightPanelTab) => void`

- [ ] **Step 1: Add the type and interface members to the store**

In `src/store/useStore.ts`, near the top of the file with the other type declarations (above `interface StoreState`), add:

```ts
export type RightPanelTab = 'sequence' | 'classes';
```

In `interface StoreState`, in the `// Display` block (the one holding `showGrid`, `snapToGrid`, `showPath`, `viewMode`), add:

```ts
  rightPanelTab: RightPanelTab;
```

In the `// Actions — display` block of the interface (alongside `setViewMode`), add:

```ts
  setRightPanelTab: (t: RightPanelTab) => void;
```

- [ ] **Step 2: Add the initial value and the action**

In the returned state object, in the `// Display` block next to `viewMode: 'end',`, add:

```ts
        rightPanelTab: 'sequence',
```

In the `// ── Actions — display ──` section next to `setViewMode`, add:

```ts
        setRightPanelTab: (t) => set({ rightPanelTab: t }),
```

- [ ] **Step 3: Confirm the tab is NOT persisted**

Read the `partialize` function (~line 575). It returns a `PersistedState` built from an explicit list of keys. Verify `rightPanelTab` is **not** in that list and do not add it — this is view state, and adding it would also break `PersistedState`, which is the shape of saved course files.

Run: `grep -n "rightPanelTab" src/store/useStore.ts`
Expected: exactly three hits — the interface field, the interface action, and the initial value — plus the action implementation. No hit inside `partialize`.

- [ ] **Step 4: Point RightPanel at the store**

In `src/components/RightPanel.tsx`, replace the local state. Remove the `useState` import if nothing else uses it (it doesn't), remove the local `type Tab` declaration, and use the store:

```tsx
import type { ReactNode } from 'react';
import useStore from '../store/useStore';
import type { RightPanelTab } from '../store/useStore';
import PropertiesPanel from './PropertiesPanel';
import SequenceList from './SequenceList';
import CompliancePanel from './CompliancePanel';
import EventMetaForm from './EventMetaForm';
import ClassesPanel from './ClassesPanel';
```

Then inside the component, replace `const [tab, setTab] = useState<Tab>('sequence');` with:

```tsx
  const tab = useStore((s) => s.rightPanelTab);
  const setTab = useStore((s) => s.setRightPanelTab);
```

and change the `tabBtn` signature from `(t: Tab, label: string)` to `(t: RightPanelTab, label: string)`. Everything else in the file is unchanged — `tab === t`, `tab === 'sequence'`, and `tab === 'classes'` all still work.

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: exits 0, no output.

- [ ] **Step 6: Verify the tabs still work in the browser**

Start the dev server if it isn't running (`npm run dev`, default `http://localhost:5173`), then run this Playwright script from the scratchpad directory:

```js
import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await (await browser.newContext()).newPage();
page.on('pageerror', (e) => console.log('PAGE ERROR:', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE ERROR:', m.text()); });
await page.goto('http://localhost:5173');
await page.waitForSelector('text=WE Course Designer');
await page.click('button:has-text("Klasser")');
await page.waitForTimeout(200);
console.log('classes visible:', await page.locator('text=Klasser').count() > 0);
await page.screenshot({ path: 'tab-classes.png' });
await page.click('button:has-text("Sekvens")');
await page.waitForTimeout(200);
console.log('sequence tab shows Tävling:', await page.locator('text=Tävling').count() > 0);
await page.screenshot({ path: 'tab-sequence.png' });
await browser.close();
```

Expected: `sequence tab shows Tävling: true`, no PAGE ERROR / CONSOLE ERROR lines. Look at both screenshots — the Klasser tab must show the classes panel, the Sekvens tab must show Tävling / Egenskaper / Sekvens / Kontroll.

- [ ] **Step 7: Commit**

```bash
git add src/store/useStore.ts src/components/RightPanel.tsx
git commit -m "refactor: lift right panel tab state into the store"
```

---

### Task 2: Step data and `data-tour` anchors

Add the step content module and tag the DOM regions each step points at. Nothing renders yet — this task's deliverable is that every selector a step names resolves to exactly one element.

**Files:**
- Create: `src/data/tourSteps.ts`
- Modify: `src/components/Sidebar.tsx` (arena block ~line 146, obstacle chips block ~line 243)
- Modify: `src/components/Canvas.tsx:411-413`
- Modify: `src/components/RightPanel.tsx` (tab header, Tävling section, Sekvens section)
- Modify: `src/components/Topbar.tsx:74`

**Interfaces:**
- Consumes: `RightPanelTab` from Task 1 (the `tab` field reuses the same union member names).
- Produces:
  - `export interface TourStep { id: string; target: string | null; title: string; body: string; placement?: 'right' | 'left' | 'bottom' | 'top'; tab?: 'sequence' | 'classes' }`
  - `export const tourSteps: TourStep[]` — 9 entries
  - DOM attributes: `data-tour` values `arena-size`, `obstacle-palette`, `canvas`, `sequence-panel`, `classes-tab`, `event-meta`, `topbar-actions`

- [ ] **Step 1: Create the step data module**

Create `src/data/tourSteps.ts`:

```ts
export interface TourStep {
  id: string;
  /** data-tour value of the element to spotlight; null = centered card, no spotlight */
  target: string | null;
  title: string;
  body: string;
  placement?: 'right' | 'left' | 'bottom' | 'top';
  /** right panel tab this step needs active */
  tab?: 'sequence' | 'classes';
}

export const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    target: null,
    title: 'Välkommen till WE Course Designer',
    body: 'Här bygger du banor för Working Equitation — placera hinder på en skalenlig arena, rita ridvägen, sätt kriterier per klass och skriv ut banskissen. Genomgången tar en halv minut.',
  },
  {
    id: 'arena',
    target: 'arena-size',
    title: 'Arenans mått',
    body: 'Ange arenans längd och bredd i meter. Allt på banan ritas skalenligt, så måtten här styr hur mycket plats du har. Om du inte aktivt väljer ett annat mått kommer 60x30 meter användas.',
    placement: 'right',
  },
  {
    id: 'palette',
    target: 'obstacle-palette',
    title: 'Hinderpaletten',
    body: 'Dra ett hinder från listan ut på arenan. Grupper som Två tunnor och Parallellslalom placerar flera delar samtidigt med rätt avstånd. Alla objekt har fasta mått, förutom Start/Mål och Markering - dra i deras sidomarkeringar för att justera storleken.',
    placement: 'right',
  },
  {
    id: 'canvas-place',
    target: 'canvas',
    title: 'Arenan',
    body: 'Släpp hindret här. Dra för att flytta, använd rotationshandtaget för att vrida och krysset/Delete för att ta bort. Inställningen Fäst till rutnät fäster hindren till rutnätet med intervall om 1 meter, rotationen fäster till 45 graders steg. Avaktivera Fäst till rutnät för att placera/rotera fritt.',
    placement: 'left',
  },
  {
    id: 'canvas-route',
    target: 'canvas',
    title: 'Ridvägen',
    body: 'Håll muspekaren över ett hinder så visas dess in- och utgångspunkter. Dra från en punkt för att lägga till ett passage-moment — ridvägen ritas automatiskt mellan momenten. Du kan flytta på en passage-pil eller dess sekvensnummer genom att trycka på dem och sedan trycka-och-dra. Tryck Delete för att radera en markerad passage. ',
    placement: 'left',
  },
  {
    id: 'sequence',
    target: 'sequence-panel',
    title: 'Sekvensen',
    body: 'Listan visar passager, inte hinder. Samma hinder kan alltså förekomma flera gånger, till exempel en passage som rids åt båda hållen. Dra för att ändra ordning och numrering.',
    placement: 'left',
    tab: 'sequence',
  },
  {
    id: 'classes',
    target: 'classes-tab',
    title: 'Klasser och kriterier',
    body: 'Under Klasser väljer du vilka hinder som ingår i varje klass och gren, och skriver eventuella noteringar. Varje klass får sin egen banskiss.',
    placement: 'left',
    tab: 'classes',
  },
  {
    id: 'event-meta',
    target: 'event-meta',
    title: 'Tävlingsuppgifter',
    body: 'Fyll i tävlingsplats, domare, banbyggare och datum. Uppgifterna hamnar i sidhuvudet på den utskrivna banskissen.',
    placement: 'left',
    tab: 'sequence',
  },
  {
    id: 'topbar',
    target: 'topbar-actions',
    title: 'Spara, öppna och skriv ut',
    body: 'Spara låter dig spara ner banan som en fil, Öppna läser in en tidigare sparad bana från en fil. Skriv ut ger dig en banskiss per klass. Du kan när som helst starta om den här genomgången med Introduktion.',
    placement: 'bottom',
  },
];
```

- [ ] **Step 2: Tag the sidebar**

In `src/components/Sidebar.tsx`, add `data-tour` to the arena block — the `<div className="p-2.5 border-b border-gray-100">` immediately under `{/* Arena inputs */}`:

```tsx
      <div data-tour="arena-size" className="p-2.5 border-b border-gray-100">
```

and to the obstacle chips block — the `<div className="p-2.5">` under `{/* Obstacle chips */}`:

```tsx
      <div data-tour="obstacle-palette" className="p-2.5">
```

- [ ] **Step 3: Tag the canvas**

In `src/components/Canvas.tsx`, on the container div at line 411-413:

```tsx
      ref={containerRef}
      data-tour="canvas"
      className="flex-1 relative overflow-hidden bg-[#c8d4c4] cursor-crosshair"
```

- [ ] **Step 4: Tag the right panel**

In `src/components/RightPanel.tsx`, add `data-tour="classes-tab"` to the tab header row:

```tsx
      <div data-tour="classes-tab" className="flex border-b border-gray-200 shrink-0">
```

The `Section` helper takes only `label` and `children`, so tag the two sections by wrapping them rather than changing `Section`'s props. Inside the `tab === 'sequence'` fragment, wrap the Tävling section and the Sekvens section:

```tsx
          <div data-tour="event-meta">
            <Section label="Tävling">
              <EventMetaForm />
            </Section>
          </div>
          <Section label="Egenskaper">
            <PropertiesPanel />
          </Section>
          <div data-tour="sequence-panel">
            <Section label="Sekvens — dra för att ordna">
              <SequenceList />
            </Section>
          </div>
          <Section label="Kontroll">
            <CompliancePanel />
          </Section>
```

The wrapper divs are layout-neutral: `Section` supplies its own padding and border, and the parent is a plain block-flow column.

- [ ] **Step 5: Tag the topbar actions**

In `src/components/Topbar.tsx`, on the right-hand button group at line 74:

```tsx
      <div data-tour="topbar-actions" className="ml-auto flex items-center gap-1.5">
```

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 7: Verify every target resolves to exactly one element**

With the dev server running:

```js
import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await (await browser.newContext()).newPage();
await page.goto('http://localhost:5173');
await page.waitForSelector('text=WE Course Designer');
for (const t of ['arena-size', 'obstacle-palette', 'canvas', 'sequence-panel', 'event-meta', 'classes-tab', 'topbar-actions']) {
  const n = await page.locator(`[data-tour="${t}"]`).count();
  console.log(t, n);
}
await browser.close();
```

Expected: every line prints the target name followed by `1`. All seven targets are present on the default `sequence` tab.

- [ ] **Step 8: Commit**

```bash
git add src/data/tourSteps.ts src/components/Sidebar.tsx src/components/Canvas.tsx src/components/RightPanel.tsx src/components/Topbar.tsx
git commit -m "feat: add tour step data and data-tour anchors"
```

---

### Task 3: Tour store

A tiny standalone Zustand store. Separate from the course store so tour UI state can never leak into the persisted course blob or a saved course file, and so `Topbar` can call `start()` without prop-drilling through `App`.

**Files:**
- Create: `src/store/useTourStore.ts`

**Interfaces:**
- Consumes: `tourSteps` from Task 2 (to clamp `next()` at the end).
- Produces: `useTourStore` default export with state `{ active: boolean; stepIdx: number }` and actions `start(): void`, `next(): void`, `back(): void`, `stop(): void`.

- [ ] **Step 1: Create the store**

Create `src/store/useTourStore.ts`:

```ts
import { create } from 'zustand';
import { tourSteps } from '../data/tourSteps';

interface TourState {
  active: boolean;
  stepIdx: number;
  start: () => void;
  next: () => void;
  back: () => void;
  stop: () => void;
}

const useTourStore = create<TourState>((set, get) => ({
  active: false,
  stepIdx: 0,

  start: () => set({ active: true, stepIdx: 0 }),

  // Advancing past the last step ends the tour — the last step's button reads "Klar"
  next: () => {
    const { stepIdx } = get();
    if (stepIdx >= tourSteps.length - 1) {
      set({ active: false });
      return;
    }
    set({ stepIdx: stepIdx + 1 });
  },

  back: () => set((s) => ({ stepIdx: Math.max(0, s.stepIdx - 1) })),

  stop: () => set({ active: false }),
}));

export default useTourStore;
```

Note this store deliberately uses no `persist` middleware — unlike `useStore`.

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/store/useTourStore.ts
git commit -m "feat: add tour store"
```

---

### Task 4: Tour overlay component

The visible half of the feature: dimmed backdrop, spotlight cut-out, tooltip card, keyboard handling, and right-panel tab driving. After this task the component exists and typechecks but nothing renders it — Task 5 wires it up.

**Files:**
- Create: `src/components/TourOverlay.tsx`

**Interfaces:**
- Consumes: `tourSteps`, `TourStep` (Task 2); `useTourStore` (Task 3); `rightPanelTab` / `setRightPanelTab` (Task 1).
- Produces: `export default function TourOverlay(): JSX.Element | null` — takes no props.

- [ ] **Step 1: Create the component**

Create `src/components/TourOverlay.tsx`:

```tsx
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import useStore from '../store/useStore';
import type { RightPanelTab } from '../store/useStore';
import useTourStore from '../store/useTourStore';
import { tourSteps } from '../data/tourSteps';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 8;        // spotlight padding around the target
const GAP = 12;        // distance from spotlight edge to card
const CARD_W = 300;
const MARGIN = 12;     // keep the card this far from the viewport edge

function measure(target: string | null): Rect | null {
  if (!target) return null;
  const el = document.querySelector(`[data-tour="${target}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    top: r.top - PAD,
    left: r.left - PAD,
    width: r.width + PAD * 2,
    height: r.height + PAD * 2,
  };
}

/** Place the card beside the spotlight, flipping to the opposite side when it would overflow. */
function cardPosition(rect: Rect, placement: string, cardH: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let top: number;
  let left: number;

  switch (placement) {
    case 'left':
      left = rect.left - GAP - CARD_W;
      if (left < MARGIN) left = rect.left + rect.width + GAP;
      top = rect.top;
      break;
    case 'bottom':
      top = rect.top + rect.height + GAP;
      if (top + cardH > vh - MARGIN) top = rect.top - GAP - cardH;
      left = rect.left + rect.width - CARD_W;
      break;
    case 'top':
      top = rect.top - GAP - cardH;
      if (top < MARGIN) top = rect.top + rect.height + GAP;
      left = rect.left;
      break;
    default: // 'right'
      left = rect.left + rect.width + GAP;
      if (left + CARD_W > vw - MARGIN) left = rect.left - GAP - CARD_W;
      top = rect.top;
      break;
  }

  // Final clamp so the card is always fully on screen
  left = Math.min(Math.max(left, MARGIN), vw - CARD_W - MARGIN);
  top = Math.min(Math.max(top, MARGIN), Math.max(MARGIN, vh - cardH - MARGIN));
  return { top, left };
}

export default function TourOverlay() {
  const active = useTourStore((s) => s.active);
  const stepIdx = useTourStore((s) => s.stepIdx);
  const next = useTourStore((s) => s.next);
  const back = useTourStore((s) => s.back);
  const stop = useTourStore((s) => s.stop);

  const setRightPanelTab = useStore((s) => s.setRightPanelTab);

  const [rect, setRect] = useState<Rect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardH, setCardH] = useState(180);
  // Tab that was active before the tour started, restored when it ends
  const prevTabRef = useRef<RightPanelTab | null>(null);

  const step = active ? tourSteps[stepIdx] : undefined;

  // Remember the tab on entry; restore it on exit
  useEffect(() => {
    if (active) {
      if (prevTabRef.current === null) {
        prevTabRef.current = useStore.getState().rightPanelTab;
      }
      return;
    }
    if (prevTabRef.current !== null) {
      setRightPanelTab(prevTabRef.current);
      prevTabRef.current = null;
    }
  }, [active, setRightPanelTab]);

  // Apply this step's required tab before measuring, so the target exists
  useLayoutEffect(() => {
    if (step?.tab) setRightPanelTab(step.tab);
  }, [step, setRightPanelTab]);

  // Measure the target, and re-measure on resize
  useLayoutEffect(() => {
    if (!step) {
      setRect(null);
      return;
    }
    const update = () => setRect(measure(step.target));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [step]);

  useLayoutEffect(() => {
    if (cardRef.current) setCardH(cardRef.current.offsetHeight);
  }, [step, rect]);

  // Focus the card so the keyboard handler has somewhere sensible to live
  useEffect(() => {
    if (active) cardRef.current?.focus();
  }, [active, stepIdx]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); stop(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); back(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, next, back, stop]);

  if (!active || !step) return null;

  const isLast = stepIdx === tourSteps.length - 1;
  const pos = rect
    ? cardPosition(rect, step.placement ?? 'right', cardH)
    : null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100]"
      // Swallow clicks so the app is inert during the tour
      onMouseDown={(e) => e.stopPropagation()}
    >
      {rect ? (
        <div
          className="absolute rounded-md pointer-events-none transition-all duration-200"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/55" />
      )}

      <div
        ref={cardRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={step.title}
        className="absolute bg-[#f5f5f0] border border-[#e0e0da] rounded-lg shadow-lg p-4 focus:outline-none"
        style={
          pos
            ? { top: pos.top, left: pos.left, width: CARD_W }
            : { top: '50%', left: '50%', width: CARD_W, transform: 'translate(-50%, -50%)' }
        }
      >
        <div className="text-[10px] tracking-widest uppercase text-gray-500 font-mono mb-1.5">
          Steg {stepIdx + 1} av {tourSteps.length}
        </div>
        <div className="text-[15px] font-semibold text-[#1a1a18] tracking-tight mb-1.5">
          {step.title}
        </div>
        <div className="text-[12px] text-gray-600 leading-relaxed mb-3.5">
          {step.body}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={stop}
            className="text-xs px-2.5 py-1.5 bg-transparent border-none text-gray-500 hover:text-gray-800 cursor-pointer"
          >
            Hoppa över
          </button>
          <div className="ml-auto flex items-center gap-1.5">
            {stepIdx > 0 && (
              <button
                type="button"
                onClick={back}
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-md bg-white text-gray-500 hover:bg-[#f5f5f0] hover:border-gray-400 hover:text-gray-800 cursor-pointer transition-all"
              >
                Tillbaka
              </button>
            )}
            <button
              type="button"
              onClick={next}
              className="text-xs px-3 py-1.5 border border-[#BA7517] rounded-md bg-[#BA7517] text-white hover:bg-[#a3660f] cursor-pointer transition-all"
            >
              {isLast ? 'Klar' : 'Nästa'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
```

Two details worth not "simplifying" away: the fallback `bg-black/55` branch is what makes a missing target degrade to a centered card instead of throwing, and the tab restore lives in the `active` effect (not in `stop()`) so that Esc, Hoppa över, and Klar all restore it through one path.

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/TourOverlay.tsx
git commit -m "feat: add tour overlay component"
```

---

### Task 5: Wire it up — first visit, Introduktion button, dead-stub cleanup

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/Topbar.tsx` (imports; button group at line 74-101)
- Delete: `src/components/ClassesModal.tsx`

**Interfaces:**
- Consumes: `TourOverlay` (Task 4); `useTourStore.start` (Task 3).
- Produces: the running feature. No new exports.

- [ ] **Step 1: Confirm the stub really is dead, then delete it**

Run: `grep -rn "ClassesModal" src/`
Expected: exactly one hit — `src/components/ClassesModal.tsx` itself. If anything else imports it, stop and report; do not delete.

Then:

```bash
git rm src/components/ClassesModal.tsx
```

- [ ] **Step 2: Render the overlay and add the first-visit effect**

Replace `src/App.tsx` entirely:

```tsx
import { useEffect } from 'react';
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import RightPanel from './components/RightPanel';
import TourOverlay from './components/TourOverlay';
import useTourStore from './store/useTourStore';

// Deliberately outside the Zustand persist blob, so it survives Rensa
// and any future store version migration.
const SEEN_KEY = 'we-course-designer-tutorial-seen';

export default function App() {
  const start = useTourStore((s) => s.start);
  const active = useTourStore((s) => s.active);

  // First visit: open the tour automatically
  useEffect(() => {
    let seen: string | null = null;
    try {
      seen = window.localStorage.getItem(SEEN_KEY);
    } catch {
      // Storage can throw outright in some privacy modes — behave as if unseen
    }
    if (!seen) start();
  }, [start]);

  // Mark as seen once the tour has been opened and closed, however it ended
  // (Klar, Hoppa över, or Esc).
  useEffect(() => {
    if (active) return;
    try {
      window.localStorage.setItem(SEEN_KEY, '1');
    } catch {
      // Ignore — the tour will simply offer itself again next visit
    }
  }, [active]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f5f5f0]">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <Canvas />
        <RightPanel />
      </div>
      <TourOverlay />
    </div>
  );
}
```

The second effect also runs once on mount with `active === false`, which writes the key before the first-visit effect's `start()` has flipped `active` — harmless, because the first effect has already read the old value by then. React runs effects in declaration order, so the read always precedes the write.

- [ ] **Step 3: Add the Introduktion button**

In `src/components/Topbar.tsx`, add the import:

```tsx
import useTourStore from '../store/useTourStore';
```

and inside the component, next to the other store selectors:

```tsx
  const startTour = useTourStore((s) => s.start);
```

Then add the button inside the `data-tour="topbar-actions"` group, immediately after the `Anpassa` button and before the `<div className="w-px h-4 bg-gray-200 mx-0.5" />` that precedes Spara:

```tsx
        <button className={btnClass(false)} onClick={startTour} title="Visa genomgången igen">
          Introduktion
        </button>
```

- [ ] **Step 4: Typecheck and build**

Run: `npm run typecheck && npm run build`
Expected: both exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components/Topbar.tsx
git commit -m "feat: run tutorial tour on first visit and add Introduktion button"
```

---

### Task 6: End-to-end verification in the browser

Everything is wired; this task proves it behaves as specced. Fix anything that fails here in this task, then commit the fixes.

**Files:**
- Create (throwaway, not committed): a Playwright script in the scratchpad directory

**Interfaces:**
- Consumes: the whole feature.
- Produces: nothing — verification only.

- [ ] **Step 1: Ensure Playwright's chromium is available**

Run: `npx playwright install chromium`
(Do **not** pass `--with-deps` — it needs sudo and will fail.)

- [ ] **Step 2: Start the dev server**

Run `npm run dev` in the background and wait for `http://localhost:5173` to answer.

- [ ] **Step 3: Write and run the verification script**

Save to the scratchpad directory as `tour-test.mjs` and run with `node tour-test.mjs`:

```js
import { chromium } from 'playwright';
const DIR = process.env.SCRATCH || '.';
const browser = await chromium.launch({ args: ['--no-sandbox'] });

// --- Fresh context: empty localStorage, tour must open on its own ---
const ctx = await browser.newContext();
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('PAGE ERROR: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE ERROR: ' + m.text()); });

await page.goto('http://localhost:5173');
await page.waitForSelector('text=Välkommen till WE Course Designer');
console.log('1. auto-opened on first visit: OK');

// --- Step through all 9 steps ---
for (let i = 1; i <= 9; i++) {
  await page.waitForSelector(`text=Steg ${i} av 9`);
  await page.screenshot({ path: `${DIR}/tour-step-${i}.png` });
  if (i === 7) {
    const klasser = await page.locator('[data-tour="classes-tab"] button:has-text("Klasser")').getAttribute('class');
    console.log('3a. step 7 Klasser tab active:', klasser.includes('BA7517'));
  }
  if (i === 8) {
    const sekvens = await page.locator('[data-tour="classes-tab"] button:has-text("Sekvens")').getAttribute('class');
    console.log('3b. step 8 Sekvens tab active:', sekvens.includes('BA7517'));
  }
  await page.click(i === 9 ? 'button:has-text("Klar")' : 'button:has-text("Nästa")');
  await page.waitForTimeout(150);
}
console.log('2. stepped through all 9 steps: OK');
console.log('4. overlay gone after Klar:', await page.locator('text=Hoppa över').count() === 0);

// --- Reload must not reopen it ---
await page.reload();
await page.waitForSelector('text=WE Course Designer');
await page.waitForTimeout(400);
console.log('5. does not reopen after reload:', await page.locator('text=Hoppa över').count() === 0);

// --- Introduktion reopens from step 1 ---
await page.click('button:has-text("Introduktion")');
await page.waitForSelector('text=Steg 1 av 9');
console.log('6. Introduktion reopens at step 1: OK');

// --- Esc ends the tour ---
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
console.log('7. Esc closes the tour:', await page.locator('text=Hoppa över').count() === 0);

console.log(errors.length ? errors.join('\n') : '8. no console/page errors: OK');
await browser.close();
```

- [ ] **Step 4: Read the output and look at the screenshots**

Expected: lines 1-8 all report OK / `true`, and no error lines.

Then open all nine screenshots and check by eye:
- The spotlight cut-out lands on the region the step is describing (step 2 the arena inputs, step 3 the palette, steps 4-5 the canvas, step 6 the Sekvens section, step 7 the panel tab header, step 8 the Tävling section, step 9 the topbar buttons).
- The card is fully on screen in every shot and does not cover its own spotlight.
- Step 1 is a centered card with the whole screen dimmed and no cut-out.

A blank or fully-dimmed screenshot where a cut-out is expected means the target did not resolve — check the `data-tour` attribute rather than adjusting the script.

- [ ] **Step 5: Verify the tab is restored on exit**

Manually or via a short script: click Klasser, then Introduktion, step to 7 (which switches to Klasser) and 8 (which switches to Sekvens), then press Esc. The right panel must return to **Klasser** — the tab that was active when the tour started, not the one the tour left it on.

- [ ] **Step 6: Fix anything that failed, then commit**

If steps 4-5 surfaced problems, fix them in the relevant source file and re-run step 3 until clean. Then:

```bash
git add -A src/
git commit -m "fix: correct tour overlay positioning and tab restore"
```

(Skip this commit if nothing needed fixing.)

- [ ] **Step 7: Report**

Report to the user: the branch is `feature/tutorial-tour`, all 9 steps verified, and it needs pushing by them (`! git push -u origin feature/tutorial-tour`) since this session has no git credentials. Then use the `superpowers:finishing-a-development-branch` skill.

---

## Self-Review Notes

Checked against `docs/superpowers/specs/2026-09-04-tutorial-tour-design.md`:

- Step data module, 9 steps, `TourStep` shape → Task 2 ✓
- `data-tour` anchoring on Sidebar / Canvas / RightPanel / Topbar, graceful fallback for a missing target → Task 2 (attributes), Task 4 (`measure` returning `null` → centered card) ✓
- Overlay: portal, `z-[100]`, box-shadow spotlight, placement flipping, `Steg N av <total>` derived from `tourSteps.length`, click-swallowing backdrop, Esc / ←→, focus → Task 4 ✓
- `useTourStore`, non-persisted, separate from the course store → Task 3 ✓
- `rightPanelTab` + `setRightPanelTab` in the main store, non-persisted, restored on exit → Task 1 (state) + Task 4 (apply/restore) ✓
- `localStorage['we-course-designer-tutorial-seen']`, try/catch, written on complete **or** dismiss → Task 5 ✓
- `ClassesModal.tsx` deleted → Task 5 ✓
- Verification: typecheck, build, Playwright, the six numbered checks → Task 6 ✓

One spec detail made concrete here: the spec says focus "is restored to the trigger on close". Task 4 focuses the card on open but does not restore focus to the Introduktion button, since on first visit there is no trigger element to restore to. This is a deliberate simplification, not an omission.

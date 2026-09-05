# Tutorial Tour Design

**Date:** 2026-09-04
**Status:** Approved

## Context

New users land on an empty arena with no explanation of the workflow —
place obstacles, draw the ride route, assign per-class criteria, print.
Nothing on screen says that the sequence panel lists *visits* rather than
obstacles, or that criteria are per class and per discipline. The app has
no onboarding of any kind today.

This adds a guided tour: a dimmed overlay that spotlights one real UI
region at a time with a short Swedish explanation, advanced with
Tillbaka/Nästa. It runs automatically on a user's first visit and can be
replayed any time from an **Introduktion** button in the topbar.

The tour narrates only. It never places obstacles, edits the course, or
touches persisted state, so replaying it can never clobber real work. The
one exception is the right panel's active tab, which is view state, not
course data — see [Right panel tab](#right-panel-tab).

Deliberately **not** built: steps that wait for the user to perform an
action before advancing. The UI is direct enough that explaining each
region is sufficient, and action-gating would couple every step to store
internals.

---

## Step Data

New file `src/data/tourSteps.ts`. Content lives apart from mechanics so
copy can be edited without touching the overlay.

```ts
export interface TourStep {
  id: string;
  target: string | null;   // data-tour value; null = centered card, no spotlight
  title: string;
  body: string;
  placement?: 'right' | 'left' | 'bottom' | 'top';  // default 'right'
  tab?: 'sequence' | 'classes';  // right panel tab this step needs active
}
```

Nine steps:

| # | `target` | Covers |
|---|----------|--------|
| 1 | `null` | Welcome; what the app is for |
| 2 | `arena-size` | Arena dimensions in meters |
| 3 | `obstacle-palette` | Drag obstacles onto the arena; presets |
| 4 | `canvas` | Place, move, rotate, delete; grid snapping |
| 5 | `canvas` | Ridväg: hover an obstacle, drag its entry/exit dot to add a visit |
| 6 | `sequence-panel` | The sequence lists **visits**, not obstacles; reorder, renumber |
| 7 | `classes-tab` | Per-class, per-discipline criteria and notes (`tab: 'classes'`) |
| 8 | `event-meta` | Tävlingsplats, domare, banbyggare, datum (`tab: 'sequence'`) |
| 9 | `topbar-actions` | Spara / Öppna a course file, Skriv ut per class |

All copy in Swedish, matching existing UI text.

## Anchoring

Steps reference targets by `data-tour="<value>"` attributes added to
existing components, resolved at render time with
`document.querySelector('[data-tour="..."]')`. Data attributes rather
than class or DOM-structure selectors, so restyling cannot silently
break the tour.

Attributes are added to `Sidebar.tsx` (`arena-size`, `obstacle-palette`),
`Canvas.tsx` (`canvas`), `RightPanel.tsx` (`sequence-panel`,
`classes-tab`, `event-meta`), and `Topbar.tsx` (`topbar-actions`, on the
wrapper around the Spara/Öppna/Skriv ut buttons). No logic changes in
those files beyond Topbar's new Introduktion button.

If a step's target is missing from the DOM, the step falls back to the
centered, no-spotlight presentation rather than throwing.

## Overlay

New `src/components/TourOverlay.tsx`, portalled to `document.body`,
`fixed inset-0`, `z-[100]` — above the topbar print dropdown's `z-50`.

- **Spotlight:** an absolutely positioned div matching the target's
  `getBoundingClientRect()` plus 8px padding, `rounded-md`,
  `pointer-events: none`, and `box-shadow: 0 0 0 9999px rgba(0,0,0,.55)`.
  The huge spread is what dims everything except the cut-out.
- **Tooltip card:** positioned adjacent to the rect per `placement`,
  flipped to the opposite side when it would overflow the viewport.
  Contains title, body, a `Steg N av <total>` counter derived from
  `tourSteps.length` (never hardcoded), and Tillbaka / Nästa / Hoppa över.
  On the last step Nästa becomes Klar.
- **Recompute:** target rect measured in `useLayoutEffect`, re-run on
  step change and on `window.resize`.
- **Interaction:** the backdrop swallows clicks so the app is inert
  during the tour. Clicking the dimmed area does nothing — advancing only
  via the buttons, so the tour cannot be skipped by a stray click.
- **Keyboard:** `Esc` ends the tour, `←`/`→` navigate. Focus moves to the
  card on open and is restored to the trigger on close.

Styling follows existing conventions: `#BA7517` accent for the primary
button, `#f5f5f0` card ground, `text-gray-600` body copy, the same
small-caps `font-mono` treatment for the step counter.

## State

New `src/store/useTourStore.ts` — a small Zustand store, **not**
persisted and separate from the course store, so tour UI state never
enters the course's persisted blob:

```ts
{ active: boolean; stepIdx: number;
  start(): void; next(): void; back(): void; stop(): void }
```

A separate store rather than `App`-level state because `Topbar` needs
`start()` and prop-drilling through `App` would add plumbing to two
components that otherwise stay untouched.

### Right panel tab

`RightPanel.tsx` currently holds its active tab in a local `useState`.
That moves to the main course store as `rightPanelTab` with a
`setRightPanelTab` action — non-persisted UI state, alongside the
existing `selectedId`, `showGrid`, and `viewMode`.

The overlay applies `step.tab` when entering a step, and restores the tab
that was active when the tour started once it ends.

## Persistence

First-visit detection uses a standalone key,
`localStorage['we-course-designer-tutorial-seen'] = '1'`, deliberately
outside the Zustand persist blob so it survives Rensa and any future
store version migration.

`App` reads it once on mount; if absent, it calls `start()`. The key is
written when the tour is completed **or** skipped/dismissed — reaching
the end is not required to stop it reappearing. All reads and writes are
wrapped in try/catch, since storage access throws outright in some
privacy modes; on failure the tour simply behaves as if unseen.

## Files

**New**
- `src/data/tourSteps.ts`
- `src/components/TourOverlay.tsx`
- `src/store/useTourStore.ts`

**Edited**
- `src/App.tsx` — render overlay, first-visit effect
- `src/components/Topbar.tsx` — Introduktion button
- `src/store/useStore.ts` — `rightPanelTab` + `setRightPanelTab`
- `src/components/RightPanel.tsx` — tab state from store; `data-tour` attrs
- `src/components/Sidebar.tsx`, `src/components/Canvas.tsx` — `data-tour` attrs

**Deleted**
- `src/components/ClassesModal.tsx` — dead stub returning `null`,
  imported by nothing; removed as cleanup in the area being touched.

## Verification

No test suite exists in this project. Verification is `npm run typecheck`,
`npm run build`, and driving the running app with Playwright:

1. Fresh browser context (empty localStorage) → tour opens automatically.
2. Step through all 9 steps, screenshotting each; confirm the spotlight
   lands on the intended region and the card stays on screen.
3. Step 7 switches the right panel to Klasser and step 8 switches it back
   to Sekvens; ending the tour restores the tab active before it started.
4. `Esc` ends the tour; reloading does not reopen it.
5. Introduktion button reopens it from step 1.
6. No console errors at any point.

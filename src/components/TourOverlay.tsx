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
const CORNER_INSET = 16; // inset from a corner when the card must sit over its target

function measure(target: string | null): Rect | null {
  if (!target) return null;
  const el = document.querySelector(`[data-tour="${target}"]`);
  if (!el) return null;
  el.scrollIntoView({ block: 'nearest' });
  const r = el.getBoundingClientRect();
  return {
    top: r.top - PAD,
    left: r.left - PAD,
    width: r.width + PAD * 2,
    height: r.height + PAD * 2,
  };
}

interface CardPos {
  top: number;
  left: number;
  width: number;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), Math.max(lo, hi));
}

/**
 * Place the card beside the spotlight when there's room, or over it when
 * there isn't.
 *
 * A side "fits" only when the card's full footprint (CARD_W or cardH,
 * whichever axis that side occupies) clears the rect AND stays on screen —
 * checking the primary side's overflow alone isn't enough, because the
 * flipped side can overflow too (e.g. a wide `canvas` target leaves neither
 * sidebar column wide enough for a 300px card). When a side fits, its cross
 * axis (top for left/right, left for top/bottom) can be clamped freely
 * within the viewport without risking overlap, since the two rects are
 * already separated on the other axis. The above/below placers also clamp
 * their own primary axis defensively, even though today every caller of
 * them is already gated by fitsAbove/fitsBelow.
 *
 * If none of the four sides fit at full size, the target is too large to
 * seat a full-width card beside it at all (e.g. `canvas`, which occupies
 * nearly the whole viewport) — sitting outside it isn't a real option, and
 * the copy for these steps isn't a candidate for shrinking. Overlay the
 * card instead, inset from the corner matching the step's requested
 * placement, clamped fully on screen; a card over part of a near-fullscreen
 * target doesn't hide anything the step needs to point at.
 */
function cardPosition(rect: Rect, placement: string, cardH: number): CardPos {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const leftClearance = rect.left - GAP - MARGIN;
  const rightClearance = vw - MARGIN - (rect.left + rect.width + GAP);
  const aboveClearance = rect.top - GAP - MARGIN;
  const belowClearance = vh - MARGIN - (rect.top + rect.height + GAP);

  const crossTop = () => clamp(rect.top, MARGIN, Math.max(MARGIN, vh - cardH - MARGIN));
  const crossLeft = () => clamp(rect.left, MARGIN, Math.max(MARGIN, vw - CARD_W - MARGIN));
  const crossLeftFromRight = () =>
    clamp(rect.left + rect.width - CARD_W, MARGIN, Math.max(MARGIN, vw - CARD_W - MARGIN));

  const placeLeft = (): CardPos => ({ left: rect.left - GAP - CARD_W, top: crossTop(), width: CARD_W });
  const placeRight = (): CardPos => ({ left: rect.left + rect.width + GAP, top: crossTop(), width: CARD_W });
  const placeAbove = (): CardPos => ({
    top: clamp(rect.top - GAP - cardH, MARGIN, Math.max(MARGIN, vh - cardH - MARGIN)),
    left: crossLeft(),
    width: CARD_W,
  });
  const placeBelow = (): CardPos => ({
    top: clamp(rect.top + rect.height + GAP, MARGIN, Math.max(MARGIN, vh - cardH - MARGIN)),
    left: crossLeftFromRight(),
    width: CARD_W,
  });

  const fitsLeft = leftClearance >= CARD_W;
  const fitsRight = rightClearance >= CARD_W;
  const fitsAbove = aboveClearance >= cardH;
  const fitsBelow = belowClearance >= cardH;

  // Try the requested side, then its opposite, then the cross axis.
  const candidates: Array<() => CardPos | null> = (() => {
    switch (placement) {
      case 'left':
        return [
          () => (fitsLeft ? placeLeft() : null),
          () => (fitsRight ? placeRight() : null),
          () => (fitsAbove ? placeAbove() : null),
          () => (fitsBelow ? placeBelow() : null),
        ];
      case 'top':
        return [
          () => (fitsAbove ? placeAbove() : null),
          () => (fitsBelow ? placeBelow() : null),
          () => (fitsLeft ? placeLeft() : null),
          () => (fitsRight ? placeRight() : null),
        ];
      case 'bottom':
        return [
          () => (fitsBelow ? placeBelow() : null),
          () => (fitsAbove ? placeAbove() : null),
          () => (fitsLeft ? placeLeft() : null),
          () => (fitsRight ? placeRight() : null),
        ];
      default: // 'right'
        return [
          () => (fitsRight ? placeRight() : null),
          () => (fitsLeft ? placeLeft() : null),
          () => (fitsAbove ? placeAbove() : null),
          () => (fitsBelow ? placeBelow() : null),
        ];
    }
  })();

  for (const candidate of candidates) {
    const pos = candidate();
    if (pos) return pos;
  }

  // Too large to seat beside on any side: overlay the card on the target,
  // inset from the corner matching the requested placement, and clamp fully
  // on screen. Full CARD_W is kept — this path exists so author-approved
  // copy never gets squeezed into a narrower column.
  let left: number;
  let top: number;
  switch (placement) {
    case 'right':
      left = rect.left + rect.width - CORNER_INSET - CARD_W;
      top = rect.top + CORNER_INSET;
      break;
    case 'bottom':
      left = rect.left + rect.width - CORNER_INSET - CARD_W;
      top = rect.top + rect.height - CORNER_INSET - cardH;
      break;
    case 'top':
      left = rect.left + CORNER_INSET;
      top = rect.top + CORNER_INSET;
      break;
    default: // 'left'
      left = rect.left + CORNER_INSET;
      top = rect.top + CORNER_INSET;
      break;
  }
  return {
    left: clamp(left, MARGIN, Math.max(MARGIN, vw - CARD_W - MARGIN)),
    top: clamp(top, MARGIN, Math.max(MARGIN, vh - cardH - MARGIN)),
    width: CARD_W,
  };
}

export default function TourOverlay() {
  const active = useTourStore((s) => s.active);
  const stepIdx = useTourStore((s) => s.stepIdx);
  const next = useTourStore((s) => s.next);
  const back = useTourStore((s) => s.back);
  const stop = useTourStore((s) => s.stop);

  const setRightPanelTab = useStore((s) => s.setRightPanelTab);
  const rightPanelTab = useStore((s) => s.rightPanelTab);

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

  // Measure the target, and re-measure on resize. Also re-run when
  // rightPanelTab changes: setRightPanelTab in the effect above queues a
  // state update that flushes in a later commit, so on a tab-switching step
  // the target may not exist in the DOM yet on the commit where this first
  // runs. Re-measuring once the tab has actually swapped in picks it up.
  //
  // Only a deliberate `target: null` step should produce the centered,
  // fully-dimmed fallback. When a step names a real target that simply
  // hasn't mounted yet (e.g. its required tab hasn't swapped in on this
  // commit), keep the previously measured rect in place instead of
  // clearing it — the spotlight then animates from the old region straight
  // to the new one once the target appears, rather than flashing through
  // the full-dim fallback for one frame. Once the step's required tab is
  // actually active and the target is still missing, it's genuinely
  // absent, so we do fall back to the centered presentation then.
  useLayoutEffect(() => {
    if (!step || step.target === null) {
      setRect(null);
      return;
    }
    const update = () => {
      const r = measure(step.target);
      if (r) {
        setRect(r);
        return;
      }
      const tabReady = !step.tab || step.tab === rightPanelTab;
      if (tabReady) setRect(null);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [step, rightPanelTab]);

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
            ? { top: pos.top, left: pos.left, width: pos.width }
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

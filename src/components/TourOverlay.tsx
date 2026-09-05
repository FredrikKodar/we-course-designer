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

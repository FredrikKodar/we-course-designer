import { useRef } from 'react';
import useStore from '../store/useStore';
import { OBSTACLES } from '../data/obstacles';

export default function SequenceList() {
  const visits = useStore((s) => s.visits);
  const placed = useStore((s) => s.placed);
  const selectedVisitId = useStore((s) => s.selectedVisitId);
  const setSelectedVisitId = useStore((s) => s.setSelectedVisitId);
  const selectObstacle = useStore((s) => s.selectObstacle);
  const deleteVisit = useStore((s) => s.deleteVisit);
  const updateVisit = useStore((s) => s.updateVisit);
  const dragIdx = useRef<number | null>(null);

  // Build display entries: start-and-finish visits appear twice
  type DisplayEntry = {
    visit: (typeof visits)[0];
    displayAs: 'start' | 'finish' | 'number';
  };

  const numbered = visits.filter((v) => !v.role);
  const startVisit = visits.find((v) => v.role === 'start' || v.role === 'start-and-finish');
  const finishVisit = visits.find((v) => v.role === 'finish' || v.role === 'start-and-finish');

  const sortedNumbered = [...numbered].sort((a, b) =>
    a.num.localeCompare(b.num, undefined, { numeric: true, sensitivity: 'base' }),
  );

  const entries: DisplayEntry[] = [
    ...(startVisit ? [{ visit: startVisit, displayAs: 'start' as const }] : []),
    ...sortedNumbered.map((v) => ({ visit: v, displayAs: 'number' as const })),
    ...(finishVisit ? [{ visit: finishVisit, displayAs: 'finish' as const }] : []),
  ];

  if (!entries.length) {
    return (
      <div className="text-gray-400 text-[12px]">
        Hover an obstacle and drag its entry or exit dot to add a visit.
      </div>
    );
  }

  const handleDragStart = (idx: number) => { dragIdx.current = idx; };

  const handleDrop = (targetIdx: number) => {
    if (dragIdx.current === null || dragIdx.current === targetIdx) return;
    const reordered = [...sortedNumbered];
    const [moved] = reordered.splice(dragIdx.current, 1);
    reordered.splice(targetIdx, 0, moved);
    reordered.forEach((v, i) => {
      const isPlainInt = /^\d+$/.test(v.num);
      if (isPlainInt && v.num !== String(i + 1)) {
        updateVisit(v.id, { num: String(i + 1) });
      }
    });
    dragIdx.current = null;
  };

  // Numbered index counter — advances only for 'number' entries, used for drag reorder
  let numberedIdx = -1;

  return (
    <div className="flex flex-col gap-0.5">
      {entries.map(({ visit, displayAs }) => {
        const obstacle = placed.find((p) => p.id === visit.obstacleId);
        const isGate = obstacle?.kind === 'gate';
        const def = (!isGate && obstacle?.kind === 'obstacle')
          ? OBSTACLES.find((o) => o.id === obstacle.type)
          : null;
        const isSel = visit.id === selectedVisitId;

        const badgeLabel =
          displayAs === 'start' ? 'S' :
          displayAs === 'finish' ? 'M' :
          visit.num;

        const badgeTitle =
          displayAs === 'start' ? 'Start' :
          displayAs === 'finish' ? 'Mål' :
          visit.num;

        const itemLabel =
          displayAs === 'start' ? 'Start' :
          displayAs === 'finish' ? 'Mål' :
          (def?.label ?? obstacle?.type ?? '?');

        const isDraggable = displayAs === 'number';
        if (isDraggable) numberedIdx++;
        const thisNumberedIdx = numberedIdx;

        return (
          <div
            key={`${visit.id}-${displayAs}`}
            draggable={isDraggable}
            onDragStart={isDraggable ? () => handleDragStart(thisNumberedIdx) : undefined}
            onDragOver={(e) => e.preventDefault()}
            onDrop={isDraggable ? () => handleDrop(thisNumberedIdx) : undefined}
            onClick={() => {
              setSelectedVisitId(visit.id);
              if (obstacle) selectObstacle(obstacle.id);
            }}
            className={`flex items-center gap-1.5 px-1.5 py-1 rounded border text-[12px] cursor-pointer select-none transition-colors ${
              isSel
                ? 'border-[#BA7517] bg-[#fff8ee] text-[#1a1a18]'
                : 'border-gray-100 bg-[#fafaf8] text-gray-700 hover:border-[#BA7517]'
            }`}
          >
            <span className="text-gray-400 text-[11px] cursor-grab shrink-0">
              {isDraggable ? '⠇' : ' '}
            </span>

            <span
              className="min-w-[1rem] h-4 rounded-full px-1 flex items-center justify-center text-white text-[8px] font-bold font-mono shrink-0"
              style={{ background: '#BA7517' }}
              title={badgeTitle}
            >
              {badgeLabel}
            </span>

            <span className="flex-1 truncate">{itemLabel}</span>
            <span className="text-[9px] text-gray-400 shrink-0">{visit.entryPoint}</span>
            <span
              className="text-gray-400 text-[10px] cursor-pointer shrink-0 hover:text-red-500"
              onClick={(e) => {
                e.stopPropagation();
                deleteVisit(visit.id);
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

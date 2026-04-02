import { useRef, useState } from 'react';
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const sorted = [...visits].sort((a, b) =>
    a.num.localeCompare(b.num, undefined, { numeric: true, sensitivity: 'base' }),
  );

  if (!sorted.length) {
    return (
      <div className="text-gray-300 text-[11px]">
        Hover an obstacle and drag its entry or exit dot to add a visit.
      </div>
    );
  }

  const handleDragStart = (idx: number) => { dragIdx.current = idx; };

  const handleDrop = (targetIdx: number) => {
    if (dragIdx.current === null || dragIdx.current === targetIdx) return;
    const reordered = [...sorted];
    const [moved] = reordered.splice(dragIdx.current, 1);
    reordered.splice(targetIdx, 0, moved);
    reordered.forEach((v, i) => {
      if (v.num !== String(i + 1)) updateVisit(v.id, { num: String(i + 1) });
    });
    dragIdx.current = null;
  };

  return (
    <div className="flex flex-col gap-0.5">
      {sorted.map((visit, idx) => {
        const obstacle = placed.find((p) => p.id === visit.obstacleId);
        const def = obstacle ? OBSTACLES.find((o) => o.id === obstacle.type) : null;
        const isSel = visit.id === selectedVisitId;

        return (
          <div
            key={visit.id}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(idx)}
            onClick={() => {
              setSelectedVisitId(visit.id);
              if (obstacle) selectObstacle(obstacle.id);
            }}
            className={`flex items-center gap-1.5 px-1.5 py-1 rounded border text-[11px] cursor-pointer select-none transition-colors ${
              isSel
                ? 'border-[#BA7517] bg-[#fff8ee] text-[#1a1a18]'
                : 'border-gray-100 bg-[#fafaf8] text-gray-500 hover:border-[#BA7517]'
            }`}
          >
            <span className="text-gray-300 text-[11px] cursor-grab shrink-0">&#x2807;</span>

            {editingId === visit.id ? (
              <input
                autoFocus
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => {
                  updateVisit(visit.id, { num: editValue.trim() || visit.num });
                  setEditingId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') { setEditingId(null); return; }
                  if (e.key === 'Enter') {
                    updateVisit(visit.id, { num: editValue.trim() || visit.num });
                    setEditingId(null);
                  }
                  e.stopPropagation();
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-8 text-[11px] font-mono border border-[#BA7517] rounded px-1 py-0 bg-white focus:outline-none"
              />
            ) : (
              <span
                className="min-w-[1rem] h-4 rounded-full px-1 flex items-center justify-center text-white text-[8px] font-bold font-mono shrink-0 cursor-text"
                style={{ background: '#BA7517' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingId(visit.id);
                  setEditValue(visit.num);
                }}
              >
                {visit.num}
              </span>
            )}

            <span className="flex-1 truncate">{def?.label ?? obstacle?.type ?? '?'}</span>
            <span className="text-[9px] text-gray-300 shrink-0">{visit.entryPoint}</span>
            <span
              className="text-gray-300 text-[10px] cursor-pointer shrink-0 hover:text-red-500"
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

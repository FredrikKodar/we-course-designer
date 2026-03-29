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

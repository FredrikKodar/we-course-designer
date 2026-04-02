import React from 'react';
import type { ReactNode } from 'react';
import useStore from '../store/useStore';
import { OBSTACLES } from '../data/obstacles';

export default function PropertiesPanel() {
  const selectedId = useStore((s) => s.selectedId);
  const placed = useStore((s) => s.placed);
  const rotateObstacle = useStore((s) => s.rotateObstacle);
  const updateObstacleMeta = useStore((s) => s.updateObstacleMeta);

  const obstacle = placed.find((p) => p.id === selectedId);

  if (!obstacle) {
    return <div className="text-gray-300 text-[11px]">Select an obstacle</div>;
  }

  const def = OBSTACLES.find((o) => o.id === obstacle.type);
  const rotation = Math.round(obstacle.rotation || 0);

  const handleRotationInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const deg = parseFloat(e.target.value) || 0;
    rotateObstacle(obstacle.id, deg);
  };

  const rotate = (delta: number) => rotateObstacle(obstacle.id, rotation + delta);
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
    </div>
  );
}

interface PropRowProps {
  label: string;
  value: ReactNode;
}

function PropRow({ label, value }: PropRowProps) {
  return (
    <div className="flex items-center justify-between mb-1">
      <span className="text-[10px] text-gray-400">{label}</span>
      <span className="font-mono text-[10px] text-[#1a1a18] bg-[#f5f5f0] border border-[#e0e0da] px-1.5 py-0.5 rounded">
        {value}
      </span>
    </div>
  );
}

interface RotBtnProps {
  label: string;
  onClick: () => void;
}

function RotBtn({ label, onClick }: RotBtnProps) {
  return (
    <button
      onClick={onClick}
      className="text-[11px] px-2 py-0.5 border border-gray-200 rounded bg-white text-gray-500 hover:bg-[#f5f5f0] hover:border-gray-400 cursor-pointer"
    >
      {label}
    </button>
  );
}

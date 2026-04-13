import React, { useState } from 'react';
import useStore from '../store/useStore';
import { OBSTACLES } from '../data/obstacles';
import type { ObstacleDef, PathLineType } from '../types';

const OBSTACLE_ORDER = [
  'tunna', 'tva-tunnor', 'tre-tunnor',
  'enkelslalom', 'enkelslalom-7m', 'enkelslalom-8m',
  'parallellslalom', 'parallellslalom-4x3-7m', 'parallellslalom-4x3-8m',
  'parallellslalom-3x2-6m', 'parallellslalom-3x2-7m', 'parallellslalom-3x2-8m',
  'falla-6m', 'falla', 'falla-10m',
  'lans-ur-tunna', 'lans-i-tunna', 'ring',
  'ryggning', 'korridor',
  'grind', 'sidvarts', 'lydnad', 'flytta-mugg',
  'trabro', 'bord',
  'vatten', 'hopp',
];

interface ToggleProps {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

interface ObstacleChipProps {
  def: ObstacleDef;
  showVariantLabel?: boolean;
}

interface AccordionGroupProps {
  groupLabel: string;
  defs: ObstacleDef[];
}

interface GateChipProps {
  gateType: 'marker' | 'start-finish';
  label: string;
  svgContent: React.ReactNode;
}

function GateChip({ gateType, label, svgContent }: GateChipProps) {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('gateType', gateType);
    e.dataTransfer.effectAllowed = 'copy';
  };
  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-md border border-[#e8e8e4] bg-[#fafaf8] text-[12px] text-gray-500 cursor-grab select-none transition-all hover:border-[#BA7517] hover:text-[#1a1a18] hover:bg-[#fff8ee]"
    >
      <svg width="20" height="20" viewBox="-20 -10 40 20" className="shrink-0">
        {svgContent}
      </svg>
      <span className="truncate">{label}</span>
    </div>
  );
}

function Toggle({ label, value, onChange }: ToggleProps) {
  return (
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-[12px] text-gray-500">{label}</span>
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

function ObstacleChip({ def, showVariantLabel }: ObstacleChipProps) {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('obstacleType', def.id);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const displayLabel = showVariantLabel && def.variantLabel ? def.variantLabel : def.label;

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-md border border-[#e8e8e4] bg-[#fafaf8] text-[12px] text-gray-500 cursor-grab select-none transition-all hover:border-[#BA7517] hover:text-[#1a1a18] hover:bg-[#fff8ee]"
    >
      <svg
        width="20"
        height="20"
        viewBox={def.viewBox}
        className="shrink-0"
        dangerouslySetInnerHTML={{ __html: def.svg }}
      />
      <span className="truncate">{displayLabel}</span>
    </div>
  );
}

function AccordionGroup({ groupLabel, defs }: AccordionGroupProps) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-2 py-1 rounded-md text-[11px] text-gray-500 hover:text-[#1a1a18] hover:bg-[#f5f5f0] cursor-pointer select-none"
      >
        <span>{groupLabel}</span>
        <span className="text-[9px]">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="flex flex-col gap-0.5 pl-2 mt-0.5">
          {defs.map((def) => (
            <ObstacleChip key={def.id} def={def} showVariantLabel />
          ))}
        </div>
      )}
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
        <div className="text-[10px] tracking-widest uppercase text-gray-700 font-mono mb-2">
          Arena (meter)
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-gray-500">Längd</span>
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
            <span className="text-[12px] text-gray-500">Bredd</span>
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
        <div className="text-[10px] tracking-widest uppercase text-gray-700 font-mono mb-2">
          Visning
        </div>
        <Toggle label="Rutnät" value={showGrid} onChange={setShowGrid} />
        <Toggle label="Fäst till rutnät" value={snapToGrid} onChange={setSnapToGrid} />
        <Toggle label="Ridväg" value={showPath} onChange={setShowPath} />
      </div>

      {/* Path style */}
      <div className="p-2.5 border-b border-gray-100">
        <div className="text-[10px] tracking-widest uppercase text-gray-700 font-mono mb-2">
          Linjetyp
        </div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[12px] text-gray-500">Linje</span>
          <select
            value={pathLineType}
            onChange={(e) => setPathStyle(e.target.value as PathLineType, pathLineWeight, pathArrowSize)}
            className="text-[11px] border border-gray-200 rounded px-1 py-0.5 bg-[#f9f9f7] text-[#1a1a18]"
          >
            <option value="dashed">Streckad</option>
            <option value="solid">Heldragen</option>
            <option value="dotted">Prickad</option>
          </select>
        </div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[12px] text-gray-500">Tjocklek</span>
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
            <span className="text-[10px] font-mono text-gray-600 min-w-[22px]">
              {pathLineWeight}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-gray-500">Pilar</span>
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
        <div className="text-[10px] tracking-widest uppercase text-gray-700 font-mono mb-2">
          Hinder - drag till arena
        </div>
        <div className="flex flex-col gap-0.5">
          <GateChip
            gateType="start-finish"
            label="Start / Mål"
            svgContent={
              <>
                <circle cx="-14" cy="0" r="4" fill="#1a1a18" />
                <circle cx="14" cy="0" r="4" fill="#1a1a18" />
                <line x1="-10" y1="0" x2="10" y2="0" stroke="#1a1a18" strokeWidth="1" strokeDasharray="3 2" />
              </>
            }
          />
          <GateChip
            gateType="marker"
            label="Markering"
            svgContent={
              <>
                <polygon points="-6,0 -14,-5 -14,5" fill="#1a1a18" />
                <polygon points="6,0 14,-5 14,5" fill="#1a1a18" />
                <line x1="-6" y1="0" x2="6" y2="0" stroke="#1a1a18" strokeWidth="1" strokeDasharray="3 2" />
              </>
            }
          />
          {(() => {
            const defs = OBSTACLE_ORDER
              .map((id) => OBSTACLES.find((o) => o.id === id))
              .filter((d): d is ObstacleDef => !!d);

            const items: Array<
              | { type: 'chip'; def: ObstacleDef }
              | { type: 'accordion'; group: string; defs: ObstacleDef[] }
            > = [];
            for (const def of defs) {
              if (def.variantGroup) {
                const last = items[items.length - 1];
                if (last?.type === 'accordion' && last.group === def.variantGroup) {
                  last.defs.push(def);
                } else {
                  items.push({ type: 'accordion', group: def.variantGroup, defs: [def] });
                }
              } else {
                items.push({ type: 'chip', def });
              }
            }

            return items.map((item, i) =>
              item.type === 'chip' ? (
                <ObstacleChip key={item.def.id} def={item.def} />
              ) : (
                <AccordionGroup key={item.group + i} groupLabel={item.group} defs={item.defs} />
              )
            );
          })()}
        </div>
      </div>
    </div>
  );
}

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

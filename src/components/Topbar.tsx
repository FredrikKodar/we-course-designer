import useStore from '../store/useStore';
import { printCourse } from '../utils/export';

export default function Topbar() {
  const arenaW = useStore((s) => s.arenaW);
  const arenaH = useStore((s) => s.arenaH);
  const viewMode = useStore((s) => s.viewMode);
  const showGrid = useStore((s) => s.showGrid);
  const showPath = useStore((s) => s.showPath);
  const setViewMode = useStore((s) => s.setViewMode);
  const setShowGrid = useStore((s) => s.setShowGrid);
  const setShowPath = useStore((s) => s.setShowPath);
  const clearAll = useStore((s) => s.clearAll);

  const btnClass = (active: boolean) =>
    `text-xs px-3 py-1.5 border rounded-md cursor-pointer transition-all whitespace-nowrap ${
      active
        ? 'bg-[#f5f5f0] border-[#BA7517] text-[#BA7517] font-medium'
        : 'bg-white border-gray-200 text-gray-500 hover:bg-[#f5f5f0] hover:border-gray-400 hover:text-gray-800'
    }`;

  const viewBtnClass = (active: boolean) =>
    `text-[11px] px-2.5 py-1.5 border-r border-gray-200 last:border-r-0 cursor-pointer ${
      active ? 'bg-[#f0f8e8] text-[#3B6D11] font-medium' : 'bg-white text-gray-500 hover:text-gray-800'
    }`;

  return (
    <div className="h-[46px] border-b border-gray-200 bg-white flex items-center px-3.5 gap-2.5 shrink-0 shadow-sm">
      <div className="text-[15px] font-semibold text-[#1a1a18] tracking-tight whitespace-nowrap">
        WE Course Designer
      </div>
      <div className="text-[11px] text-gray-400 font-mono px-2 py-0.5 bg-[#f5f5f0] border border-[#e0e0da] rounded whitespace-nowrap">
        {arenaW} &times; {arenaH} m
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-gray-400">View:</span>
        <div className="flex border border-gray-200 rounded-md overflow-hidden">
          <button
            className={viewBtnClass(viewMode === 'side')}
            onClick={() => setViewMode('side')}
          >
            Sideline
          </button>
          <button
            className={viewBtnClass(viewMode === 'end')}
            onClick={() => setViewMode('end')}
          >
            Endline
          </button>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <button className={btnClass(showGrid)} onClick={() => setShowGrid(!showGrid)}>
          Grid
        </button>
        <button className={btnClass(showPath)} onClick={() => setShowPath(!showPath)}>
          Path
        </button>
        <button className={btnClass(false)} onClick={() => useStore.getState().fitArena?.()}>
          Fit
        </button>
        <button className={btnClass(false)} onClick={printCourse}>
          Print
        </button>
        <button
          className="text-xs px-3 py-1.5 border border-gray-200 rounded-md bg-white text-gray-500 hover:border-red-400 hover:text-red-500 cursor-pointer transition-all"
          onClick={clearAll}
        >
          Clear
        </button>
      </div>
    </div>
  );
}

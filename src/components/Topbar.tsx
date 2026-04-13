import { useRef, useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { printCourse } from '../utils/export';

export default function Topbar() {
  const arenaW = useStore((s) => s.arenaW);
  const arenaH = useStore((s) => s.arenaH);
  const showGrid = useStore((s) => s.showGrid);
  const showPath = useStore((s) => s.showPath);
  const setShowGrid = useStore((s) => s.setShowGrid);
  const setShowPath = useStore((s) => s.setShowPath);
  const clearAll = useStore((s) => s.clearAll);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const canUndo = useStore((s) => s.past.length > 0);
  const canRedo = useStore((s) => s.future.length > 0);
  const classes = useStore((s) => s.classes);

  const [printOpen, setPrintOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!printOpen) return;
    const handler = (e: MouseEvent) => {
      if (printRef.current && !printRef.current.contains(e.target as Node)) {
        setPrintOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [printOpen]);

  const triggerPrint = (classId?: string) => {
    setPrintOpen(false);
    useStore.getState().selectObstacle(null);
    useStore.getState().setSelectedVisitId(null);
    requestAnimationFrame(() => requestAnimationFrame(() => printCourse(classId)));
  };

  const btnClass = (active: boolean) =>
    `text-xs px-3 py-1.5 border rounded-md cursor-pointer transition-all whitespace-nowrap ${
      active
        ? 'bg-[#f5f5f0] border-[#BA7517] text-[#BA7517] font-medium'
        : 'bg-white border-gray-200 text-gray-500 hover:bg-[#f5f5f0] hover:border-gray-400 hover:text-gray-800'
    }`;

  return (
    <div className="h-[46px] border-b border-gray-200 bg-white flex items-center px-3.5 gap-2.5 shrink-0 shadow-sm">
      <div className="text-[15px] font-semibold text-[#1a1a18] tracking-tight whitespace-nowrap">
        WE Course Designer
      </div>
      <div className="text-[11px] text-gray-400 font-mono px-2 py-0.5 bg-[#f5f5f0] border border-[#e0e0da] rounded whitespace-nowrap">
        {arenaW} &times; {arenaH} m
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          className={`text-xs px-3 py-1.5 border rounded-md transition-all whitespace-nowrap ${canUndo ? 'bg-white border-gray-200 text-gray-500 hover:bg-[#f5f5f0] hover:border-gray-400 hover:text-gray-800 cursor-pointer' : 'bg-white border-gray-100 text-gray-300 cursor-default'}`}
          onClick={undo}
          disabled={!canUndo}
          title="Ångra (Ctrl+Z)"
        >
          ↩ Ångra
        </button>
        <button
          className={`text-xs px-3 py-1.5 border rounded-md transition-all whitespace-nowrap ${canRedo ? 'bg-white border-gray-200 text-gray-500 hover:bg-[#f5f5f0] hover:border-gray-400 hover:text-gray-800 cursor-pointer' : 'bg-white border-gray-100 text-gray-300 cursor-default'}`}
          onClick={redo}
          disabled={!canRedo}
          title="Gör om (Ctrl+Y)"
        >
          ↪ Gör om
        </button>
        <div className="w-px h-4 bg-gray-200 mx-0.5" />
        <button className={btnClass(showGrid)} onClick={() => setShowGrid(!showGrid)}>
          Rutnät
        </button>
        <button className={btnClass(showPath)} onClick={() => setShowPath(!showPath)}>
          Ridväg
        </button>
        <button className={btnClass(false)} onClick={() => useStore.getState().fitArena?.()} title="Anpassa storlek till fönster">
          Anpassa
        </button>

        {/* Print dropdown */}
        <div className="relative" ref={printRef}>
          <button
            className={btnClass(false)}
            onClick={() => setPrintOpen((v) => !v)}
          >
            Skriv ut ▾
          </button>
          {printOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-md z-50 min-w-[120px]">
              {classes.length === 0 ? (
                <button
                  type="button"
                  onClick={() => triggerPrint(undefined)}
                  className="w-full text-left text-[11px] px-3 py-1.5 hover:bg-[#f5f5f0] text-gray-600 cursor-pointer bg-transparent border-none"
                >
                  Skriv ut (ingen klass)
                </button>
              ) : (
                classes.map((cls) => (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => triggerPrint(cls.id)}
                    className="w-full text-left text-[11px] px-3 py-1.5 hover:bg-[#f5f5f0] text-gray-600 cursor-pointer bg-transparent border-none"
                  >
                    {cls.name || 'Namnlös'}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <button
          className="text-xs px-3 py-1.5 border border-gray-200 rounded-md bg-white text-gray-500 hover:border-red-400 hover:text-red-500 cursor-pointer transition-all"
          onClick={() => { if (window.confirm('Rensa alla hinder?')) clearAll(); }}
        >
          Rensa
        </button>
      </div>
    </div>
  );
}

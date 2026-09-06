import { useRef, useState, useEffect } from 'react';
import useStore from '../store/useStore';
import useTourStore from '../store/useTourStore';
import { printCourse } from '../utils/export';
import { saveCourseToFile, loadCourseFromFile } from '../utils/fileIO';

/** Button + anchored panel that closes on outside click or Escape. */
function Dropdown({
  trigger,
  triggerClass,
  title,
  align = 'right',
  children,
}: {
  trigger: React.ReactNode;
  triggerClass: string;
  title?: string;
  align?: 'left' | 'right';
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        className={triggerClass}
        title={title}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} top-full mt-1 bg-white border border-gray-200 rounded shadow-md z-50 min-w-[150px] py-1`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

const menuItemClass =
  'w-full text-left text-[11px] px-3 py-1.5 hover:bg-[#f5f5f0] text-gray-600 cursor-pointer bg-transparent border-none';

export default function Topbar() {
  const clearAll = useStore((s) => s.clearAll);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const canUndo = useStore((s) => s.past.length > 0);
  const canRedo = useStore((s) => s.future.length > 0);
  const classes = useStore((s) => s.classes);
  const placed = useStore((s) => s.placed);
  const startTour = useTourStore((s) => s.start);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenClick = () => {
    if (placed.length > 0 && !window.confirm('Om du öppnar en design kommer den nuvarande att ersättas. Eventuella osparade ändringar förloras.. Fortsätta?')) {
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await loadCourseFromFile(file);
  };

  const triggerPrint = (classId?: string) => {
    useStore.getState().selectObstacle(null);
    useStore.getState().setSelectedVisitId(null);
    requestAnimationFrame(() => requestAnimationFrame(() => printCourse(classId)));
  };

  const btnClass =
    'text-xs px-3 py-1.5 border rounded-md cursor-pointer transition-all whitespace-nowrap bg-white border-gray-200 text-gray-500 hover:bg-[#f5f5f0] hover:border-gray-400 hover:text-gray-800';

  return (
    <div className="relative h-[46px] border-b border-gray-200 bg-white flex items-center px-3.5 gap-2.5 shrink-0 shadow-sm">
      <div className="absolute left-1/2 -translate-x-1/2 text-[15px] font-semibold text-[#1a1a18] tracking-tight whitespace-nowrap pointer-events-none">
        WE Course Designer
      </div>

      <div data-tour="topbar-actions" className="flex items-center gap-1.5">
        {/* Overflow menu */}
        <Dropdown
          trigger={<span className="text-sm leading-none">☰</span>}
          triggerClass="text-xs px-2.5 py-1.5 border rounded-md cursor-pointer transition-all bg-white border-gray-200 text-gray-500 hover:bg-[#f5f5f0] hover:border-gray-400 hover:text-gray-800"
          title="Meny"
          align="left"
        >
          {(close) => (
            <>
              <button
                type="button"
                role="menuitem"
                className={menuItemClass}
                onClick={() => { close(); saveCourseToFile(); }}
                title="Spara aktuell bandesign som en JSON-fil"
              >
                Spara
              </button>
              <button
                type="button"
                role="menuitem"
                className={menuItemClass}
                onClick={() => { close(); handleOpenClick(); }}
                title="Öppna en tidigare sparad bandesign"
              >
                Öppna
              </button>
              <div className="h-px bg-gray-100 my-1" />
              <button
                type="button"
                role="menuitem"
                className={menuItemClass}
                onClick={() => { close(); startTour(); }}
                title="Visa genomgången igen"
              >
                Introduktion
              </button>
              <div className="h-px bg-gray-100 my-1" />
              <button
                type="button"
                role="menuitem"
                className="w-full text-left text-[11px] px-3 py-1.5 text-gray-600 hover:bg-red-50 hover:text-red-600 cursor-pointer bg-transparent border-none"
                onClick={() => { close(); if (window.confirm('Rensa alla hinder?')) clearAll(); }}
              >
                Rensa alla hinder
              </button>
            </>
          )}
        </Dropdown>
        <div className="w-px h-4 bg-gray-200 mx-0.5" />
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

        {/* Print dropdown */}
        <Dropdown trigger="Skriv ut ▾" triggerClass={btnClass} title="Skriv ut en banskiss per klass" align="left">
          {(close) =>
            classes.length === 0 ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => { close(); triggerPrint(undefined); }}
                className={menuItemClass}
              >
                Skriv ut (ingen klass)
              </button>
            ) : (
              classes.map((cls) => (
                <button
                  key={cls.id}
                  type="button"
                  role="menuitem"
                  onClick={() => { close(); triggerPrint(cls.id); }}
                  className={menuItemClass}
                >
                  {cls.name || 'Namnlös'}
                </button>
              ))
            )
          }
        </Dropdown>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}

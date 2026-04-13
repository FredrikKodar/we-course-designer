import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { OBSTACLES } from '../data/obstacles';
import type { Discipline } from '../types';

export default function ClassesPanel() {
  const classes = useStore((s) => s.classes);
  const activeClassIdx = useStore((s) => s.activeClassIdx);
  const placed = useStore((s) => s.placed);
  const visits = useStore((s) => s.visits);
  const addClass = useStore((s) => s.addClass);
  const deleteClass = useStore((s) => s.deleteClass);
  const setActiveClassIdx = useStore((s) => s.setActiveClassIdx);
  const updateClassName = useStore((s) => s.updateClassName);
  const toggleObstacleInUse = useStore((s) => s.toggleObstacleInUse);
  const updateObstacleNote = useStore((s) => s.updateObstacleNote);

  const [discipline, setDiscipline] = useState<Discipline>('teknik');
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [copyFromIdx, setCopyFromIdx] = useState<number | ''>('');

  // Reset discipline to 'teknik' when switching classes
  useEffect(() => {
    setDiscipline('teknik');
  }, [activeClassIdx]);

  const activeClass = classes[activeClassIdx];

  // Sort placed obstacles by visit num (ascending); unvisited go to end
  const sortedPlaced = [...placed].sort((a, b) => {
    const va = visits.find((v) => v.obstacleId === a.id);
    const vb = visits.find((v) => v.obstacleId === b.id);
    if (!va && !vb) return 0;
    if (!va) return 1;
    if (!vb) return -1;
    return va.num.localeCompare(vb.num, undefined, { numeric: true, sensitivity: 'base' });
  });

  const handleAddClass = () => {
    if (!newName.trim()) return;
    addClass(newName.trim(), copyFromIdx === '' ? undefined : (copyFromIdx as number));
    setNewName('');
    setCopyFromIdx('');
    setAdding(false);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Class pill tabs */}
      <div className="flex flex-wrap gap-1">
        {classes.map((cls, i) => (
          <div
            key={cls.id}
            className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] cursor-pointer border transition-colors ${
              i === activeClassIdx
                ? 'bg-[#BA7517] text-white border-[#BA7517]'
                : 'bg-white text-gray-500 border-gray-200 hover:border-[#BA7517]'
            }`}
            onClick={() => setActiveClassIdx(i)}
          >
            <span>{cls.name || 'Namnlös'}</span>
            <button
              type="button"
              className="ml-0.5 text-[9px] opacity-60 hover:opacity-100 bg-transparent border-none p-0 cursor-pointer leading-none"
              onClick={(e) => {
                e.stopPropagation();
                deleteClass(cls.id);
              }}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          className="px-2 py-0.5 rounded-full text-[11px] text-[#3B6D11] border border-dashed border-[#3B6D11] hover:bg-green-50 cursor-pointer"
          onClick={() => setAdding(true)}
        >
          + Lägg till
        </button>
      </div>

      {/* Add class inline form */}
      {adding && (
        <div className="flex flex-col gap-1.5 p-2 bg-[#fafaf8] border border-gray-200 rounded">
          <input
            autoFocus
            type="text"
            placeholder="Klassnamn…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddClass();
              if (e.key === 'Escape') { setAdding(false); setNewName(''); }
              e.stopPropagation();
            }}
            className="text-[11px] border border-gray-200 rounded px-1.5 py-0.5 bg-white focus:outline-none focus:border-[#BA7517]"
          />
          {classes.length > 0 && (
            <select
              value={copyFromIdx}
              onChange={(e) => setCopyFromIdx(e.target.value === '' ? '' : Number(e.target.value))}
              className="text-[11px] border border-gray-200 rounded px-1.5 py-0.5 bg-white focus:outline-none"
            >
              <option value="">Kopiera från… (ingen)</option>
              {classes.map((cls, i) => (
                <option key={cls.id} value={i}>{cls.name || 'Namnlös'}</option>
              ))}
            </select>
          )}
          <div className="flex gap-1">
            <button
              onClick={handleAddClass}
              className="text-[11px] px-2 py-0.5 bg-[#BA7517] text-white rounded cursor-pointer hover:bg-[#9a5f10]"
            >
              Skapa
            </button>
            <button
              onClick={() => { setAdding(false); setNewName(''); setCopyFromIdx(''); }}
              className="text-[11px] px-2 py-0.5 border border-gray-200 rounded text-gray-500 cursor-pointer hover:bg-gray-50"
            >
              Avbryt
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {classes.length === 0 && !adding && (
        <div className="text-[11px] text-gray-300">
          Inga klasser — klicka + Add för att börja.
        </div>
      )}

      {/* Active class editor */}
      {activeClass && (
        <>
          <input
            type="text"
            value={activeClass.name}
            onChange={(e) => updateClassName(activeClass.id, e.target.value)}
            className="text-[11px] font-medium border border-gray-200 rounded px-1.5 py-0.5 bg-white focus:outline-none focus:border-[#BA7517]"
            placeholder="Klassnamn…"
          />

          {/* Discipline switcher */}
          <div className="flex gap-1">
            {(['teknik', 'speed'] as Discipline[]).map((d) => (
              <button
                key={d}
                onClick={() => setDiscipline(d)}
                className={`flex-1 text-[11px] px-2 py-0.5 rounded border cursor-pointer transition-colors ${
                  discipline === d
                    ? 'bg-[#BA7517] text-white border-[#BA7517]'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-[#BA7517]'
                }`}
              >
                {d === 'teknik' ? 'Teknik' : 'Speed'}
              </button>
            ))}
          </div>

          {/* Obstacle rows */}
          {placed.length === 0 ? (
            <div className="text-[11px] text-gray-300">
              Placera hinder på arenan först.
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {sortedPlaced.map((p) => {
                const visit = visits.find((v) => v.obstacleId === p.id);
                const def = OBSTACLES.find((o) => o.id === p.type);
                const entry = activeClass[discipline][p.id] ?? { inUse: true, note: '' };

                return (
                  <div
                    key={p.id}
                    className={`flex flex-col gap-0.5 p-1.5 rounded border transition-opacity ${
                      entry.inUse ? 'border-gray-100 bg-white' : 'border-gray-100 bg-[#fafaf8] opacity-40'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold font-mono shrink-0"
                        style={{ background: '#BA7517' }}
                      >
                        {visit?.num ?? '—'}
                      </span>
                      <span className="flex-1 text-[11px] text-gray-700 truncate">
                        {def?.label ?? p.type}
                      </span>
                      <input
                        type="checkbox"
                        checked={entry.inUse}
                        onChange={() => toggleObstacleInUse(activeClass.id, discipline, p.id)}
                        className="accent-[#BA7517] cursor-pointer"
                        title="Används"
                      />
                    </div>
                    {entry.inUse && (
                      <textarea
                        rows={1}
                        value={entry.note}
                        onChange={(e) => updateObstacleNote(activeClass.id, discipline, p.id, e.target.value)}
                        placeholder="Instruktion…"
                        onKeyDown={(e) => e.stopPropagation()}
                        className="text-[10px] border border-gray-200 rounded px-1 py-0.5 bg-[#fafaf8] resize-none focus:outline-none focus:border-[#BA7517] w-full"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

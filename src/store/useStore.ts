import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type Konva from 'konva';
import type { PlacedObstacle, Visit, RouteSegment, WEClass, EventMeta, Discipline, ViewMode, PathLineType, ObstacleClassEntry } from '../types';
import { runRules } from '../utils/compliance';
import { buildPresetPieces } from '../utils/presets';

export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 4;

// Subset of state stored in localStorage (must be JSON-serialisable)
type PersistedState = Pick<
  StoreState,
  'placed' | 'arenaW' | 'arenaH' | 'pathLineType' | 'pathLineWeight' | 'pathArrowSize' | 'visits' | 'classes' | 'eventMeta'
>;

export interface StoreState {
  // Arena
  arenaW: number;
  arenaH: number;

  // Obstacles
  placed: PlacedObstacle[];
  selectedId: string | null;
  violations: Map<string, string>;

  // Display
  showGrid: boolean;
  snapToGrid: boolean;
  showPath: boolean;
  viewMode: ViewMode;

  // Canvas transform
  zoom: number;
  panX: number;
  panY: number;

  // Path style
  pathLineType: PathLineType;
  pathLineWeight: number;
  pathArrowSize: number;

  // Routing
  visits: Visit[];
  segments: RouteSegment[];
  selectedVisitId: string | null;

  // Classes
  classes: WEClass[];
  activeClassIdx: number;

  // Event metadata
  eventMeta: EventMeta;

  // Undo/redo
  past: Array<{ placed: PlacedObstacle[]; visits: Visit[] }>;
  future: Array<{ placed: PlacedObstacle[]; visits: Visit[] }>;
  undo: () => void;
  redo: () => void;

  // fitArena and stageRef set by Canvas after mount
  fitArena?: () => void;
  stageRef?: Konva.Stage;

  // Actions — obstacles
  setArena: (w: number, h: number) => void;
  placeObstacle: (type: string, wx: number, wy: number) => void;
  moveObstacle: (id: string, wx: number, wy: number) => void;
  rotateObstacle: (id: string, degrees: number) => void;
  deleteObstacle: (id: string) => void;
  selectObstacle: (id: string | null) => void;

  // Actions — display
  setShowGrid: (v: boolean) => void;
  setSnapToGrid: (v: boolean) => void;
  setShowPath: (v: boolean) => void;
  setViewMode: (v: ViewMode) => void;
  setZoom: (z: number) => void;
  setPan: (x: number, y: number) => void;
  setPathStyle: (lineType: PathLineType, weight: number, arrowSize: number) => void;
  clearAll: () => void;
  runCompliance: () => void;

  // Actions — visits
  addVisit: (obstacleId: string, entryPoint: 'entry' | 'exit', approachAngle: number, approachLength: number) => void;
  updateVisit: (id: string, patch: Partial<Pick<Visit, 'num' | 'approachAngle' | 'approachLength' | 'badgeOffX' | 'badgeOffY'>>) => void;
  deleteVisit: (id: string) => void;
  setSelectedVisitId: (id: string | null) => void;

  // Actions — classes
  addClass: (name: string, copyFromIdx?: number) => void;
  deleteClass: (id: string) => void;
  setActiveClassIdx: (idx: number) => void;
  updateClassName: (id: string, name: string) => void;
  toggleObstacleInUse: (classId: string, discipline: Discipline, obstacleId: string) => void;
  updateObstacleNote: (classId: string, discipline: Discipline, obstacleId: string, note: string) => void;

  // Actions — event metadata
  updateEventMeta: (patch: Partial<EventMeta>) => void;
}

const useStore = create<StoreState>()(
  persist(
    (set, get) => {
      const snapshot = () => {
        const { past, placed, visits } = get();
        return {
          past: [...past, { placed, visits }].slice(-50) as Array<{ placed: PlacedObstacle[]; visits: Visit[] }>,
          future: [] as Array<{ placed: PlacedObstacle[]; visits: Visit[] }>,
        };
      };

      // Sync class obstacle records after placed changes.
      // Call AFTER set() has updated placed.
      const syncClassObstacles = () => {
        const { classes, placed } = get();
        if (classes.length === 0) return;
        const placedIds = new Set(placed.map((p) => p.id));
        const updatedClasses = classes.map((cls) => {
          const teknik = { ...cls.teknik };
          const speed = { ...cls.speed };
          for (const p of placed) {
            if (!teknik[p.id]) teknik[p.id] = { inUse: true, note: '' };
            if (!speed[p.id]) speed[p.id] = { inUse: true, note: '' };
          }
          for (const key of Object.keys(teknik)) {
            if (!placedIds.has(key)) delete teknik[key];
          }
          for (const key of Object.keys(speed)) {
            if (!placedIds.has(key)) delete speed[key];
          }
          return { ...cls, teknik, speed };
        });
        set({ classes: updatedClasses });
      };

      return {
        // Arena
        arenaW: 60,
        arenaH: 40,

        // Obstacles
        placed: [],
        selectedId: null,
        violations: new Map(),

        // Display
        showGrid: true,
        snapToGrid: true,
        showPath: true,
        viewMode: 'end',

        // Canvas transform
        zoom: 1,
        panX: 0,
        panY: 0,

        // Path style
        pathLineType: 'dashed',
        pathLineWeight: 1.8,
        pathArrowSize: 1,

        // Routing
        visits: [],
        segments: [],
        selectedVisitId: null,

        // Classes
        classes: [],
        activeClassIdx: 0,

        // Event metadata
        eventMeta: { venue: '', judge: '', courseBuilder: '', date: '' },

        // Undo/redo
        past: [],
        future: [],

        // ── Actions — obstacles ──────────────────────────────────────────

        setArena: (w, h) => {
          set({ arenaW: w, arenaH: h });
          get().runCompliance();
        },

        placeObstacle: (type, wx, wy) => {
          const { snapToGrid: snap } = get();
          const cx = snap ? Math.round(wx) : wx;
          const cy = snap ? Math.round(wy) : wy;
          const pieces = buildPresetPieces(type, cx, cy);
          set((s) => ({ ...snapshot(), placed: [...s.placed, ...pieces] }));
          get().runCompliance();
          syncClassObstacles();
        },

        moveObstacle: (id, wx, wy) => {
          const { snapToGrid: snap, placed } = get();
          const ob = placed.find((p) => p.id === id);
          if (!ob) return;
          const cx = wx + ob.w / 2;
          const cy = wy + ob.h / 2;
          const snappedCx = snap ? Math.round(cx) : cx;
          const snappedCy = snap ? Math.round(cy) : cy;
          const nx = snappedCx - ob.w / 2;
          const ny = snappedCy - ob.h / 2;
          set((s) => ({ ...snapshot(), placed: s.placed.map((p) => (p.id === id ? { ...p, x: nx, y: ny } : p)) }));
          get().runCompliance();
        },

        rotateObstacle: (id, degrees) => {
          const newRot = ((degrees % 360) + 360) % 360;
          set((s) => ({ ...snapshot(), placed: s.placed.map((p) => (p.id === id ? { ...p, rotation: newRot } : p)) }));
          get().runCompliance();
        },

        deleteObstacle: (id) => {
          set((s) => {
            const removedVisitIds = new Set(s.visits.filter((v) => v.obstacleId === id).map((v) => v.id));
            return {
              ...snapshot(),
              placed: s.placed.filter((p) => p.id !== id),
              visits: s.visits.filter((v) => v.obstacleId !== id),
              selectedId: s.selectedId === id ? null : s.selectedId,
              selectedVisitId: removedVisitIds.has(s.selectedVisitId ?? '') ? null : s.selectedVisitId,
            };
          });
          get().runCompliance();
          syncClassObstacles();
        },

        selectObstacle: (id) => set({ selectedId: id }),

        // ── Actions — display ────────────────────────────────────────────

        setShowGrid: (v) => set({ showGrid: v }),
        setSnapToGrid: (v) => set({ snapToGrid: v }),
        setShowPath: (v) => set({ showPath: v }),
        setViewMode: (v) => set({ viewMode: v }),
        setZoom: (z) => set({ zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z)) }),
        setPan: (x, y) => set({ panX: x, panY: y }),
        setPathStyle: (lineType, weight, arrowSize) =>
          set({ pathLineType: lineType, pathLineWeight: weight, pathArrowSize: arrowSize }),

        clearAll: () => {
          set((_s) => ({
            ...snapshot(),
            placed: [],
            visits: [],
            selectedId: null,
            selectedVisitId: null,
            violations: new Map(),
          }));
          syncClassObstacles();
        },

        runCompliance: () => {
          const { placed, arenaW, arenaH } = get();
          set({ violations: runRules(placed, arenaW, arenaH) });
        },

        // ── Actions — visits ─────────────────────────────────────────────

        addVisit: (obstacleId, entryPoint, approachAngle, approachLength) => {
          const { visits } = get();
          const existing = visits.find((v) => v.obstacleId === obstacleId && v.entryPoint === entryPoint);
          if (existing) {
            set((s) => ({
              ...snapshot(),
              visits: s.visits.map((v) =>
                v.id === existing.id ? { ...v, approachAngle, approachLength } : v,
              ),
            }));
            return;
          }
          const maxNum = visits.reduce((max, v) => {
            const n = parseInt(v.num, 10);
            return isNaN(n) ? max : Math.max(max, n);
          }, 0);
          const newVisit: Visit = {
            id: crypto.randomUUID(),
            obstacleId,
            entryPoint,
            num: String(maxNum + 1),
            approachAngle,
            approachLength,
            badgeOffX: 0,
            badgeOffY: -1.5,
          };
          set((s) => ({ ...snapshot(), visits: [...s.visits, newVisit] }));
        },

        updateVisit: (id, patch) => {
          set((s) => ({
            ...snapshot(),
            visits: s.visits.map((v) => (v.id === id ? { ...v, ...patch } : v)),
          }));
        },

        deleteVisit: (id) => {
          set((s) => ({
            ...snapshot(),
            visits: s.visits.filter((v) => v.id !== id),
            selectedVisitId: s.selectedVisitId === id ? null : s.selectedVisitId,
          }));
        },

        setSelectedVisitId: (id) => set({ selectedVisitId: id }),

        // ── Actions — classes ────────────────────────────────────────────

        addClass: (name, copyFromIdx) => {
          const { placed, classes } = get();
          const makeRecord = (): Record<string, ObstacleClassEntry> =>
            Object.fromEntries(placed.map((p) => [p.id, { inUse: true, note: '' }]));

          let teknik = makeRecord();
          let speed = makeRecord();

          if (copyFromIdx !== undefined && classes[copyFromIdx]) {
            const src = classes[copyFromIdx];
            teknik = Object.fromEntries(
              placed.map((p) => [p.id, src.teknik[p.id] ?? { inUse: true, note: '' }]),
            );
            speed = Object.fromEntries(
              placed.map((p) => [p.id, src.speed[p.id] ?? { inUse: true, note: '' }]),
            );
          }

          const newClass: WEClass = { id: crypto.randomUUID(), name, teknik, speed };
          set((s) => ({ classes: [...s.classes, newClass], activeClassIdx: s.classes.length }));
        },

        deleteClass: (id) => {
          set((s) => {
            const newClasses = s.classes.filter((c) => c.id !== id);
            return {
              classes: newClasses,
              activeClassIdx: Math.min(s.activeClassIdx, Math.max(0, newClasses.length - 1)),
            };
          });
        },

        setActiveClassIdx: (idx) => set({ activeClassIdx: idx }),

        updateClassName: (id, name) => {
          set((s) => ({
            classes: s.classes.map((c) => (c.id === id ? { ...c, name } : c)),
          }));
        },

        toggleObstacleInUse: (classId, discipline, obstacleId) => {
          set((s) => ({
            classes: s.classes.map((c) => {
              if (c.id !== classId) return c;
              const disc = c[discipline];
              const current = disc[obstacleId] ?? { inUse: true, note: '' };
              return {
                ...c,
                [discipline]: { ...disc, [obstacleId]: { ...current, inUse: !current.inUse } },
              };
            }),
          }));
        },

        updateObstacleNote: (classId, discipline, obstacleId, note) => {
          set((s) => ({
            classes: s.classes.map((c) => {
              if (c.id !== classId) return c;
              const disc = c[discipline];
              const current = disc[obstacleId] ?? { inUse: true, note: '' };
              return {
                ...c,
                [discipline]: { ...disc, [obstacleId]: { ...current, note } },
              };
            }),
          }));
        },

        // ── Actions — event metadata ─────────────────────────────────────

        updateEventMeta: (patch) => {
          set((s) => ({ eventMeta: { ...s.eventMeta, ...patch } }));
        },

        // ── Undo/redo ────────────────────────────────────────────────────

        undo: () => {
          const { past, placed, visits, future } = get();
          if (past.length === 0) return;
          const prev = past[past.length - 1];
          set({
            past: past.slice(0, -1),
            future: [{ placed, visits }, ...future],
            placed: prev.placed,
            visits: prev.visits,
            selectedId: null,
            selectedVisitId: null,
          });
          get().runCompliance();
          syncClassObstacles();
        },

        redo: () => {
          const { past, placed, visits, future } = get();
          if (future.length === 0) return;
          const next = future[0];
          set({
            past: [...past, { placed, visits }],
            future: future.slice(1),
            placed: next.placed,
            visits: next.visits,
            selectedId: null,
            selectedVisitId: null,
          });
          get().runCompliance();
          syncClassObstacles();
        },
      };
    },
    {
      name: 'we-course-designer',
      partialize: (state): PersistedState => ({
        placed: state.placed,
        arenaW: state.arenaW,
        arenaH: state.arenaH,
        pathLineType: state.pathLineType,
        pathLineWeight: state.pathLineWeight,
        pathArrowSize: state.pathArrowSize,
        visits: state.visits,
        classes: state.classes,
        eventMeta: state.eventMeta,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.runCompliance();
      },
    },
  ),
);

export default useStore;

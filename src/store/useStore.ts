import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type Konva from 'konva';
import type { PlacedObstacle, Visit, RouteSegment, WEClass, ViewMode, PathLineType } from '../types';
import { runRules } from '../utils/compliance';
import { buildPresetPieces } from '../utils/presets';

// Subset of state stored in localStorage (must be JSON-serialisable)
type PersistedState = Pick<
  StoreState,
  'placed' | 'arenaW' | 'arenaH' | 'pathLineType' | 'pathLineWeight' | 'pathArrowSize'
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

  // Path style (stored now, used in Phase 2)
  pathLineType: PathLineType;
  pathLineWeight: number;
  pathArrowSize: number;

  // Routing (stubbed for Phase 2)
  visits: Visit[];
  segments: RouteSegment[];
  classes: WEClass[];
  activeClassIdx: number;
  selectedVisitId: string | null;

  // fitArena and stageRef are set by Canvas after mount via useStore.setState()
  fitArena?: () => void;
  stageRef?: Konva.Stage;

  // Actions
  updateObstacleMeta: (id: string, sequenceNum: string, note: string) => void;
  updateBadgeOffset: (id: string, offX: number, offY: number) => void;
  setArena: (w: number, h: number) => void;
  placeObstacle: (type: string, wx: number, wy: number) => void;
  moveObstacle: (id: string, wx: number, wy: number) => void;
  rotateObstacle: (id: string, degrees: number) => void;
  deleteObstacle: (id: string) => void;
  selectObstacle: (id: string | null) => void;
  setShowGrid: (v: boolean) => void;
  setSnapToGrid: (v: boolean) => void;
  setShowPath: (v: boolean) => void;
  setViewMode: (v: ViewMode) => void;
  setZoom: (z: number) => void;
  setPan: (x: number, y: number) => void;
  setPathStyle: (lineType: PathLineType, weight: number, arrowSize: number) => void;
  clearAll: () => void;
  runCompliance: () => void;
}

const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
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
      viewMode: 'side',

      // Canvas transform
      zoom: 1,
      panX: 0,
      panY: 0,

      // Path style
      pathLineType: 'dashed',
      pathLineWeight: 1.8,
      pathArrowSize: 1,

      // Routing (stubbed)
      visits: [],
      segments: [],
      classes: [],
      activeClassIdx: 0,
      selectedVisitId: null,

      // Actions
      setArena: (w, h) => {
        set({ arenaW: w, arenaH: h });
        get().runCompliance();
      },

      placeObstacle: (type, wx, wy) => {
        const { snapToGrid: snap } = get();
        const cx = snap ? Math.round(wx) : wx;
        const cy = snap ? Math.round(wy) : wy;
        const pieces = buildPresetPieces(type, cx, cy);
        set((s) => ({ placed: [...s.placed, ...pieces] }));
        get().runCompliance();
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
        set((s) => ({
          placed: s.placed.map((p) => (p.id === id ? { ...p, x: nx, y: ny } : p)),
        }));
        get().runCompliance();
      },

      rotateObstacle: (id, degrees) => {
        set((s) => ({
          placed: s.placed.map((p) =>
            p.id === id ? { ...p, rotation: ((degrees % 360) + 360) % 360 } : p,
          ),
        }));
        get().runCompliance();
      },

      deleteObstacle: (id) => {
        set((s) => ({
          placed: s.placed.filter((p) => p.id !== id),
          selectedId: s.selectedId === id ? null : s.selectedId,
        }));
        get().runCompliance();
      },

      selectObstacle: (id) => set({ selectedId: id }),
      setShowGrid: (v) => set({ showGrid: v }),
      setSnapToGrid: (v) => set({ snapToGrid: v }),
      setShowPath: (v) => set({ showPath: v }),
      setViewMode: (v) => set({ viewMode: v }),
      setZoom: (z) => set({ zoom: Math.min(4, Math.max(0.25, z)) }),
      setPan: (x, y) => set({ panX: x, panY: y }),
      setPathStyle: (lineType, weight, arrowSize) =>
        set({ pathLineType: lineType, pathLineWeight: weight, pathArrowSize: arrowSize }),
      clearAll: () => set({ placed: [], selectedId: null, violations: new Map() }),

      updateObstacleMeta: (id, sequenceNum, note) => {
        set((s) => ({
          placed: s.placed.map((p) =>
            p.id === id ? { ...p, sequenceNum, note } : p,
          ),
        }));
      },

      updateBadgeOffset: (id, offX, offY) => {
        set((s) => ({
          placed: s.placed.map((p) =>
            p.id === id ? { ...p, badgeOffX: offX, badgeOffY: offY } : p,
          ),
        }));
      },

      runCompliance: () => {
        const { placed, arenaW, arenaH } = get();
        set({ violations: runRules(placed, arenaW, arenaH) });
      },
    }),
    {
      name: 'we-course-designer',
      partialize: (state): PersistedState => ({
        placed: state.placed,
        arenaW: state.arenaW,
        arenaH: state.arenaH,
        pathLineType: state.pathLineType,
        pathLineWeight: state.pathLineWeight,
        pathArrowSize: state.pathArrowSize,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.runCompliance();
      },
    },
  ),
);

export default useStore;

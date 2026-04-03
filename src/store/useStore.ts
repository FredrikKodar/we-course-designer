import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type Konva from 'konva';
import type { PlacedObstacle, Visit, RouteSegment, WEClass, ViewMode, PathLineType } from '../types';
import { runRules } from '../utils/compliance';
import { buildPresetPieces } from '../utils/presets';

export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 4;

// Subset of state stored in localStorage (must be JSON-serialisable)
type PersistedState = Pick<
  StoreState,
  'placed' | 'arenaW' | 'arenaH' | 'pathLineType' | 'pathLineWeight' | 'pathArrowSize' | 'visits'
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
  updateObstacleMeta: (id: string, note: string) => void;
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
  addVisit: (obstacleId: string, entryPoint: 'entry' | 'exit', approachAngle: number, approachLength: number) => void;
  updateVisit: (id: string, patch: Partial<Pick<Visit, 'num' | 'approachAngle' | 'approachLength' | 'badgeOffX' | 'badgeOffY'>>) => void;
  deleteVisit: (id: string) => void;
  setSelectedVisitId: (id: string | null) => void;
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
      viewMode: 'end',

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
        const dx = nx - ob.x;
        const dy = ny - ob.y;
        set((s) => ({
          placed: s.placed.map((p) => {
            if (p.id === id) return { ...p, x: nx, y: ny };
            if (ob.groupId && p.groupId === ob.groupId) return { ...p, x: p.x + dx, y: p.y + dy };
            return p;
          }),
        }));
        get().runCompliance();
      },

      rotateObstacle: (id, degrees) => {
        const { placed } = get();
        const ob = placed.find((p) => p.id === id);
        if (!ob) return;
        const newRot = ((degrees % 360) + 360) % 360;
        if (!ob.groupId) {
          set((s) => ({
            placed: s.placed.map((p) => (p.id === id ? { ...p, rotation: newRot } : p)),
          }));
          get().runCompliance();
          return;
        }
        // Rotate all group members around the group centroid
        const group = placed.filter((p) => p.groupId === ob.groupId);
        const groupCx = group.reduce((sum, p) => sum + p.x + p.w / 2, 0) / group.length;
        const groupCy = group.reduce((sum, p) => sum + p.y + p.h / 2, 0) / group.length;
        const deltaRad = ((newRot - ob.rotation) * Math.PI) / 180;
        const cos = Math.cos(deltaRad);
        const sin = Math.sin(deltaRad);
        set((s) => ({
          placed: s.placed.map((p) => {
            if (!p.groupId || p.groupId !== ob.groupId) return p;
            const pcx = p.x + p.w / 2 - groupCx;
            const pcy = p.y + p.h / 2 - groupCy;
            const newCx = groupCx + pcx * cos - pcy * sin;
            const newCy = groupCy + pcx * sin + pcy * cos;
            const newPieceRot = (((p.rotation + (newRot - ob.rotation)) % 360) + 360) % 360;
            return { ...p, x: newCx - p.w / 2, y: newCy - p.h / 2, rotation: newPieceRot };
          }),
        }));
        get().runCompliance();
      },

      deleteObstacle: (id) => {
        set((s) => {
          const removedVisitIds = new Set(s.visits.filter((v) => v.obstacleId === id).map((v) => v.id));
          return {
            placed: s.placed.filter((p) => p.id !== id),
            visits: s.visits.filter((v) => v.obstacleId !== id),
            selectedId: s.selectedId === id ? null : s.selectedId,
            selectedVisitId: removedVisitIds.has(s.selectedVisitId ?? '') ? null : s.selectedVisitId,
          };
        });
        get().runCompliance();
      },

      selectObstacle: (id) => set({ selectedId: id }),
      setShowGrid: (v) => set({ showGrid: v }),
      setSnapToGrid: (v) => set({ snapToGrid: v }),
      setShowPath: (v) => set({ showPath: v }),
      setViewMode: (v) => set({ viewMode: v }),
      setZoom: (z) => set({ zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z)) }),
      setPan: (x, y) => set({ panX: x, panY: y }),
      setPathStyle: (lineType, weight, arrowSize) =>
        set({ pathLineType: lineType, pathLineWeight: weight, pathArrowSize: arrowSize }),
      clearAll: () => set({ placed: [], visits: [], selectedId: null, selectedVisitId: null, violations: new Map() }),

      updateObstacleMeta: (id, note) => {
        set((s) => ({
          placed: s.placed.map((p) => (p.id === id ? { ...p, note } : p)),
        }));
      },

      addVisit: (obstacleId, entryPoint, approachAngle, approachLength) => {
        const { visits } = get();
        const existing = visits.find((v) => v.obstacleId === obstacleId && v.entryPoint === entryPoint);
        if (existing) {
          set((s) => ({
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
        set((s) => ({ visits: [...s.visits, newVisit] }));
      },

      updateVisit: (id, patch) => {
        set((s) => ({
          visits: s.visits.map((v) => (v.id === id ? { ...v, ...patch } : v)),
        }));
      },

      deleteVisit: (id) => {
        set((s) => ({
          visits: s.visits.filter((v) => v.id !== id),
          selectedVisitId: s.selectedVisitId === id ? null : s.selectedVisitId,
        }));
      },

      setSelectedVisitId: (id) => set({ selectedVisitId: id }),

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
        visits: state.visits,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.runCompliance();
      },
    },
  ),
);

export default useStore;

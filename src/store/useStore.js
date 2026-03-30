import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { runRules } from '../utils/compliance';
import { buildPresetPieces } from '../utils/presets';

const useStore = create(
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

      // Path style (stored now, used in Phase 2)
      pathLineType: 'dashed',
      pathLineWeight: 1.8,
      pathArrowSize: 1,

      // Routing (stubbed)
      visits: [],
      segments: [],
      classes: [],
      activeClassIdx: 0,
      selectedVisitId: null,

      // ── Actions ──

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
        // Snap the centre, then store top-left
        const cx = wx + ob.w / 2;
        const cy = wy + ob.h / 2;
        const snappedCx = snap ? Math.round(cx) : cx;
        const snappedCy = snap ? Math.round(cy) : cy;
        const nx = snappedCx - ob.w / 2;
        const ny = snappedCy - ob.h / 2;
        set((s) => ({
          placed: s.placed.map((p) =>
            p.id === id ? { ...p, x: nx, y: ny } : p,
          ),
        }));
        get().runCompliance();
      },

      rotateObstacle: (id, degrees) => {
        set((s) => ({
          placed: s.placed.map((p) =>
            p.id === id
              ? { ...p, rotation: ((degrees % 360) + 360) % 360 }
              : p,
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

      runCompliance: () => {
        const { placed, arenaW, arenaH } = get();
        const violations = runRules(placed, arenaW, arenaH);
        set({ violations });
      },
    }),
    {
      name: 'we-course-designer',
      partialize: (state) => ({
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

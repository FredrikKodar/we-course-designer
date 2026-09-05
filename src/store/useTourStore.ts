import { create } from 'zustand';
import { tourSteps } from '../data/tourSteps';

interface TourState {
  active: boolean;
  stepIdx: number;
  start: () => void;
  next: () => void;
  back: () => void;
  stop: () => void;
}

const useTourStore = create<TourState>((set, get) => ({
  active: false,
  stepIdx: 0,

  start: () => set({ active: true, stepIdx: 0 }),

  // Advancing past the last step ends the tour — the last step's button reads "Klar"
  next: () => {
    const { stepIdx } = get();
    if (stepIdx >= tourSteps.length - 1) {
      set({ active: false });
      return;
    }
    set({ stepIdx: stepIdx + 1 });
  },

  back: () => set((s) => ({ stepIdx: Math.max(0, s.stepIdx - 1) })),

  stop: () => set({ active: false }),
}));

export default useTourStore;

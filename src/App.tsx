import { useEffect } from 'react';
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import RightPanel from './components/RightPanel';
import TourOverlay from './components/TourOverlay';
import useTourStore from './store/useTourStore';

// Deliberately outside the Zustand persist blob, so it survives Rensa
// and any future store version migration.
const SEEN_KEY = 'we-course-designer-tutorial-seen';

export default function App() {
  const start = useTourStore((s) => s.start);
  const active = useTourStore((s) => s.active);

  // First visit: open the tour automatically
  useEffect(() => {
    let seen: string | null = null;
    try {
      seen = window.localStorage.getItem(SEEN_KEY);
    } catch {
      // Storage can throw outright in some privacy modes — behave as if unseen
    }
    if (!seen) start();
  }, [start]);

  // Mark as seen once the tour has been opened and closed, however it ended
  // (Klar, Hoppa över, or Esc).
  useEffect(() => {
    if (active) return;
    try {
      window.localStorage.setItem(SEEN_KEY, '1');
    } catch {
      // Ignore — the tour will simply offer itself again next visit
    }
  }, [active]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f5f5f0]">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <Canvas />
        <RightPanel />
      </div>
      <TourOverlay />
    </div>
  );
}

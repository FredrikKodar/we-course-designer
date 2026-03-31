import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import RightPanel from './components/RightPanel';

export default function App() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f5f5f0]">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <Canvas />
        <RightPanel />
      </div>
    </div>
  );
}

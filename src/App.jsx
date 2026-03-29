import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';

export default function App() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f5f5f0]">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <Canvas />
        <div className="w-[172px] border-l border-gray-200 bg-white">Right panel</div>
      </div>
    </div>
  );
}

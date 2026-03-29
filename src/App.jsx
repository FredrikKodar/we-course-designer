import useStore from './store/useStore';

export default function App() {
  const arenaW = useStore((s) => s.arenaW);
  const arenaH = useStore((s) => s.arenaH);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f5f5f0]">
      <div className="h-[46px] border-b border-gray-200 bg-white flex items-center px-4 text-sm font-semibold">
        WE Course Designer — {arenaW} x {arenaH} m
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[162px] border-r border-gray-200 bg-white">Sidebar</div>
        <div className="flex-1 bg-[#c8d4c4]">Canvas</div>
        <div className="w-[172px] border-l border-gray-200 bg-white">Right panel</div>
      </div>
    </div>
  );
}

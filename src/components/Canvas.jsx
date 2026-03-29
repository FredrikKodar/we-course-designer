import { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect, Line, Text } from 'react-konva';
import useStore from '../store/useStore';
import { OBSTACLES } from '../data/obstacles';
import { worldToScreen, screenToWorld } from '../utils/coords';
import ObstacleGroup from './ObstacleGroup';

const MARGIN = 60;

function getEffectiveArena(arenaW, arenaH, viewMode) {
  return viewMode === 'side' ? { w: arenaW, h: arenaH } : { w: arenaH, h: arenaW };
}

function getBaseScale(stageW, stageH, arenaW, arenaH, viewMode) {
  const ea = getEffectiveArena(arenaW, arenaH, viewMode);
  return Math.min((stageW - MARGIN) / ea.w, (stageH - MARGIN) / ea.h);
}

function GridLines({ ea, scale, panX, panY }) {
  const lines = [];

  // Minor grid (1m)
  for (let i = 0; i <= ea.w; i++) {
    const x = panX + i * scale;
    lines.push(
      <Line key={`vm${i}`} points={[x, panY, x, panY + ea.h * scale]} stroke="rgba(0,0,0,0.06)" strokeWidth={0.5} />,
    );
  }
  for (let j = 0; j <= ea.h; j++) {
    const y = panY + j * scale;
    lines.push(
      <Line key={`hm${j}`} points={[panX, y, panX + ea.w * scale, y]} stroke="rgba(0,0,0,0.06)" strokeWidth={0.5} />,
    );
  }
  // Major grid (5m)
  for (let i = 0; i <= ea.w; i += 5) {
    const x = panX + i * scale;
    lines.push(
      <Line key={`vM${i}`} points={[x, panY, x, panY + ea.h * scale]} stroke="rgba(0,0,0,0.15)" strokeWidth={0.8} />,
    );
  }
  for (let j = 0; j <= ea.h; j += 5) {
    const y = panY + j * scale;
    lines.push(
      <Line key={`hM${j}`} points={[panX, y, panX + ea.w * scale, y]} stroke="rgba(0,0,0,0.15)" strokeWidth={0.8} />,
    );
  }

  return <>{lines}</>;
}

function GridLabels({ ea, scale, panX, panY }) {
  const labels = [];
  const fs = Math.max(9, Math.min(11, scale * 0.7));

  for (let i = 0; i <= ea.w; i += 5) {
    labels.push(
      <Text
        key={`lx${i}`}
        x={panX + i * scale + 2}
        y={panY + ea.h * scale + 3}
        text={`${i}m`}
        fontSize={fs}
        fontFamily="monospace"
        fill="rgba(0,0,0,0.28)"
      />,
    );
  }
  for (let j = 0; j <= ea.h; j += 5) {
    labels.push(
      <Text
        key={`ly${j}`}
        x={panX - 28}
        y={panY + j * scale - fs / 2}
        text={`${j}m`}
        fontSize={fs}
        fontFamily="monospace"
        fill="rgba(0,0,0,0.28)"
      />,
    );
  }

  return <>{labels}</>;
}

export default function Canvas() {
  const containerRef = useRef(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });

  const arenaW = useStore((s) => s.arenaW);
  const arenaH = useStore((s) => s.arenaH);
  const viewMode = useStore((s) => s.viewMode);
  const zoom = useStore((s) => s.zoom);
  const panX = useStore((s) => s.panX);
  const panY = useStore((s) => s.panY);
  const showGrid = useStore((s) => s.showGrid);
  const placed = useStore((s) => s.placed);
  const selectedId = useStore((s) => s.selectedId);
  const snapToGrid = useStore((s) => s.snapToGrid);
  const violations = useStore((s) => s.violations);
  const setZoom = useStore((s) => s.setZoom);
  const setPan = useStore((s) => s.setPan);
  const selectObstacle = useStore((s) => s.selectObstacle);
  const placeObstacle = useStore((s) => s.placeObstacle);
  const moveObstacle = useStore((s) => s.moveObstacle);
  const rotateObstacle = useStore((s) => s.rotateObstacle);

  // ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setStageSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const baseScale = getBaseScale(stageSize.width, stageSize.height, arenaW, arenaH, viewMode);
  const scale = baseScale * zoom;
  const ea = getEffectiveArena(arenaW, arenaH, viewMode);

  // Fit arena (called from Topbar via store)
  const fitArena = useCallback(() => {
    const bs = getBaseScale(stageSize.width, stageSize.height, arenaW, arenaH, viewMode);
    const ea2 = getEffectiveArena(arenaW, arenaH, viewMode);
    useStore.setState({
      zoom: 1,
      panX: (stageSize.width - ea2.w * bs) / 2,
      panY: (stageSize.height - ea2.h * bs) / 2,
    });
  }, [stageSize.width, stageSize.height, arenaW, arenaH, viewMode]);

  // Expose fitArena on store so Topbar can call it
  useEffect(() => {
    useStore.setState({ fitArena });
  }, [fitArena]);

  // Auto-fit on first render and when arena dimensions change
  useEffect(() => {
    fitArena();
  }, [fitArena]);

  // Coordinate context for worldToScreen/screenToWorld
  const coordCtx = { panX, panY, scale, viewMode, arenaH };

  // Wheel zoom
  const handleWheel = (e) => {
    e.evt.preventDefault();
    const delta = e.evt.deltaY > 0 ? 0.9 : 1.1;
    setZoom(zoom * delta);
  };

  // Pan state
  const panRef = useRef({ isPanning: false, startX: 0, startY: 0, startPanX: 0, startPanY: 0 });

  const handleMouseDown = (e) => {
    // Middle mouse or shift+click
    if (e.evt.button === 1 || (e.evt.button === 0 && e.evt.shiftKey)) {
      panRef.current = {
        isPanning: true,
        startX: e.evt.clientX,
        startY: e.evt.clientY,
        startPanX: panX,
        startPanY: panY,
      };
      e.evt.preventDefault();
    }
  };

  const handleMouseMove = (e) => {
    if (!panRef.current.isPanning) return;
    const dx = e.evt.clientX - panRef.current.startX;
    const dy = e.evt.clientY - panRef.current.startY;
    setPan(panRef.current.startPanX + dx, panRef.current.startPanY + dy);
  };

  const handleMouseUp = () => {
    panRef.current.isPanning = false;
  };

  // Click on empty canvas → deselect
  const handleStageClick = (e) => {
    if (e.target === e.target.getStage()) {
      selectObstacle(null);
    }
  };

  // Drop from sidebar
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('obstacleType');
    if (!type) return;
    const rect = containerRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const [wx, wy] = screenToWorld(sx, sy, coordCtx);
    placeObstacle(type, wx, wy);
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden bg-[#c8d4c4] cursor-crosshair"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Stage
        width={stageSize.width}
        height={stageSize.height}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleStageClick}
      >
        <Layer>
          {/* Arena background */}
          <Rect
            x={panX}
            y={panY}
            width={ea.w * scale}
            height={ea.h * scale}
            fill="#b4c4aa"
          />

          {/* Grid */}
          {showGrid && <GridLines ea={ea} scale={scale} panX={panX} panY={panY} />}
          {showGrid && <GridLabels ea={ea} scale={scale} panX={panX} panY={panY} />}

          {/* Arena border */}
          <Rect
            x={panX}
            y={panY}
            width={ea.w * scale}
            height={ea.h * scale}
            stroke="#4a7044"
            strokeWidth={2}
          />

          {/* Obstacles */}
          {placed.map((p, idx) => {
            const def = OBSTACLES.find((o) => o.id === p.type);
            if (!def) return null;
            return (
              <ObstacleGroup
                key={p.id}
                placed={p}
                def={def}
                index={idx}
                scale={scale}
                coordCtx={coordCtx}
                isSelected={p.id === selectedId}
                snapToGrid={snapToGrid}
                violation={violations.get(p.id) || null}
                onSelect={() => selectObstacle(p.id)}
                onMove={(wx, wy) => moveObstacle(p.id, wx, wy)}
                onRotate={(deg) => rotateObstacle(p.id, deg)}
              />
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}

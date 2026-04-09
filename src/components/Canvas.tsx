import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect, Line, Text } from 'react-konva';
import Konva from 'konva';
import type { ViewMode, PlacedObstacle, ObstacleDef } from '../types';
import useStore, { MIN_ZOOM, MAX_ZOOM } from '../store/useStore';
import { OBSTACLES } from '../data/obstacles';
import { screenToWorld } from '../utils/coords';
import ObstacleGroup from './ObstacleGroup';

function pointInObstacle(wx: number, wy: number, p: PlacedObstacle, def: ObstacleDef): boolean {
  const cx = p.x + def.w / 2;
  const cy = p.y + def.h / 2;
  const dx = wx - cx;
  const dy = wy - cy;
  const rotRad = -((p.rotation || 0) * Math.PI) / 180;
  const localX = dx * Math.cos(rotRad) - dy * Math.sin(rotRad);
  const localY = dx * Math.sin(rotRad) + dy * Math.cos(rotRad);
  return Math.abs(localX) <= def.w / 2 && Math.abs(localY) <= def.h / 2;
}

const MARGIN = 60;

function getEffectiveArena(arenaW: number, arenaH: number, viewMode: ViewMode) {
  return viewMode === 'side' ? { w: arenaW, h: arenaH } : { w: arenaH, h: arenaW };
}

function getBaseScale(stageW: number, stageH: number, arenaW: number, arenaH: number, viewMode: ViewMode) {
  const ea = getEffectiveArena(arenaW, arenaH, viewMode);
  return Math.min((stageW - MARGIN) / ea.w, (stageH - MARGIN) / ea.h);
}

interface GridProps {
  ea: { w: number; h: number };
  scale: number;
  panX: number;
  panY: number;
}

function GridLines({ ea, scale, panX, panY }: GridProps) {
  const lines = [];

  // Minor grid (1m)
  for (let i = 0; i <= ea.w; i++) {
    const x = panX + i * scale;
    lines.push(
      <Line key={`vm${i}`} points={[x, panY, x, panY + ea.h * scale]} stroke="rgba(0,0,0,0.22)" strokeWidth={0.5} />,
    );
  }
  for (let j = 0; j <= ea.h; j++) {
    const y = panY + j * scale;
    lines.push(
      <Line key={`hm${j}`} points={[panX, y, panX + ea.w * scale, y]} stroke="rgba(0,0,0,0.22)" strokeWidth={0.5} />,
    );
  }
  // Major grid (5m)
  for (let i = 0; i <= ea.w; i += 5) {
    const x = panX + i * scale;
    lines.push(
      <Line key={`vM${i}`} points={[x, panY, x, panY + ea.h * scale]} stroke="rgba(0,0,0,0.55)" strokeWidth={0.8} />,
    );
  }
  for (let j = 0; j <= ea.h; j += 5) {
    const y = panY + j * scale;
    lines.push(
      <Line key={`hM${j}`} points={[panX, y, panX + ea.w * scale, y]} stroke="rgba(0,0,0,0.55)" strokeWidth={0.8} />,
    );
  }

  return <>{lines}</>;
}

function GridLabels({ ea, scale, panX, panY }: GridProps) {
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
        fill="rgba(0,0,0,0.65)"
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
        fill="rgba(0,0,0,0.65)"
      />,
    );
  }

  return <>{labels}</>;
}

export default function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [stageSize, setStageSize] = useState<{ width: number; height: number }>({
    width: 800,
    height: 600,
  });

  const [hoveredId, setHoveredId] = useState<string | null>(null);

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
  const addVisit = useStore((s) => s.addVisit);
  const visits = useStore((s) => s.visits);
  const selectedVisitId = useStore((s) => s.selectedVisitId);
  const showPath = useStore((s) => s.showPath);
  const updateVisit = useStore((s) => s.updateVisit);
  const setSelectedVisitId = useStore((s) => s.setSelectedVisitId);
  const pathLineType = useStore((s) => s.pathLineType);
  const pathLineWeight = useStore((s) => s.pathLineWeight);
  const pathArrowSize = useStore((s) => s.pathArrowSize);
  const deleteObstacle = useStore((s) => s.deleteObstacle);

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

  // Expose stageRef on store
  useEffect(() => {
    if (stageRef.current) {
      useStore.setState({ stageRef: stageRef.current });
    }
  }, []);

  // Auto-fit on first render and when arena dimensions change
  useEffect(() => {
    fitArena();
  }, [fitArena]);

  // Keyboard shortcuts: undo, redo, delete visit/obstacle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        useStore.getState().undo();
        return;
      }

      if (
        (e.key === 'y' && (e.ctrlKey || e.metaKey)) ||
        (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey)
      ) {
        e.preventDefault();
        useStore.getState().redo();
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const { selectedVisitId: svId, selectedId: obId } = useStore.getState();
        if (svId) {
          useStore.getState().deleteVisit(svId);
          e.preventDefault();
        } else if (obId) {
          useStore.getState().deleteObstacle(obId);
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Coordinate context for worldToScreen/screenToWorld
  const coordCtx = { panX, panY, scale, viewMode, arenaH };

  // Wheel zoom
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    // Pinch (ctrlKey) or mouse wheel (deltaMode=1, line-based) → zoom; trackpad swipe → pan
    if (e.evt.ctrlKey || e.evt.deltaMode === 1) {
      const delta = e.evt.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * delta));
      const pointer = e.target.getStage()?.getPointerPosition();
      if (!pointer) { setZoom(newZoom); return; }
      const newPanX = pointer.x - (pointer.x - panX) * (newZoom / zoom);
      const newPanY = pointer.y - (pointer.y - panY) * (newZoom / zoom);
      setZoom(newZoom);
      setPan(newPanX, newPanY);
    } else {
      setPan(panX - e.evt.deltaX, panY - e.evt.deltaY);
    }
  };

  // Pan state
  const cycleRef = useRef<{ wx: number; wy: number; ids: string[]; index: number } | null>(null);

  const panRef = useRef<{
    isPanning: boolean;
    startX: number;
    startY: number;
    startPanX: number;
    startPanY: number;
  }>({ isPanning: false, startX: 0, startY: 0, startPanX: 0, startPanY: 0 });

  const visitDragRef = useRef<{
    obstacleId: string;
    entryPoint: 'entry' | 'exit';
    dotX: number;
    dotY: number;
  } | null>(null);
  const [visitDragTip, setVisitDragTip] = useState<{ x: number; y: number } | null>(null);

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
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

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (panRef.current.isPanning) {
      const dx = e.evt.clientX - panRef.current.startX;
      const dy = e.evt.clientY - panRef.current.startY;
      setPan(panRef.current.startPanX + dx, panRef.current.startPanY + dy);
    }
    if (visitDragRef.current) {
      const pos = e.target.getStage()?.getPointerPosition();
      if (pos) setVisitDragTip({ x: pos.x, y: pos.y });
    }
  };

  const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    panRef.current.isPanning = false;
    const drag = visitDragRef.current;
    if (drag) {
      const pos = e.target.getStage()?.getPointerPosition();
      if (pos) {
        const dx = pos.x - drag.dotX;
        const dy = pos.y - drag.dotY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 5) {
          const approachLength = Math.min(dist / scale, 5);
          const approachAngle = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
          addVisit(drag.obstacleId, drag.entryPoint, approachAngle, approachLength);
        }
      }
      visitDragRef.current = null;
      setVisitDragTip(null);
    }
  };

  // Obstacle click with cycling: repeated clicks at same spot cycle through all overlapping obstacles
  const handleObstacleClickAtPos = useCallback((screenX: number, screenY: number) => {
    const [wx, wy] = screenToWorld(screenX, screenY, coordCtx);

    // All obstacles at this world point, sorted topmost-first (last in array = top z-order)
    const hits = placed
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => {
        const def = OBSTACLES.find((o) => o.id === p.type);
        return def ? pointInObstacle(wx, wy, p, def) : false;
      })
      .reverse()
      .map(({ p }) => p.id);

    if (hits.length === 0) {
      cycleRef.current = null;
      selectObstacle(null);
      setSelectedVisitId(null);
      return;
    }

    const TOLERANCE = 1.5; // world meters — same area means cycle
    const prev = cycleRef.current;
    let nextIndex: number;
    if (prev && Math.abs(prev.wx - wx) < TOLERANCE && Math.abs(prev.wy - wy) < TOLERANCE) {
      // Same area — advance cycle
      nextIndex = (prev.index + 1) % hits.length;
    } else {
      // New area — start from the currently selected obstacle if it's here (it's visually on top),
      // otherwise from the placement-topmost one
      const selIdx = hits.indexOf(selectedId ?? '');
      nextIndex = selIdx >= 0 ? selIdx : 0;
    }

    cycleRef.current = { wx, wy, ids: hits, index: nextIndex };
    selectObstacle(hits[nextIndex]);
  }, [coordCtx, placed, selectedId, selectObstacle, setSelectedVisitId]);

  // Click on empty canvas → deselect
  const handleStageClick = () => {
    cycleRef.current = null;
    selectObstacle(null);
    setSelectedVisitId(null);
  };

  // Drop from sidebar
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('obstacleType');
    if (!type) return;
    if (!containerRef.current) return;
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
        ref={stageRef}
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
            fill="white"
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
            stroke="#111"
            strokeWidth={2}
          />

          {/* Obstacles — selected obstacle rendered last so it is topmost and draggable */}
          {[...placed].sort((a, b) => (a.id === selectedId ? 1 : b.id === selectedId ? -1 : 0)).map((p) => {
            const def = OBSTACLES.find((o) => o.id === p.type);
            if (!def) return null;
            return (
              <ObstacleGroup
                key={p.id}
                placed={p}
                def={def}
                scale={scale}
                coordCtx={coordCtx}
                isSelected={p.id === selectedId}
                snapToGrid={snapToGrid}
                violation={violations.get(p.id) || null}
                onClickAtPos={handleObstacleClickAtPos}
                onMove={(wx, wy) => moveObstacle(p.id, wx, wy)}
                onRotate={(deg) => rotateObstacle(p.id, deg)}
                isHovered={p.id === hoveredId}
                onHoverChange={(hovered) => setHoveredId(hovered ? p.id : null)}
                onDotMouseDown={(entryPoint, dotX, dotY) => {
                  visitDragRef.current = { obstacleId: p.id, entryPoint, dotX, dotY };
                  setVisitDragTip({ x: dotX, y: dotY });
                }}
                visits={visits.filter((v) => v.obstacleId === p.id)}
                selectedVisitId={selectedVisitId}
                showPath={showPath}
                pathLineType={pathLineType}
                pathLineWeight={pathLineWeight}
                pathArrowSize={pathArrowSize}
                onSelectVisit={(visitId) => {
                  if (selectedVisitId === visitId) { setSelectedVisitId(null); return; }
                  setSelectedVisitId(visitId); selectObstacle(p.id);
                }}
                onUpdateVisit={updateVisit}
                onDelete={() => deleteObstacle(p.id)}
              />
            );
          })}
          {/* Visit creation preview line */}
          {visitDragTip && visitDragRef.current && (
            <Line
              points={[
                visitDragRef.current.dotX,
                visitDragRef.current.dotY,
                visitDragTip.x,
                visitDragTip.y,
              ]}
              stroke="#111"
              strokeWidth={1.5}
              dash={[5, 4]}
              listening={false}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}

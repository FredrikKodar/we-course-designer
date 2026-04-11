import { useRef } from 'react';
import { Group, Line, Circle, Arrow, Rect, Text } from 'react-konva';
import Konva from 'konva';
import type { PlacedGate, CoordCtx, Visit, PathLineType } from '../types';
import { worldToScreen } from '../utils/coords';

const MIN_GATE_WIDTH_M = 0.5;

const SYMBOL_REACH_M = 0.3;    // triangle: meters from center to tip
const CIRCLE_RADIUS_M = 0.25;  // start-finish circle radius in meters
const GATE_COLOR = '#1a1a18';

interface GateGroupProps {
  gate: PlacedGate;
  scale: number;
  coordCtx: CoordCtx;
  isSelected: boolean;
  isHovered: boolean;
  onHoverChange: (hovered: boolean) => void;
  onClick: () => void;
  onMove: (cx: number, cy: number) => void;
  onRotate: (degrees: number) => void;
  onDelete: () => void;
  // Start-finish only:
  onDotMouseDown?: (entryPoint: 'entry' | 'exit', dotX: number, dotY: number) => void;
  visits?: Visit[];
  selectedVisitId?: string | null;
  showPath?: boolean;
  pathLineWeight?: number;
  pathArrowSize?: number;
  pathLineType?: PathLineType;
  // Resize (wired in Task 4):
  onResizeEnd?: (newWidth: number, newCx: number, newCy: number) => void;
}

export default function GateGroup({
  gate, scale, coordCtx, isSelected, isHovered,
  onHoverChange, onClick, onMove, onRotate, onDelete, onResizeEnd,
  onDotMouseDown, visits = [], selectedVisitId: _selectedVisitId, showPath,
}: GateGroupProps) {
  const [sx, sy] = worldToScreen(gate.x, gate.y, coordCtx);
  const showDots = gate.type === 'start-finish' && (isHovered || isSelected);
  const halfWidthPx = (gate.gateWidth / 2) * scale;
  const reachPx = SYMBOL_REACH_M * scale;
  const circleRadPx = CIRCLE_RADIUS_M * scale;
  const minHalfPx = (MIN_GATE_WIDTH_M / 2) * scale;
  const dotOffsetPx = 0.5 * scale;  // entry/exit dots at ±0.5m from gate center
  const HIT_RADIUS = Math.max(14, reachPx + 6);  // larger transparent hit area for easier grabbing

  const lineRef = useRef<Konva.Line>(null);
  const leftSymRef = useRef<Konva.Group>(null);
  const rightSymRef = useRef<Konva.Group>(null);

  // Equilateral triangle points (pointing right, centered at origin)
  // tip at (+reach, 0); base at (-reach/2, ±halfBase)
  const halfBase = reachPx * Math.sqrt(3) / 2;
  const leftTriPoints = [
    reachPx, 0,               // tip (pointing right = toward center)
    -reachPx / 2, -halfBase,  // base top
    -reachPx / 2, +halfBase,  // base bottom
  ];
  const rightTriPoints = [
    -reachPx, 0,              // tip (pointing left = toward center)
    reachPx / 2, -halfBase,   // base top
    reachPx / 2, +halfBase,   // base bottom
  ];

  // Rotation handle distance from center
  const HANDLE_DIST = halfWidthPx + reachPx + 20;

  const handleRotDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const angle = Math.atan2(node.y(), node.x()) * 180 / Math.PI;
    onRotate(angle);
    node.x(HANDLE_DIST * Math.cos(angle * Math.PI / 180));
    node.y(HANDLE_DIST * Math.sin(angle * Math.PI / 180));
  };

  const handleSymbolDragMove = (
    side: 'left' | 'right',
    e: Konva.KonvaEventObject<DragEvent>,
  ) => {
    const node = e.target as Konva.Group;
    const isCtrl = e.evt.ctrlKey;
    // Constrain to x-axis
    node.y(0);

    if (isCtrl) {
      // Symmetric: mirror the other symbol
      const otherRef = side === 'left' ? rightSymRef : leftSymRef;
      otherRef.current?.x(-node.x());
    }

    // Update line imperatively
    const leftX = side === 'left' ? node.x() : (leftSymRef.current?.x() ?? -halfWidthPx);
    const rightX = side === 'right' ? node.x() : (rightSymRef.current?.x() ?? halfWidthPx);
    lineRef.current?.points([leftX, 0, rightX, 0]);
    node.getLayer()?.batchDraw();
  };

  const handleSymbolDragEnd = (
    _side: 'left' | 'right',
    e: Konva.KonvaEventObject<DragEvent>,
  ) => {
    const isCtrl = e.evt.ctrlKey;
    const leftAbs = leftSymRef.current?.getAbsolutePosition() ?? { x: sx - halfWidthPx, y: sy };
    const rightAbs = rightSymRef.current?.getAbsolutePosition() ?? { x: sx + halfWidthPx, y: sy };

    const dx = rightAbs.x - leftAbs.x;
    const dy = rightAbs.y - leftAbs.y;
    const newWidthPx = Math.sqrt(dx * dx + dy * dy);
    const newGateWidth = Math.max(MIN_GATE_WIDTH_M, newWidthPx / scale);

    let newCx = gate.x;
    let newCy = gate.y;

    if (!isCtrl) {
      // Center moved: midpoint of the two symbol absolute positions
      const midX = (leftAbs.x + rightAbs.x) / 2;
      const midY = (leftAbs.y + rightAbs.y) / 2;
      const { panX, panY, viewMode, arenaH } = coordCtx;
      if (viewMode === 'end') {
        newCx = (midY - panY) / scale;
        newCy = arenaH - (midX - panX) / scale;
      } else {
        newCx = (midX - panX) / scale;
        newCy = (midY - panY) / scale;
      }
    }

    onResizeEnd?.(newGateWidth, newCx, newCy);

    // Reset symbol positions so React re-render is clean
    const newHalfPx = (newGateWidth / 2) * scale;
    leftSymRef.current?.x(-newHalfPx);
    leftSymRef.current?.y(0);
    rightSymRef.current?.x(newHalfPx);
    rightSymRef.current?.y(0);
  };

  const handleGroupDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const absPos = e.target.getAbsolutePosition();
    const { panX, panY, viewMode, arenaH } = coordCtx;
    let newCx: number, newCy: number;
    if (viewMode === 'end') {
      const ru = (absPos.x - panX) / scale;
      const rv = (absPos.y - panY) / scale;
      newCx = rv;
      newCy = arenaH - ru;
    } else {
      newCx = (absPos.x - panX) / scale;
      newCy = (absPos.y - panY) / scale;
    }
    onMove(newCx, newCy);
    // Do NOT reset position here — React re-renders with new x={sx} y={sy} from
    // worldToScreen(newCx, newCy) which matches the dragged position visually.
  };

  return (
    <Group
      x={sx}
      y={sy}
      rotation={gate.rotation}
      draggable
      onDragEnd={handleGroupDragEnd}
      onClick={(e) => { e.cancelBubble = true; onClick(); }}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      {/* Transparent hit area for the full gate — makes dragging the gate easier */}
      <Rect
        x={-halfWidthPx - reachPx}
        y={-HIT_RADIUS}
        width={(halfWidthPx + reachPx) * 2}
        height={HIT_RADIUS * 2}
        fill="transparent"
      />

      {/* Dotted line between symbols */}
      <Line
        ref={lineRef}
        points={[-halfWidthPx, 0, halfWidthPx, 0]}
        stroke={GATE_COLOR}
        strokeWidth={1.5}
        dash={[4, 4]}
        listening={false}
      />

      {/* Left symbol — draggable for resize */}
      <Group
        ref={leftSymRef}
        x={-halfWidthPx}
        y={0}
        draggable
        dragBoundFunc={(pos) => ({ x: Math.min(pos.x, -minHalfPx), y: 0 })}
        onDragMove={(e) => handleSymbolDragMove('left', e)}
        onDragEnd={(e) => handleSymbolDragEnd('left', e)}
        onMouseDown={(e) => { e.cancelBubble = true; }}
      >
        <Circle radius={HIT_RADIUS} fill="transparent" />
        {gate.type === 'marker' ? (
          <Line points={leftTriPoints} closed fill={GATE_COLOR} stroke={GATE_COLOR} strokeWidth={1} listening={false} />
        ) : (
          <Circle radius={circleRadPx} fill={GATE_COLOR} stroke={GATE_COLOR} strokeWidth={1} listening={false} />
        )}
      </Group>

      {/* Right symbol — draggable for resize */}
      <Group
        ref={rightSymRef}
        x={halfWidthPx}
        y={0}
        draggable
        dragBoundFunc={(pos) => ({ x: Math.max(pos.x, minHalfPx), y: 0 })}
        onDragMove={(e) => handleSymbolDragMove('right', e)}
        onDragEnd={(e) => handleSymbolDragEnd('right', e)}
        onMouseDown={(e) => { e.cancelBubble = true; }}
      >
        <Circle radius={HIT_RADIUS} fill="transparent" />
        {gate.type === 'marker' ? (
          <Line points={rightTriPoints} closed fill={GATE_COLOR} stroke={GATE_COLOR} strokeWidth={1} listening={false} />
        ) : (
          <Circle radius={circleRadPx} fill={GATE_COLOR} stroke={GATE_COLOR} strokeWidth={1} listening={false} />
        )}
      </Group>

      {/* Connection dots — start-finish only, at ±0.5m from gate center */}
      {gate.type === 'start-finish' && showDots && (
        <>
          {/* Left dot (entry) at -0.5m */}
          <Circle
            x={-dotOffsetPx}
            y={0}
            radius={5}
            fill="#4a9a2a"
            stroke="white"
            strokeWidth={1.5}
            onMouseDown={(e) => {
              e.cancelBubble = true;
              const abs = e.target.getAbsolutePosition();
              onDotMouseDown?.('entry', abs.x, abs.y);
            }}
          />
          {/* Right dot (exit) at +0.5m */}
          <Circle
            x={dotOffsetPx}
            y={0}
            radius={5}
            fill="#4a9a2a"
            stroke="white"
            strokeWidth={1.5}
            onMouseDown={(e) => {
              e.cancelBubble = true;
              const abs = e.target.getAbsolutePosition();
              onDotMouseDown?.('exit', abs.x, abs.y);
            }}
          />
        </>
      )}

      {/* Visit approach arrows + badges */}
      {gate.type === 'start-finish' && showPath && visits.map((visit) => {
        const dotLocalX = visit.entryPoint === 'entry' ? -dotOffsetPx : dotOffsetPx;
        const label = visit.role === 'start' ? 'Start'
          : visit.role === 'finish' ? 'Mål'
          : visit.role === 'start-and-finish' ? 'Start\nMål'
          : '?';
        const badgeOffXPx = visit.badgeOffX * scale;
        const badgeOffYPx = visit.badgeOffY * scale;
        const approachAngleRad = (visit.approachAngle - gate.rotation) * Math.PI / 180;
        const approachLenPx = visit.approachLength * scale;
        const tailX = dotLocalX - Math.sin(approachAngleRad) * approachLenPx;
        const tailY = -Math.cos(approachAngleRad) * approachLenPx;

        return (
          <Group key={visit.id}>
            {/* Approach arrow — use Arrow (not Line) for pointer head */}
            <Arrow
              points={[tailX, tailY, dotLocalX, 0]}
              stroke="#BA7517"
              strokeWidth={2}
              fill="#BA7517"
              pointerLength={8}
              pointerWidth={6}
            />
            {/* Badge */}
            <Group x={dotLocalX + badgeOffXPx} y={badgeOffYPx}>
              <Circle radius={12} fill="#BA7517" />
              <Text
                text={label}
                fontSize={visit.role === 'start-and-finish' ? 7 : 9}
                fontStyle="bold"
                fill="white"
                align="center"
                x={-10}
                y={visit.role === 'start-and-finish' ? -8 : -5}
                width={20}
                listening={false}
              />
            </Group>
          </Group>
        );
      })}

      {/* Selection outline */}
      {isSelected && (
        <Rect
          x={-halfWidthPx - reachPx - 4}
          y={-reachPx - 4}
          width={(halfWidthPx + reachPx + 4) * 2}
          height={(reachPx + 4) * 2}
          stroke="#BA7517"
          strokeWidth={1.5}
          dash={[4, 3]}
          fill="transparent"
          listening={false}
        />
      )}

      {/* Rotation handle */}
      {isSelected && (
        <>
          <Line
            points={[0, 0, HANDLE_DIST, 0]}
            stroke="#888"
            strokeWidth={1}
            dash={[3, 3]}
            listening={false}
          />
          <Circle
            x={HANDLE_DIST}
            y={0}
            radius={7}
            fill="#333"
            draggable
            onDragMove={handleRotDragMove}
            onDragEnd={(e) => {
              e.target.position({ x: HANDLE_DIST, y: 0 });
            }}
          />
          <Text
            x={HANDLE_DIST - 5}
            y={-5}
            text="↻"
            fontSize={10}
            fill="white"
            listening={false}
          />
        </>
      )}

      {/* Delete badge */}
      {isSelected && (
        <Group
          x={halfWidthPx + reachPx + 6}
          y={-reachPx - 6}
          onClick={(e) => { e.cancelBubble = true; onDelete(); }}
        >
          <Circle radius={8} fill="#333" />
          <Text text="×" fontSize={10} fill="white" x={-3.5} y={-5} listening={false} />
        </Group>
      )}
    </Group>
  );
}

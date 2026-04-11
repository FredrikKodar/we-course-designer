import { useRef } from 'react';
import { Group, Line, Circle, Rect, Text } from 'react-konva';
import Konva from 'konva';
import type { PlacedGate, CoordCtx, Visit, PathLineType } from '../types';
import { worldToScreen } from '../utils/coords';

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
  gate, scale, coordCtx, isSelected, isHovered: _isHovered,
  onHoverChange, onClick, onMove, onRotate, onDelete,
}: GateGroupProps) {
  const [sx, sy] = worldToScreen(gate.x, gate.y, coordCtx);
  const halfWidthPx = (gate.gateWidth / 2) * scale;
  const reachPx = SYMBOL_REACH_M * scale;
  const circleRadPx = CIRCLE_RADIUS_M * scale;

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
  const rotHandleRef = useRef<Konva.Circle>(null);

  const handleRotDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const angle = Math.atan2(node.y(), node.x()) * 180 / Math.PI;
    onRotate(angle);
    node.x(HANDLE_DIST * Math.cos(angle * Math.PI / 180));
    node.y(HANDLE_DIST * Math.sin(angle * Math.PI / 180));
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
      {/* Dotted line between symbols */}
      <Line
        ref={lineRef}
        points={[-halfWidthPx, 0, halfWidthPx, 0]}
        stroke={GATE_COLOR}
        strokeWidth={1.5}
        dash={[4, 4]}
        listening={false}
      />

      {/* Left symbol */}
      <Group ref={leftSymRef} x={-halfWidthPx} y={0}>
        {gate.type === 'marker' ? (
          <Line
            points={leftTriPoints}
            closed
            fill={GATE_COLOR}
            stroke={GATE_COLOR}
            strokeWidth={1}
            listening={false}
          />
        ) : (
          <Circle
            radius={circleRadPx}
            fill={GATE_COLOR}
            stroke={GATE_COLOR}
            strokeWidth={1}
            listening={false}
          />
        )}
      </Group>

      {/* Right symbol */}
      <Group ref={rightSymRef} x={halfWidthPx} y={0}>
        {gate.type === 'marker' ? (
          <Line
            points={rightTriPoints}
            closed
            fill={GATE_COLOR}
            stroke={GATE_COLOR}
            strokeWidth={1}
            listening={false}
          />
        ) : (
          <Circle
            radius={circleRadPx}
            fill={GATE_COLOR}
            stroke={GATE_COLOR}
            strokeWidth={1}
            listening={false}
          />
        )}
      </Group>

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
            ref={rotHandleRef}
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

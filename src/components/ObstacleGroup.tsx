import { useState, useEffect, Fragment } from 'react';
import { Group, Image as KonvaImage, Rect, Circle, Line, Text, Arrow } from 'react-konva';
import Konva from 'konva';
import type { PlacedObstacle, ObstacleDef, CoordCtx, Visit, PathLineType } from '../types';
import { SCALE } from '../data/obstacles';
import { worldToScreen, screenToWorld } from '../utils/coords';

// Module-level cache: key → HTMLImageElement
const imageCache = new Map<string, HTMLImageElement>();

function useSvgImage(obstacleType: string, svg: string, viewBox: string, pixelW: number, pixelH: number) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const key = `${obstacleType}|${pixelW}|${pixelH}`;

  useEffect(() => {
    if (imageCache.has(key)) {
      setImage(imageCache.get(key) ?? null);
      return;
    }

    const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${pixelW}" height="${pixelH}" viewBox="${viewBox}">${svg}</svg>`;
    const blob = new Blob([fullSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    let revoked = false;
    const img = new window.Image();
    img.onload = () => {
      imageCache.set(key, img);
      setImage(img);
      revoked = true;
      // Don't revoke: keep the URL alive since it backs the cached image
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      revoked = true;
    };
    img.src = url;

    return () => {
      if (!revoked) URL.revokeObjectURL(url);
    };
  }, [key, svg, viewBox, pixelW, pixelH]);

  return image;
}

interface ObstacleGroupProps {
  placed: PlacedObstacle;
  def: ObstacleDef;
  scale: number;
  coordCtx: CoordCtx;
  isSelected: boolean;
  snapToGrid: boolean;
  violation: string | null;
  onSelect: () => void;
  onMove: (wx: number, wy: number) => void;
  onRotate: (degrees: number) => void;
  isHovered: boolean;
  onHoverChange: (hovered: boolean) => void;
  onDotMouseDown: (entryPoint: 'entry' | 'exit', dotX: number, dotY: number) => void;
  visits: Visit[];
  selectedVisitId: string | null;
  showPath: boolean;
  pathLineType: PathLineType;
  pathLineWeight: number;
  pathArrowSize: number;
  onSelectVisit: (visitId: string) => void;
  onUpdateVisit: (id: string, patch: Partial<Pick<Visit, 'num' | 'approachAngle' | 'approachLength' | 'badgeOffX' | 'badgeOffY'>>) => void;
  onDelete: () => void;
}

export default function ObstacleGroup({
  placed,
  def,
  scale,
  coordCtx,
  isSelected,
  snapToGrid,
  violation,
  onSelect,
  onMove,
  onRotate,
  isHovered,
  onHoverChange,
  onDotMouseDown,
  visits,
  selectedVisitId,
  showPath,
  pathLineType,
  pathLineWeight,
  pathArrowSize,
  onSelectVisit,
  onUpdateVisit,
  onDelete,
}: ObstacleGroupProps) {
  const HANDLE_RADIUS = 9;

  // SVG image — always use def dimensions so stale localStorage w/h never distort rendering
  const pixelW = def.w * SCALE;
  const pixelH = def.h * SCALE;
  const image = useSvgImage(placed.type, def.svg, def.viewBox, pixelW, pixelH);

  // Screen position of obstacle centre
  const [sx, sy] = worldToScreen(placed.x + placed.w / 2, placed.y + placed.h / 2, coordCtx);

  // Scaled dimensions on screen
  const drawW = def.w * scale;
  const drawH = def.h * scale;

  const handleDist = drawH / 2 + 18;

  // Handle drag end — convert screen position back to world top-left
  const handleDragEnd = (e: Konva.KonvaEventObject<MouseEvent>) => {
    onHoverChange(false);
    const node = e.target;
    const newSx = node.x();
    const newSy = node.y();
    const [wx, wy] = screenToWorld(newSx, newSy, coordCtx);
    // wx, wy is the centre; moveObstacle expects top-left
    onMove(wx - placed.w / 2, wy - placed.h / 2);
    // Reset Konva node position to the store-driven position
    node.position({ x: sx, y: sy });
  };

  // Rotation handle drag
  const handleRotateDrag = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const node = e.target;
    const dx = node.x() - sx;
    const dy = node.y() - sy;
    let angle = (Math.atan2(dx, -dy) * 180) / Math.PI;
    if (snapToGrid) {
      angle = Math.round(angle / 45) * 45;
    }
    angle = ((angle % 360) + 360) % 360;
    onRotate(angle);

    // Reset handle position — it will be redrawn from rotation state
    const rotRad = (angle * Math.PI) / 180;
    node.position({
      x: sx + Math.sin(rotRad) * handleDist,
      y: sy - Math.cos(rotRad) * handleDist,
    });
  };

  const rotRad = ((placed.rotation || 0) * Math.PI) / 180;
  const entryDotX = sx + (def.entry.x * Math.cos(rotRad) - def.entry.y * Math.sin(rotRad)) * scale;
  const entryDotY = sy + (def.entry.x * Math.sin(rotRad) + def.entry.y * Math.cos(rotRad)) * scale;
  const exitDotX  = sx + (def.exit.x  * Math.cos(rotRad) - def.exit.y  * Math.sin(rotRad)) * scale;
  const exitDotY  = sy + (def.exit.x  * Math.sin(rotRad) + def.exit.y  * Math.cos(rotRad)) * scale;
  // Some obstacles (fålla, ring) have entry === exit at the same position
  const sameDot = Math.abs(entryDotX - exitDotX) < 1 && Math.abs(entryDotY - exitDotY) < 1;
  const handleX = sx + Math.sin(rotRad) * handleDist;
  const handleY = sy - Math.cos(rotRad) * handleDist;
  const BADGE_R = 9;
  const badgeLocalX = drawW / 2 + 5;
  const badgeLocalY = -drawH / 2 - 5;
  const badgeX = sx + badgeLocalX * Math.cos(rotRad) - badgeLocalY * Math.sin(rotRad);
  const badgeY = sy + badgeLocalX * Math.sin(rotRad) + badgeLocalY * Math.cos(rotRad);

  return (
    <>
      {/* Main draggable group */}
      <Group
        x={sx}
        y={sy}
        draggable
        onDragEnd={handleDragEnd}
        onClick={(e) => {
          e.cancelBubble = true;
          onSelect();
        }}
        onMouseEnter={() => onHoverChange(true)}
        onMouseLeave={() => onHoverChange(false)}
        rotation={placed.rotation || 0}
      >
        {/* SVG image, centred */}
        {image && (
          <KonvaImage
            image={image}
            x={-drawW / 2}
            y={-drawH / 2}
            width={drawW}
            height={drawH}
          />
        )}

        {/* Selection / violation outline */}
        {(isSelected || violation) && (
          <Rect
            x={-drawW / 2 - 5}
            y={-drawH / 2 - 5}
            width={drawW + 10}
            height={drawH + 10}
            stroke={violation ? 'rgba(226,75,74,0.6)' : 'rgba(186,117,23,0.5)'}
            strokeWidth={isSelected ? 1.5 : 1}
            dash={[4, 3]}
          />
        )}
      </Group>

      {/* Connection dots — always rendered; visible on hover or when selected */}
      <Circle
        x={entryDotX}
        y={entryDotY}
        radius={5}
        fill="#333"
        stroke="white"
        strokeWidth={1.5}
        opacity={isHovered || isSelected ? 1 : 0}
        cursor="crosshair"
        onMouseEnter={() => onHoverChange(true)}
        onMouseLeave={() => onHoverChange(false)}
        onMouseDown={(e) => { e.cancelBubble = true; onDotMouseDown('entry', entryDotX, entryDotY); }}
      />
      {!sameDot && (
        <Circle
          x={exitDotX}
          y={exitDotY}
          radius={5}
          fill="#333"
          stroke="white"
          strokeWidth={1.5}
          opacity={isHovered || isSelected ? 1 : 0}
          cursor="crosshair"
          onMouseEnter={() => onHoverChange(true)}
          onMouseLeave={() => onHoverChange(false)}
          onMouseDown={(e) => { e.cancelBubble = true; onDotMouseDown('exit', exitDotX, exitDotY); }}
        />
      )}

      {/* Approach arrows and badges per Visit */}
      {showPath && visits.map((visit) => {
        const dot =
          visit.entryPoint === 'entry'
            ? { x: entryDotX, y: entryDotY }
            : { x: exitDotX, y: exitDotY };

        const angleRad = (visit.approachAngle * Math.PI) / 180;
        const tailX = dot.x + Math.sin(angleRad) * visit.approachLength * scale;
        const tailY = dot.y - Math.cos(angleRad) * visit.approachLength * scale;

        const isVisitSel = visit.id === selectedVisitId;
        const stroke = isVisitSel ? '#BA7517' : '#111';
        const dash =
          pathLineType === 'dashed' ? [5, 4] :
          pathLineType === 'dotted' ? [2, 4] :
          undefined;

        const bx = dot.x + (visit.badgeOffX * Math.cos(rotRad) - visit.badgeOffY * Math.sin(rotRad)) * scale;
        const by = dot.y + (visit.badgeOffX * Math.sin(rotRad) + visit.badgeOffY * Math.cos(rotRad)) * scale;
        const bR = Math.max(9, Math.min(14, scale * 0.6));

        return (
          <Fragment key={visit.id}>
            {/* Approach arrow — tip at connection dot */}
            <Arrow
              points={[tailX, tailY, dot.x, dot.y]}
              stroke={stroke}
              fill={stroke}
              strokeWidth={pathLineWeight}
              pointerLength={pathArrowSize * 6}
              pointerWidth={pathArrowSize * 6}
              dash={dash}
              onClick={(e) => { e.cancelBubble = true; onSelectVisit(visit.id); }}
            />

            {/* Tail handle — visible when visit selected */}
            {isVisitSel && (
              <Circle
                x={tailX}
                y={tailY}
                radius={5}
                fill="white"
                stroke="#333"
                strokeWidth={1.5}
                draggable
                onDragEnd={(e) => {
                  e.cancelBubble = true;
                  const node = e.target;
                  const dx = node.x() - dot.x;
                  const dy = node.y() - dot.y;
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  const newLength = Math.min(dist / scale, 5);
                  const newAngle = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
                  onUpdateVisit(visit.id, { approachAngle: newAngle, approachLength: newLength });
                  node.position({ x: tailX, y: tailY });
                }}
              />
            )}

            {/* Leader line from connection dot to badge */}
            <Line
              points={[dot.x, dot.y, bx, by]}
              stroke="rgba(186,117,23,0.35)"
              strokeWidth={1}
              dash={[3, 4]}
            />

            {/* Number badge */}
            <Group
              x={bx}
              y={by}
              draggable={isVisitSel}
              onClick={(e) => { e.cancelBubble = true; onSelectVisit(visit.id); }}
              onDragEnd={(e) => {
                e.cancelBubble = true;
                const node = e.target;
                const worldDx = (node.x() - dot.x) / scale;
                const worldDy = (node.y() - dot.y) / scale;
                const offX = worldDx * Math.cos(rotRad) + worldDy * Math.sin(rotRad);
                const offY = -worldDx * Math.sin(rotRad) + worldDy * Math.cos(rotRad);
                onUpdateVisit(visit.id, { badgeOffX: offX, badgeOffY: offY });
                node.position({ x: bx, y: by });
              }}
            >
              <Circle radius={bR} fill={violation ? '#fde8e8' : '#f5f5f0'} stroke={violation ? '#E24B4A' : '#111'} strokeWidth={1.5} />
              {isVisitSel && (
                <Circle radius={bR + 4} stroke="rgba(186,117,23,0.5)" strokeWidth={2} />
              )}
              <Text
                x={-bR}
                y={-bR / 2}
                width={bR * 2}
                height={bR}
                text={visit.num}
                fontSize={Math.max(8, bR)}
                fontFamily="monospace"
                fontStyle="bold"
                fill="#111"
                align="center"
                verticalAlign="middle"
              />
            </Group>
          </Fragment>
        );
      })}

      {/* Rotation handle (visible when selected) */}
      {isSelected && (
        <>
          <Line
            points={[sx, sy - drawH / 2, handleX, handleY + HANDLE_RADIUS]}
            stroke="rgba(186,117,23,0.6)"
            strokeWidth={1}
            dash={[3, 3]}
          />
          <Group x={handleX} y={handleY} draggable onDragMove={handleRotateDrag}>
            <Circle radius={HANDLE_RADIUS} fill="#1a1a18" cursor="grab" />
            <Text
              text="↻"
              fontSize={11}
              fill="white"
              width={HANDLE_RADIUS * 2}
              height={HANDLE_RADIUS * 2}
              x={-HANDLE_RADIUS}
              y={-HANDLE_RADIUS}
              align="center"
              verticalAlign="middle"
              listening={false}
            />
          </Group>
        </>
      )}

      {/* Delete badge — top-right corner of selection rect */}
      {isSelected && (
        <Group
          x={badgeX}
          y={badgeY}
          onClick={(e) => { e.cancelBubble = true; onDelete(); }}
          onTap={(e) => { e.cancelBubble = true; onDelete(); }}
        >
          <Circle radius={BADGE_R} fill="#1a1a18" cursor="pointer" />
          <Text
            text="×"
            fontSize={13}
            fontStyle="bold"
            fill="white"
            width={BADGE_R * 2}
            height={BADGE_R * 2}
            x={-BADGE_R}
            y={-BADGE_R}
            align="center"
            verticalAlign="middle"
            listening={false}
          />
        </Group>
      )}
    </>
  );
}

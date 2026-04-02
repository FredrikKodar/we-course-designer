import { useState, useEffect } from 'react';
import { Group, Image as KonvaImage, Rect, Circle, Line, Text } from 'react-konva';
import Konva from 'konva';
import type { PlacedObstacle, ObstacleDef, CoordCtx } from '../types';
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
  index: number;
  scale: number;
  coordCtx: CoordCtx;
  isSelected: boolean;
  snapToGrid: boolean;
  violation: string | null;
  onSelect: () => void;
  onMove: (wx: number, wy: number) => void;
  onRotate: (degrees: number) => void;
}

export default function ObstacleGroup({
  placed,
  def,
  index,
  scale,
  coordCtx,
  isSelected,
  snapToGrid,
  violation,
  onSelect,
  onMove,
  onRotate,
}: ObstacleGroupProps) {
  const HANDLE_RADIUS = 7;

  // SVG image
  const pixelW = placed.w * SCALE;
  const pixelH = placed.h * SCALE;
  const image = useSvgImage(placed.type, def.svg, def.viewBox, pixelW, pixelH);

  // Screen position of obstacle centre
  const [sx, sy] = worldToScreen(placed.x + placed.w / 2, placed.y + placed.h / 2, coordCtx);

  // Scaled dimensions on screen
  const drawW = placed.w * scale;
  const drawH = placed.h * scale;

  // Number badge
  const badgeSx = sx + (placed.badgeOffX || 0) * scale;
  const badgeSy = sy + (placed.badgeOffY || 0) * scale;
  const badgeR = Math.max(9, Math.min(14, scale * 0.6));

  // Rotation handle position (above obstacle, in local coords before rotation)
  const handleDist = drawH / 2 + badgeR * 2 + 18;

  // Obstacle stroke colour
  const strokeColor = violation ? '#E24B4A' : isSelected ? '#BA7517' : 'rgba(0,0,0,0.3)';

  // Handle drag end — convert screen position back to world top-left
  const handleDragEnd = (e: Konva.KonvaEventObject<MouseEvent>) => {
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
  const handleX = sx + Math.sin(rotRad) * handleDist;
  const handleY = sy - Math.cos(rotRad) * handleDist;

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

        {/* Obstacle bounding rect */}
        <Rect
          x={-drawW / 2}
          y={-drawH / 2}
          width={drawW}
          height={drawH}
          stroke={strokeColor}
          strokeWidth={isSelected ? 2.5 : 1}
        />

        {/* Selection outline */}
        {isSelected && (
          <Rect
            x={-drawW / 2 - 5}
            y={-drawH / 2 - 5}
            width={drawW + 10}
            height={drawH + 10}
            stroke="rgba(186,117,23,0.4)"
            strokeWidth={1}
            dash={[4, 3]}
          />
        )}
      </Group>

      {/* Leader line from centre to badge */}
      <Line
        points={[sx, sy, badgeSx, badgeSy]}
        stroke="rgba(186,117,23,0.35)"
        strokeWidth={1}
        dash={[3, 4]}
      />

      {/* Number badge */}
      <Circle
        x={badgeSx}
        y={badgeSy}
        radius={badgeR}
        fill={violation ? '#E24B4A' : '#BA7517'}
      />
      {isSelected && (
        <Circle
          x={badgeSx}
          y={badgeSy}
          radius={badgeR + 4}
          stroke="rgba(186,117,23,0.5)"
          strokeWidth={2}
        />
      )}
      <Text
        x={badgeSx - badgeR}
        y={badgeSy - badgeR / 2}
        width={badgeR * 2}
        height={badgeR}
        text={placed.sequenceNum || String(index + 1)}
        fontSize={Math.max(8, badgeR)}
        fontFamily="monospace"
        fontStyle="bold"
        fill="#fff"
        align="center"
        verticalAlign="middle"
      />

      {/* Rotation handle (visible when selected) */}
      {isSelected && (
        <>
          <Line
            points={[sx, sy - drawH / 2, handleX, handleY + HANDLE_RADIUS]}
            stroke="rgba(186,117,23,0.6)"
            strokeWidth={1}
            dash={[3, 3]}
          />
          <Circle
            x={handleX}
            y={handleY}
            radius={HANDLE_RADIUS}
            fill="#BA7517"
            draggable
            onDragMove={handleRotateDrag}
          />
        </>
      )}
    </>
  );
}

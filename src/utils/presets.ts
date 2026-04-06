import type { PlacedObstacle } from '../types';
import { OBSTACLES } from '../data/obstacles';

export function buildPresetPieces(type: string, cx: number, cy: number): PlacedObstacle[] {
  const def = OBSTACLES.find((o) => o.id === type);
  if (!def) return [];
  const timestamp = Date.now();
  return [
    {
      id: `${timestamp}_${Math.random().toString(36).slice(2, 8)}`,
      type,
      x: cx - def.w / 2,
      y: cy - def.h / 2,
      w: def.w,
      h: def.h,
      rotation: 0,
    },
  ];
}

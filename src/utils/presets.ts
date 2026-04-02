import type { PlacedObstacle } from '../types';
import { OBSTACLES, expandPreset } from '../data/obstacles';

export function buildPresetPieces(type: string, cx: number, cy: number): PlacedObstacle[] {
  const pieces = expandPreset(type, cx, cy);
  const timestamp = Date.now();

  if (pieces) {
    const groupId = `${type}_${timestamp}`;
    return pieces.map((piece, i) => ({
      ...piece,
      id: `${timestamp}_${Math.random().toString(36).slice(2, 8)}_${i}`,
      groupId,
      note: '',
    }));
  }

  const def = OBSTACLES.find((o) => o.id === type);
  if (!def) return [];
  return [
    {
      id: `${timestamp}_${Math.random().toString(36).slice(2, 8)}`,
      type,
      x: cx - def.w / 2,
      y: cy - def.h / 2,
      w: def.w,
      h: def.h,
      rotation: 0,
      groupId: null,
      note: '',
    },
  ];
}

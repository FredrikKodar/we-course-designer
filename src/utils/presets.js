import { OBSTACLES, expandPreset } from '../data/obstacles';

/**
 * Build PlacedObstacle(s) for a given type at (cx, cy) world centre.
 * For presets, returns N individual pieces with shared groupId.
 * For single obstacles, returns an array of one.
 * @param {string} type - OBSTACLES[].id
 * @param {number} cx - world centre x
 * @param {number} cy - world centre y
 * @returns {Array} PlacedObstacle[] ready to append to store
 */
export function buildPresetPieces(type, cx, cy) {
  const pieces = expandPreset(type, cx, cy);
  const timestamp = Date.now();

  if (pieces) {
    const groupId = `${type}_${timestamp}`;
    return pieces.map((piece, i) => ({
      ...piece,
      id: `${timestamp}_${Math.random().toString(36).slice(2, 8)}_${i}`,
      groupId,
    }));
  }

  // Single obstacle
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
      badgeOffX: 0,
      badgeOffY: -(def.h / 2 + 1.5),
    },
  ];
}

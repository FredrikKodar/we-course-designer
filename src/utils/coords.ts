import type { CoordCtx, PlacedObstacle, ObstacleDef, ConnectionPoint } from '../types';

/**
 * Convert world coordinates (meters) to screen coordinates (pixels).
 */
export function worldToScreen(wx: number, wy: number, ctx: CoordCtx): [number, number] {
  const { panX, panY, scale, viewMode, arenaH } = ctx;
  if (viewMode === 'end') {
    return [panX + (arenaH - wy) * scale, panY + wx * scale];
  }
  return [panX + wx * scale, panY + wy * scale];
}

/**
 * Convert screen coordinates (pixels) to world coordinates (meters).
 */
export function screenToWorld(sx: number, sy: number, ctx: CoordCtx): [number, number] {
  const { panX, panY, scale, viewMode, arenaH } = ctx;
  if (viewMode === 'end') {
    const ru = (sx - panX) / scale;
    const rv = (sy - panY) / scale;
    return [rv, arenaH - ru];
  }
  return [(sx - panX) / scale, (sy - panY) / scale];
}

/**
 * Get rotation-aware connection points in world coordinates.
 */
export function getConnectionPoints(
  placed: Pick<PlacedObstacle, 'x' | 'y' | 'w' | 'h' | 'rotation'>,
  def: Pick<ObstacleDef, 'entry' | 'exit'>,
): { entry: ConnectionPoint; exit: ConnectionPoint } {
  const cx = placed.x + placed.w / 2;
  const cy = placed.y + placed.h / 2;
  const rot = ((placed.rotation ?? 0) * Math.PI) / 180;
  const cosR = Math.cos(rot);
  const sinR = Math.sin(rot);

  function rotate(lx: number, ly: number): ConnectionPoint {
    return {
      x: cx + lx * cosR - ly * sinR,
      y: cy + lx * sinR + ly * cosR,
    };
  }

  return {
    entry: rotate(def.entry.x, def.entry.y),
    exit: rotate(def.exit.x, def.exit.y),
  };
}

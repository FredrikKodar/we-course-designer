/**
 * Convert world coordinates (meters) to screen coordinates (pixels).
 * @param {number} wx - world x (meters from arena left)
 * @param {number} wy - world y (meters from arena top)
 * @param {object} ctx - { panX, panY, scale, viewMode, arenaH }
 * @returns {[number, number]} [sx, sy] screen pixels
 */
export function worldToScreen(wx, wy, ctx) {
  const { panX, panY, scale, viewMode, arenaH } = ctx;
  if (viewMode === 'end') {
    return [panX + (arenaH - wy) * scale, panY + wx * scale];
  }
  return [panX + wx * scale, panY + wy * scale];
}

/**
 * Convert screen coordinates (pixels) to world coordinates (meters).
 * @param {number} sx - screen x
 * @param {number} sy - screen y
 * @param {object} ctx - { panX, panY, scale, viewMode, arenaH }
 * @returns {[number, number]} [wx, wy] world meters
 */
export function screenToWorld(sx, sy, ctx) {
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
 * @param {object} placed - PlacedObstacle { x, y, w, h, rotation }
 * @param {object} def - OBSTACLES entry { entry, exit }
 * @returns {{ entry: {x,y}, exit: {x,y} }}
 */
export function getConnectionPoints(placed, def) {
  const cx = placed.x + placed.w / 2;
  const cy = placed.y + placed.h / 2;
  const rot = ((placed.rotation || 0) * Math.PI) / 180;
  const cosR = Math.cos(rot);
  const sinR = Math.sin(rot);

  function rotate(lx, ly) {
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

import type { PlacedObstacle } from '../types';
import { MIN_OBSTACLE_SPACING } from '../data/obstacles';

type ComplianceRule = (
  placed: PlacedObstacle[],
  arenaW: number,
  arenaH: number,
) => Map<string, string>;

const spacingRule: ComplianceRule = (placed, _arenaW, _arenaH) => {
  const violations = new Map<string, string>();
  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) {
      const a = placed[i];
      const b = placed[j];
      const acx = a.x + a.w / 2;
      const acy = a.y + a.h / 2;
      const bcx = b.x + b.w / 2;
      const bcy = b.y + b.h / 2;
      const d = Math.sqrt((acx - bcx) ** 2 + (acy - bcy) ** 2);
      if (d < MIN_OBSTACLE_SPACING) {
        const msg = `⚠ avstånd < ${MIN_OBSTACLE_SPACING} m`;
        violations.set(a.id, msg);
        violations.set(b.id, msg);
      }
    }
  }
  return violations;
};

const boundsRule: ComplianceRule = (placed, arenaW, arenaH) => {
  const violations = new Map<string, string>();
  for (const p of placed) {
    if (p.x < 0 || p.y < 0 || p.x + p.w > arenaW || p.y + p.h > arenaH) {
      violations.set(p.id, '⚠ utanför banan');
    }
  }
  return violations;
};

const rules: ComplianceRule[] = [spacingRule, boundsRule];

export function runRules(
  placed: PlacedObstacle[],
  arenaW: number,
  arenaH: number,
): Map<string, string> {
  const violations = new Map<string, string>();
  for (const rule of rules) {
    for (const [id, msg] of rule(placed, arenaW, arenaH)) {
      violations.set(id, msg);
    }
  }
  return violations;
}

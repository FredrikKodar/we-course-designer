import type { PlacedObstacle } from '../types';

type ComplianceRule = (
  placed: PlacedObstacle[],
  arenaW: number,
  arenaH: number,
) => Map<string, string>;

// spacingRule disabled until spacing thresholds are properly defined per obstacle type

const boundsRule: ComplianceRule = (placed, arenaW, arenaH) => {
  const violations = new Map<string, string>();
  for (const p of placed) {
    if (p.x < 0 || p.y < 0 || p.x + p.w > arenaW || p.y + p.h > arenaH) {
      violations.set(p.id, '⚠ utanför banan');
    }
  }
  return violations;
};

const rules: ComplianceRule[] = [boundsRule];

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

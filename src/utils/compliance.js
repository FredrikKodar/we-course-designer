import { MIN_OBSTACLE_SPACING, GROUP_RULES } from '../data/obstacles';

function spacingRule(placed, arenaW, arenaH) {
  const violations = new Map();
  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) {
      const a = placed[i];
      const b = placed[j];
      // Skip obstacles in the same group
      if (a.groupId && a.groupId === b.groupId) continue;
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
}

function boundsRule(placed, arenaW, arenaH) {
  const violations = new Map();
  for (const p of placed) {
    if (p.x < 0 || p.y < 0 || p.x + p.w > arenaW || p.y + p.h > arenaH) {
      violations.set(p.id, '⚠ utanför banan');
    }
  }
  return violations;
}

function groupRule(placed) {
  const violations = new Map();
  const groups = new Map();
  for (const p of placed) {
    if (!p.groupId) continue;
    if (!groups.has(p.groupId)) groups.set(p.groupId, []);
    groups.get(p.groupId).push(p);
  }
  for (const [groupId, members] of groups) {
    // Extract preset type: groupId format is "{presetType}_{timestamp}"
    const lastUnderscore = groupId.lastIndexOf('_');
    if (lastUnderscore === -1) continue;
    const presetType = groupId.substring(0, lastUnderscore);
    const rule = GROUP_RULES[presetType];
    if (!rule) continue;
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const a = members[i];
        const b = members[j];
        const acx = a.x + a.w / 2;
        const acy = a.y + a.h / 2;
        const bcx = b.x + b.w / 2;
        const bcy = b.y + b.h / 2;
        const d = Math.sqrt((acx - bcx) ** 2 + (acy - bcy) ** 2);
        if (d < rule.minDist || d > rule.maxDist) {
          const msg = '⚠ ' + rule.message(d);
          violations.set(a.id, msg);
          violations.set(b.id, msg);
        }
      }
    }
  }
  return violations;
}

const rules = [spacingRule, boundsRule, groupRule];

/**
 * Run all compliance rules against the placed obstacles.
 * @param {Array} placed - PlacedObstacle[]
 * @param {number} arenaW
 * @param {number} arenaH
 * @returns {Map<string, string>} id → violation message
 */
export function runRules(placed, arenaW, arenaH) {
  const violations = new Map();
  for (const rule of rules) {
    for (const [id, msg] of rule(placed, arenaW, arenaH)) {
      violations.set(id, msg);
    }
  }
  return violations;
}

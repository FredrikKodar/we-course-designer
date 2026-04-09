// ── Primitive aliases ──────────────────────────────────────────────────────

export type ViewMode = 'side' | 'end';
export type PathLineType = 'solid' | 'dashed' | 'dotted';
export type Discipline = 'teknik' | 'speed';

// ── Obstacle data model ────────────────────────────────────────────────────

export interface ConnectionPoint {
  x: number;
  y: number;
}

export interface ObstacleDef {
  id: string;
  label: string;
  variantGroup?: string;   // accordion header in sidebar; omit for single-variant obstacles
  variantLabel?: string;   // chip label inside accordion; omit for single-variant obstacles
  w: number;
  h: number;
  svg: string;
  viewBox: string;
  entry: ConnectionPoint;
  exit: ConnectionPoint;
}

// ── App state data model ───────────────────────────────────────────────────

export interface PlacedObstacle {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
}

export interface Visit {
  id: string;
  obstacleId: string;
  num: string;               // "1", "2a", "11" — string to support letter suffixes
  entryPoint: 'entry' | 'exit';
  approachAngle: number;     // degrees, 0 = north (up), clockwise
  approachLength: number;    // world meters, 0–5
  badgeOffX: number;         // badge offset from connection dot, obstacle-local world meters
  badgeOffY: number;
}

export interface RouteSegment {
  id: string;
  fromVisitId: string;
  toVisitId: string;
  controlPoint: { wx: number; wy: number } | null;
}

export interface ObstacleClassEntry {
  inUse: boolean;
  note: string;
}

export interface WEClass {
  id: string;
  name: string;
  teknik: Record<string, ObstacleClassEntry>;  // keyed by PlacedObstacle.id
  speed: Record<string, ObstacleClassEntry>;   // keyed by PlacedObstacle.id
}

export interface EventMeta {
  venue: string;
  judge: string;
  courseBuilder: string;
  date: string;              // ISO date string e.g. "2026-04-06"
}

// ── Canvas coordinate context ──────────────────────────────────────────────

export interface CoordCtx {
  panX: number;
  panY: number;
  scale: number;
  viewMode: ViewMode;
  arenaH: number;
}

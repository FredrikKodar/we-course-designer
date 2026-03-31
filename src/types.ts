// ── Primitive aliases ──────────────────────────────────────────────────────

export type ViewMode = 'side' | 'end';
export type PathLineType = 'solid' | 'dashed' | 'dotted';

// ── Obstacle data model ────────────────────────────────────────────────────

export interface ConnectionPoint {
  x: number;
  y: number;
}

export interface PresetPiece {
  type: string;
  dx: number;
  dy: number;
}

export interface ObstacleDef {
  id: string;
  label: string;
  w: number;
  h: number;
  svg: string;
  viewBox: string;
  entry: ConnectionPoint;
  exit: ConnectionPoint;
  preset?: string;
  presetPieces?: PresetPiece[];
}

export interface GroupRule {
  minDist: number;
  maxDist: number;
  message: (d: number) => string;
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
  groupId: string | null;
  badgeOffX: number;
  badgeOffY: number;
}

export interface Visit {
  id: string;
  obstacleId: string;
  num: number;
  entryPoint: 'entry' | 'exit';
}

export interface RouteSegment {
  id: string;
  fromVisitId: string;
  toVisitId: string;
  controlPoint: { wx: number; wy: number } | null;
}

export interface WEClass {
  id: string;
  name: string;
  obstacles: Record<string, { criteria: string; notUsed: boolean }>;
}

// ── Canvas coordinate context ──────────────────────────────────────────────

export interface CoordCtx {
  panX: number;
  panY: number;
  scale: number;
  viewMode: ViewMode;
  arenaH: number;
}

import type { ObstacleDef, GroupRule, PlacedObstacle } from '../types';

// Ecuestre — Obstacle definitions
// Each obstacle has:
//   id, label (Swedish), w, h (meters), entry, exit (local offsets from centre, meters)
//   svg (inline SVG string, coordinate origin = obstacle centre, units = pixels at 20px/m)
//   viewBox (matches svg coordinate space)
//   group (optional) — preset group type for dropping multiple pieces

export const SCALE = 20; // px per meter for SVG symbols

export const OBSTACLES: ObstacleDef[] = [

  // ─── TUNNOR ──────────────────────────────────────────────────────────────

  {
    id: 'tunna',
    label: 'Tunna',
    w: 0.8, h: 0.8,
    entry: { x: 0, y: -0.5 },
    exit:  { x: 0, y:  0.5 },
    viewBox: '-16 -16 32 32',
    svg: `<circle cx="0" cy="0" r="8" fill="#1a1a18"/>`,
  },

  {
    id: 'tva-tunnor',
    label: 'Två tunnor',
    w: 6, h: 0.8,
    entry: { x: -3, y: 0 },
    exit:  { x:  3, y: 0 },
    viewBox: '-70 -16 140 32',
    svg: `
      <circle cx="-30" cy="0" r="8" fill="#1a1a18"/>
      <circle cx="30"  cy="0" r="8" fill="#1a1a18"/>
    `,
    preset: 'tva-tunnor',
    presetPieces: [
      { type: 'tunna', dx: -1.5, dy: 0 },
      { type: 'tunna', dx:  1.5, dy: 0 },
    ],
  },

  {
    id: 'tre-tunnor',
    label: 'Tre tunnor',
    w: 3.5, h: 3,
    entry: { x: 0,    y: -1.5 },
    exit:  { x: 0,    y:  1.5 },
    viewBox: '-45 -40 90 80',
    svg: `
      <circle cx="0"   cy="-26" r="8" fill="#1a1a18"/>
      <circle cx="-26" cy="20"  r="8" fill="#1a1a18"/>
      <circle cx="26"  cy="20"  r="8" fill="#1a1a18"/>
    `,
    preset: 'tre-tunnor',
    presetPieces: [
      { type: 'tunna', dx:  0,    dy: -1.5 },
      { type: 'tunna', dx: -1.5,  dy:  1.2 },
      { type: 'tunna', dx:  1.5,  dy:  1.2 },
    ],
  },

  {
    id: 'lans-tunna',
    label: 'Lans ur/i tunna',
    w: 0.8, h: 3,
    entry: { x: 0, y:  0.4 },
    exit:  { x: 0, y:  0.4 },
    viewBox: '-16 -50 32 80',
    svg: `
      <circle cx="0" cy="16" r="8" fill="#1a1a18"/>
      <line x1="0" y1="8" x2="0" y2="-42" stroke="#1a1a18" stroke-width="3" stroke-linecap="round"/>
      <line x1="-8" y1="-24" x2="8" y2="-24" stroke="#1a1a18" stroke-width="2"/>
    `,
  },

  // ─── SLALOM ──────────────────────────────────────────────────────────────

  {
    id: 'enkelslalom',
    label: 'Enkelslalom',
    w: 8, h: 0.8,
    entry: { x: -4, y: 0 },
    exit:  { x:  4, y: 0 },
    viewBox: '-90 -16 180 32',
    svg: `
      <circle cx="-64" cy="0" r="6" fill="#1a1a18"/>
      <circle cx="-32" cy="0" r="6" fill="#1a1a18"/>
      <circle cx="0"   cy="0" r="6" fill="#1a1a18"/>
      <circle cx="32"  cy="0" r="6" fill="#1a1a18"/>
      <circle cx="64"  cy="0" r="6" fill="#1a1a18"/>
    `,
  },

  {
    id: 'parallellslalom',
    label: 'Parallellslalom',
    w: 18, h: 6,
    entry: { x: -9, y: 0 },
    exit:  { x:  9, y: 0 },
    viewBox: '-185 -70 370 140',
    svg: `
      <circle cx="-120" cy="-30" r="6" fill="#1a1a18"/>
      <circle cx="-40"  cy="-30" r="6" fill="#1a1a18"/>
      <circle cx="40"   cy="-30" r="6" fill="#1a1a18"/>
      <circle cx="120"  cy="-30" r="6" fill="#1a1a18"/>
      <circle cx="-80"  cy="30"  r="6" fill="#1a1a18"/>
      <circle cx="0"    cy="30"  r="6" fill="#1a1a18"/>
      <circle cx="80"   cy="30"  r="6" fill="#1a1a18"/>
    `,
    preset: 'parallellslalom',
    presetPieces: [
      { type: 'tunna', dx: -6, dy: -3 },
      { type: 'tunna', dx: -2, dy: -3 },
      { type: 'tunna', dx:  2, dy: -3 },
      { type: 'tunna', dx:  6, dy: -3 },
      { type: 'tunna', dx: -4, dy:  3 },
      { type: 'tunna', dx:  0, dy:  3 },
      { type: 'tunna', dx:  4, dy:  3 },
    ],
  },

  {
    id: 'ryggning',
    label: 'Ryggning i mönster',
    w: 8, h: 1.5,
    entry: { x: -4, y: 0 },
    exit:  { x:  4, y: 0 },
    viewBox: '-90 -24 180 48',
    svg: `
      <circle cx="-60" cy="-14" r="6" fill="#1a1a18"/>
      <circle cx="0"   cy="-14" r="6" fill="#1a1a18"/>
      <circle cx="60"  cy="-14" r="6" fill="#1a1a18"/>
      <circle cx="-60" cy="14"  r="6" fill="#1a1a18"/>
      <circle cx="0"   cy="14"  r="6" fill="#1a1a18"/>
      <circle cx="60"  cy="14"  r="6" fill="#1a1a18"/>
      <text x="-30" y="0" text-anchor="middle" dominant-baseline="central"
            font-size="14" font-family="monospace" font-weight="bold" fill="#1a1a18">X</text>
      <text x="30"  y="0" text-anchor="middle" dominant-baseline="central"
            font-size="14" font-family="monospace" font-weight="bold" fill="#1a1a18">X</text>
    `,
  },

  {
    id: 'korridor',
    label: 'Klocka i korridor',
    w: 1.5, h: 5,
    entry: { x: 0, y: -2.5 },
    exit:  { x: 0, y:  2.5 },
    viewBox: '-24 -60 48 120',
    svg: `
      <circle cx="-14" cy="-40" r="6" fill="#1a1a18"/>
      <circle cx="14"  cy="-40" r="6" fill="#1a1a18"/>
      <circle cx="-14" cy="0"   r="6" fill="#1a1a18"/>
      <circle cx="14"  cy="0"   r="6" fill="#1a1a18"/>
      <circle cx="-14" cy="40"  r="6" fill="#1a1a18"/>
      <circle cx="14"  cy="40"  r="6" fill="#1a1a18"/>
      <text x="0" y="40" text-anchor="middle" dominant-baseline="central"
            font-size="12" font-family="monospace" font-weight="bold" fill="#1a1a18">X</text>
    `,
  },

  // ─── BARRIÄRER ───────────────────────────────────────────────────────────

  {
    id: 'grind',
    label: 'Grind',
    w: 3.5, h: 0.3,
    entry: { x: 0, y: -1 },
    exit:  { x: 0, y:  1 },
    viewBox: '-44 -12 88 24',
    svg: `
      <rect x="-40" y="-5" width="72" height="10" rx="2" fill="#1a1a18"/>
      <circle cx="-40" cy="0" r="9" fill="#1a1a18"/>
      <circle cx="32"  cy="0" r="9" fill="white" stroke="#1a1a18" stroke-width="2.5"/>
    `,
  },

  {
    id: 'sidvarts',
    label: 'Sidvärts med bom',
    w: 4, h: 0.3,
    entry: { x: 0, y: -1 },
    exit:  { x: 0, y:  1 },
    viewBox: '-50 -10 100 20',
    svg: `
      <rect x="-44" y="-5" width="88" height="10" rx="2" fill="#1a1a18"/>
      <line x1="-44" y1="-5" x2="-44" y2="5" stroke="white" stroke-width="3" stroke-dasharray="3 2"/>
      <line x1="44"  y1="-5" x2="44"  y2="5" stroke="white" stroke-width="3" stroke-dasharray="3 2"/>
    `,
  },

  {
    id: 'lydnad',
    label: 'Lydnadshinder',
    w: 4, h: 0.4,
    entry: { x: 0, y: -1 },
    exit:  { x: 0, y:  1 },
    viewBox: '-50 -12 100 24',
    svg: `
      <rect x="-44" y="-6" width="88" height="12" rx="2" fill="none" stroke="#1a1a18" stroke-width="2.5"/>
      <line x1="-28" y1="-6" x2="-28" y2="6" stroke="#1a1a18" stroke-width="1.5"/>
      <line x1="-12" y1="-6" x2="-12" y2="6" stroke="#1a1a18" stroke-width="1.5"/>
      <line x1="4"   y1="-6" x2="4"   y2="6" stroke="#1a1a18" stroke-width="1.5"/>
      <line x1="20"  y1="-6" x2="20"  y2="6" stroke="#1a1a18" stroke-width="1.5"/>
      <line x1="36"  y1="-6" x2="36"  y2="6" stroke="#1a1a18" stroke-width="1.5"/>
    `,
  },

  // ─── STRUKTURER ──────────────────────────────────────────────────────────

  {
    id: 'trabro',
    label: 'Träbro',
    w: 4, h: 1.5,
    entry: { x: -2, y: 0 },
    exit:  { x:  2, y: 0 },
    viewBox: '-50 -20 100 40',
    svg: `
      <rect x="-44" y="-14" width="88" height="28" rx="2" fill="none" stroke="#1a1a18" stroke-width="2.5"/>
      <line x1="-30" y1="-14" x2="-16" y2="14" stroke="#1a1a18" stroke-width="1" stroke-dasharray="3 2"/>
      <line x1="-14" y1="-14" x2="0"   y2="14" stroke="#1a1a18" stroke-width="1" stroke-dasharray="3 2"/>
      <line x1="2"   y1="-14" x2="16"  y2="14" stroke="#1a1a18" stroke-width="1" stroke-dasharray="3 2"/>
      <line x1="18"  y1="-14" x2="32"  y2="14" stroke="#1a1a18" stroke-width="1" stroke-dasharray="3 2"/>
      <polygon points="-44,-14 -36,-22 -36,-14" fill="#1a1a18"/>
      <polygon points="44,-14 36,-22 36,-14"    fill="#1a1a18"/>
    `,
  },

  {
    id: 'vatten',
    label: 'Vattenhinder',
    w: 5, h: 3,
    entry: { x: -2.5, y: 0 },
    exit:  { x:  2.5, y: 0 },
    viewBox: '-55 -35 110 70',
    svg: `
      <rect x="-50" y="-30" width="100" height="60" rx="3" fill="none" stroke="#1a1a18" stroke-width="2.5"/>
      <line x1="-38" y1="-14" x2="-18" y2="-14" stroke="#1a1a18" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="-14" y1="-14" x2="6"   y2="-14" stroke="#1a1a18" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="10"  y1="-14" x2="38"  y2="-14" stroke="#1a1a18" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="-44" y1="0"   x2="-24" y2="0"   stroke="#1a1a18" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="-20" y1="0"   x2="0"   y2="0"   stroke="#1a1a18" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="4"   y1="0"   x2="44"  y2="0"   stroke="#1a1a18" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="-38" y1="14"  x2="-10" y2="14"  stroke="#1a1a18" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="-6"  y1="14"  x2="20"  y2="14"  stroke="#1a1a18" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="24"  y1="14"  x2="38"  y2="14"  stroke="#1a1a18" stroke-width="1.5" stroke-linecap="round"/>
    `,
  },

  {
    id: 'falla',
    label: 'Fålla',
    w: 8, h: 8,
    entry: { x: 0, y: -4 },
    exit:  { x: 0, y:  4 },
    viewBox: '-90 -90 180 180',
    svg: `
      <circle cx="0" cy="0" r="76" fill="none" stroke="#1a1a18" stroke-width="2.5"
              stroke-dasharray="270 30" stroke-dashoffset="-15"/>
      <circle cx="0" cy="0" r="40" fill="none" stroke="#1a1a18" stroke-width="1.5"/>
      <circle cx="0" cy="0" r="6"  fill="#1a1a18"/>
    `,
  },

  {
    id: 'bord',
    label: 'Bord',
    w: 1, h: 1,
    entry: { x: 0, y: -0.8 },
    exit:  { x: 0, y:  0.8 },
    viewBox: '-20 -32 40 52',
    svg: `
      <rect x="-18" y="-2" width="36" height="18" rx="2" fill="none" stroke="#1a1a18" stroke-width="2"/>
      <rect x="-8"  y="-18" width="16" height="18" rx="2" fill="none" stroke="#1a1a18" stroke-width="1.5"/>
      <circle cx="0" cy="-22" r="5" fill="none" stroke="#1a1a18" stroke-width="1.5"/>
    `,
  },

  {
    id: 'hopp',
    label: 'Hopp / Bank',
    w: 4, h: 0.4,
    entry: { x: 0, y: -1 },
    exit:  { x: 0, y:  1 },
    viewBox: '-50 -12 100 24',
    svg: `
      <rect x="-44" y="-7" width="88" height="14" rx="2" fill="none" stroke="#1a1a18" stroke-width="2.5"/>
      <line x1="-44" y1="0" x2="44" y2="0" stroke="#1a1a18" stroke-width="1"/>
    `,
  },

  // ─── LANS & RING ─────────────────────────────────────────────────────────

  {
    id: 'ring',
    label: 'Ring',
    w: 0.5, h: 1.5,
    entry: { x: 0, y:  0.8 },
    exit:  { x: 0, y:  0.8 },
    viewBox: '-16 -36 32 56',
    svg: `
      <line x1="0" y1="16" x2="0" y2="-28" stroke="#1a1a18" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="0" cy="-22" rx="12" ry="5" fill="none" stroke="#1a1a18" stroke-width="2.5"/>
    `,
  },

];

// ─── COMPLIANCE RULES ────────────────────────────────────────────────────────
// Intra-group spacing rules keyed by groupId prefix (preset type)
export const GROUP_RULES: Record<string, GroupRule> = {
  'tva-tunnor': {
    minDist: 3,
    maxDist: 4,
    message: (d) => `avstånd ${d.toFixed(1)} m — ska vara 3–4 m`,
  },
  'tre-tunnor': {
    minDist: 3,
    maxDist: 4,
    message: (d) => `avstånd ${d.toFixed(1)} m — ska vara 3–4 m`,
  },
  'parallellslalom': {
    minDist: 3,
    maxDist: 9,
    message: (d) => `pinnavstånd ${d.toFixed(1)} m — ska vara 3–9 m`,
  },
};

export const MIN_OBSTACLE_SPACING = 6; // metres, centre-to-centre between different groups

// ─── PRESETS ─────────────────────────────────────────────────────────────────
// Drop logic for multi-piece presets.
// Returns an array of PlacedObstacle fragments (without id/groupId — caller adds those).
export function expandPreset(
  type: string,
  cx: number,
  cy: number,
): Array<Omit<PlacedObstacle, 'id' | 'groupId'>> | null {
  const def = OBSTACLES.find((o) => o.id === type);
  if (!def?.presetPieces) return null;
  return def.presetPieces.map((piece) => {
    const pieceDef = OBSTACLES.find((o) => o.id === piece.type);
    return {
      type: piece.type,
      x: cx + piece.dx - (pieceDef?.w ?? 1) / 2,
      y: cy + piece.dy - (pieceDef?.h ?? 1) / 2,
      w: pieceDef?.w ?? 1,
      h: pieceDef?.h ?? 1,
      rotation: 0,
      note: '',
    };
  });
}

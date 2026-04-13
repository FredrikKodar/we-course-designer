import type { ObstacleDef } from "../types";

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
    w: 3.8, h: 0.8,
    entry: { x: 0, y: 0 },
    exit:  { x: 0, y: 0 },
    viewBox: '-38 -8 76 16',
    svg: `
      <circle cx="-30" cy="0" r="8" fill="#1a1a18"/>
      <circle cx="30"  cy="0" r="8" fill="#1a1a18"/>
    `,
    },

  {
    id: 'tre-tunnor',
    label: 'Tre tunnor',
    w: 3.8, h: 3.4,
    entry: { x: 0, y: 1.3 },
    exit: { x: 0, y: 1.3 },
    viewBox: '-38 -43 76 68',
    svg: `
      <circle cx="0"   cy="-35" r="8" fill="#1a1a18"/>
      <circle cx="-30" cy="17"  r="8" fill="#1a1a18"/>
      <circle cx="30"  cy="17"  r="8" fill="#1a1a18"/>
    `,
    },

  {
    id: 'lans-ur-tunna',
    label: 'Lans ur tunna',
    variantGroup: 'Lans och ring',
    variantLabel: 'Lans ur tunna',
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

  {
    id: 'lans-i-tunna',
    label: 'Lans i tunna',
    variantGroup: 'Lans och ring',
    variantLabel: 'Lans i tunna',
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
    variantGroup: 'Enkelslalom',
    variantLabel: '5 st, 6m',
    defaultRotation: 90,
    w: 26, h: 1,
    entry: { x: -13, y: 0 },
    exit:  { x: 13, y: 0 },
    viewBox: '-260 -10 520 20',
    svg: `
      <circle cx="-240" cy="0" r="3" fill="#1a1a18"/>
      <circle cx="-120" cy="0" r="3" fill="#1a1a18"/>
      <circle cx="0"   cy="0" r="3" fill="#1a1a18"/>
      <circle cx="120"  cy="0" r="3" fill="#1a1a18"/>
      <circle cx="240"  cy="0" r="3" fill="#1a1a18"/>
    `,
  },

  {
    id: 'enkelslalom-7m',
    label: 'Enkelslalom',
    variantGroup: 'Enkelslalom',
    variantLabel: '5 st, 7m',
    defaultRotation: 90,
    w: 30, h: 1,
    entry: { x: -15, y: 0 },
    exit:  { x: 15, y: 0 },
    viewBox: '-300 -10 600 20',
    svg: `
      <circle cx="-280" cy="0" r="3" fill="#1a1a18"/>
      <circle cx="-140" cy="0" r="3" fill="#1a1a18"/>
      <circle cx="0"    cy="0" r="3" fill="#1a1a18"/>
      <circle cx="140"  cy="0" r="3" fill="#1a1a18"/>
      <circle cx="280"  cy="0" r="3" fill="#1a1a18"/>
    `,
  },

  {
    id: 'enkelslalom-8m',
    label: 'Enkelslalom',
    variantGroup: 'Enkelslalom',
    variantLabel: '5 st, 8m',
    defaultRotation: 90,
    w: 34, h: 1,
    entry: { x: -17, y: 0 },
    exit:  { x: 17, y: 0 },
    viewBox: '-340 -10 680 20',
    svg: `
      <circle cx="-320" cy="0" r="3" fill="#1a1a18"/>
      <circle cx="-160" cy="0" r="3" fill="#1a1a18"/>
      <circle cx="0"    cy="0" r="3" fill="#1a1a18"/>
      <circle cx="160"  cy="0" r="3" fill="#1a1a18"/>
      <circle cx="320"  cy="0" r="3" fill="#1a1a18"/>
    `,
  },

  {
    id: 'parallellslalom',
    label: 'Parallellslalom',
    variantGroup: 'Parallellslalom',
    variantLabel: '4+3, 6m',
    defaultRotation: 90,
    w: 21, h: 10,
    entry: { x: -10.5, y: -4.5 },
    exit: { x: 10.5, y: -4.5 },
    viewBox: '-210 -100 420 200',
    svg: `
      <circle cx="-180" cy="-60" r="3" fill="#1a1a18"/>
      <circle cx="-60"  cy="-60" r="3" fill="#1a1a18"/>
      <circle cx="60"   cy="-60" r="3" fill="#1a1a18"/>
      <circle cx="180"  cy="-60" r="3" fill="#1a1a18"/>
      <circle cx="-120" cy="60"  r="3" fill="#1a1a18"/>
      <circle cx="0"    cy="60"  r="3" fill="#1a1a18"/>
      <circle cx="120"  cy="60"  r="3" fill="#1a1a18"/>
      <path d="M -200,-90 L -180,-90
      C -180,-90 -145,-90 -150,-60 L -150,60
      C -150,90 -95,100 -90,60 L -90,-60
      C -90,-90 -35,-100 -30,-60 L -30,60
      C -30,90 25,100 30,60 L 30,-60
      C 30,-90 85,-100 90,-60 L 90,60
      C 90,90 145,100 150,60 L 150,-60
      C 150,-90 170,-90 180,-90  L 200,-90"
            fill="none" stroke="#1a1a18" stroke-width="1" stroke-dasharray="8 6" stroke-linecap="round"/>
    `,
  },

  {
    id: 'parallellslalom-4x3-7m',
    label: 'Parallellslalom',
    variantGroup: 'Parallellslalom',
    variantLabel: '4+3, 7m',
    defaultRotation: 90,
    w: 24, h: 11,
    entry: { x: -12, y: -5 },
    exit:  { x: 12, y: -5 },
    viewBox: '-240 -110 480 220',
    svg: `
      <circle cx="-210" cy="-70" r="3" fill="#1a1a18"/>
      <circle cx="-70"  cy="-70" r="3" fill="#1a1a18"/>
      <circle cx="70"   cy="-70" r="3" fill="#1a1a18"/>
      <circle cx="210"  cy="-70" r="3" fill="#1a1a18"/>
      <circle cx="-140" cy="70"  r="3" fill="#1a1a18"/>
      <circle cx="0"    cy="70"  r="3" fill="#1a1a18"/>
      <circle cx="140"  cy="70"  r="3" fill="#1a1a18"/>
      <path d="M -233,-105 L -210,-105
      C -210,-105 -169,-105 -175,-70 L -175,70
      C -175,105 -111,117 -105,70 L -105,-70
      C -105,-105 -41,-117 -35,-70 L -35,70
      C -35,105 29,117 35,70 L 35,-70
      C 35,-105 99,-117 105,-70 L 105,70
      C 105,105 169,117 175,70 L 175,-70
      C 175,-105 198,-105 210,-105 L 233,-105"
            fill="none" stroke="#1a1a18" stroke-width="1" stroke-dasharray="8 6" stroke-linecap="round"/>
    `,
  },

  {
    id: 'parallellslalom-4x3-8m',
    label: 'Parallellslalom',
    variantGroup: 'Parallellslalom',
    variantLabel: '4+3, 8m',
    defaultRotation: 90,
    w: 27, h: 12,
    entry: { x: -13.5, y: -5.5 },
    exit:  { x: 13.5, y: -5.5 },
    viewBox: '-270 -120 540 240',
    svg: `
      <circle cx="-240" cy="-80" r="3" fill="#1a1a18"/>
      <circle cx="-80"  cy="-80" r="3" fill="#1a1a18"/>
      <circle cx="80"   cy="-80" r="3" fill="#1a1a18"/>
      <circle cx="240"  cy="-80" r="3" fill="#1a1a18"/>
      <circle cx="-160" cy="80"  r="3" fill="#1a1a18"/>
      <circle cx="0"    cy="80"  r="3" fill="#1a1a18"/>
      <circle cx="160"  cy="80"  r="3" fill="#1a1a18"/>
      <path d="M -267,-120 L -240,-120
      C -240,-120 -193,-120 -200,-80 L -200,80
      C -200,120 -127,133 -120,80 L -120,-80
      C -120,-120 -47,-133 -40,-80 L -40,80
      C -40,120 33,133 40,80 L 40,-80
      C 40,-120 113,-133 120,-80 L 120,80
      C 120,120 193,133 200,80 L 200,-80
      C 200,-120 227,-120 240,-120 L 267,-120"
            fill="none" stroke="#1a1a18" stroke-width="1" stroke-dasharray="8 6" stroke-linecap="round"/>
    `,
  },

  {
    id: 'parallellslalom-3x2-6m',
    label: 'Parallellslalom',
    variantGroup: 'Parallellslalom',
    variantLabel: '3+2, 6m',
    defaultRotation: 90,
    w: 14, h: 10,
    entry: { x: -7, y: -4.5 },
    exit:  { x: 7, y: -4.5 },
    viewBox: '-140 -100 280 200',
    svg: `
      <circle cx="-120" cy="-60" r="3" fill="#1a1a18"/>
      <circle cx="0"    cy="-60" r="3" fill="#1a1a18"/>
      <circle cx="120"  cy="-60" r="3" fill="#1a1a18"/>
      <circle cx="-60"  cy="60"  r="3" fill="#1a1a18"/>
      <circle cx="60"   cy="60"  r="3" fill="#1a1a18"/>
      <path d="M -140,-90 L -120,-90
      C -120,-90 -85,-90 -90,-60 L -90,60
      C -90,90 -35,100 -30,60 L -30,-60
      C -30,-90 25,-100 30,-60 L 30,60
      C 30,90 85,100 90,60 L 90,-60
      C 90,-90 110,-90 120,-90 L 140,-90"
            fill="none" stroke="#1a1a18" stroke-width="1" stroke-dasharray="8 6" stroke-linecap="round"/>
    `,
  },

  {
    id: 'parallellslalom-3x2-7m',
    label: 'Parallellslalom',
    variantGroup: 'Parallellslalom',
    variantLabel: '3+2, 7m',
    defaultRotation: 90,
    w: 16, h: 11,
    entry: { x: -8, y: -5 },
    exit:  { x: 8, y: -5 },
    viewBox: '-160 -110 320 220',
    svg: `
      <circle cx="-140" cy="-70" r="3" fill="#1a1a18"/>
      <circle cx="0"    cy="-70" r="3" fill="#1a1a18"/>
      <circle cx="140"  cy="-70" r="3" fill="#1a1a18"/>
      <circle cx="-70"  cy="70"  r="3" fill="#1a1a18"/>
      <circle cx="70"   cy="70"  r="3" fill="#1a1a18"/>
      <path d="M -163,-105 L -140,-105
      C -140,-105 -99,-105 -105,-70 L -105,70
      C -105,105 -41,117 -35,70 L -35,-70
      C -35,-105 29,-117 35,-70 L 35,70
      C 35,105 99,117 105,70 L 105,-70
      C 105,-105 128,-105 140,-105 L 163,-105"
            fill="none" stroke="#1a1a18" stroke-width="1" stroke-dasharray="8 6" stroke-linecap="round"/>
    `,
  },

  {
    id: 'parallellslalom-3x2-8m',
    label: 'Parallellslalom',
    variantGroup: 'Parallellslalom',
    variantLabel: '3+2, 8m',
    defaultRotation: 90,
    w: 18, h: 12,
    entry: { x: -9, y: -5.5 },
    exit:  { x: 9, y: -5.5 },
    viewBox: '-180 -120 360 240',
    svg: `
      <circle cx="-160" cy="-80" r="3" fill="#1a1a18"/>
      <circle cx="0"    cy="-80" r="3" fill="#1a1a18"/>
      <circle cx="160"  cy="-80" r="3" fill="#1a1a18"/>
      <circle cx="-80"  cy="80"  r="3" fill="#1a1a18"/>
      <circle cx="80"   cy="80"  r="3" fill="#1a1a18"/>
      <path d="M -187,-120 L -160,-120
      C -160,-120 -113,-120 -120,-80 L -120,80
      C -120,120 -47,133 -40,80 L -40,-80
      C -40,-120 33,-133 40,-80 L 40,80
      C 40,120 113,133 120,80 L 120,-80
      C 120,-120 147,-120 160,-120 L 187,-120"
            fill="none" stroke="#1a1a18" stroke-width="1" stroke-dasharray="8 6" stroke-linecap="round"/>
    `,
  },

  {
    id: 'ryggning',
    label: 'Ryggning i mönster',
    w: 8, h: 2,
    entry: { x: -4, y: 0 },
    exit: { x: -4, y: 0 },
    viewBox: '-80 -20 160 40',
    svg: `
      <circle cx="-60" cy="-15" r="3" fill="#1a1a18"/>
      <circle cx="0"   cy="-15" r="3" fill="#1a1a18"/>
      <circle cx="60"  cy="-15" r="3" fill="#1a1a18"/>
      <circle cx="-60" cy="15"  r="3" fill="#1a1a18"/>
      <circle cx="0"   cy="15"  r="3" fill="#1a1a18"/>
      <circle cx="60"  cy="15"  r="3" fill="#1a1a18"/>
    `,
  },

  {
    id: 'korridor',
    label: 'Klocka i korridor',
    w: 2, h: 5,
    entry: { x: 0, y: -2.5 },
    exit: { x: 0, y: -2.5 },
    viewBox: '-24 -60 48 120',
    svg: `
      <rect x='-18' y="-48" width="3" height="96" rx="2" fill="#1a1a18"/>
      <rect x='18' y="-48" width="3" height="96" rx="2" fill="#1a1a18"/>
    `,
  },

  // ─── BARRIÄRER ───────────────────────────────────────────────────────────

  {
    id: 'grind',
    label: 'Grind',
    w: 3, h: 0.5,
    entry: { x: 0, y: -1 },
    exit:  { x: 0, y:  1 },
    viewBox: '-60 -10 120 20',
    svg: `
      <rect x="-40" y="-5" width="72" height="10" rx="2" fill="#1a1a18"/>
      <circle cx="-40" cy="0" r="8" fill="#1a1a18"/>
      <circle cx="40"  cy="0" r="8" fill="white" stroke="#1a1a18" stroke-width="2.5"/>
    `,
  },

  {
    id: 'sidvarts',
    label: 'Sidvärts med bom',
    w: 4, h: 0.5,
    entry: { x: -2, y: 0 },
    exit:  { x: 2, y:  0 },
    viewBox: '-50 -12.5 100 25',
    svg: `
      <rect x="-50" y="-5" width="100" height="10" rx="2" fill="#1a1a18"/>
      <line x1="-44" y1="-5" x2="-44" y2="5" stroke="white" stroke-width="5" stroke-dasharray="3 2"/>
      <line x1="44"  y1="-5" x2="44"  y2="5" stroke="white" stroke-width="5" stroke-dasharray="3 2"/>
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

  {
    id: 'flytta-mugg',
    label: 'Flytta mugg',
    w: 2, h: 0.5,
    entry: { x: 0, y: -0.5 },
    exit:  { x: 0, y:  0.5 },
    viewBox: '-60 -10 120 20',
    svg: `
      <circle cx="-40" cy="0" r="8" fill="#1a1a18"/>
      <circle cx="40"  cy="0" r="8" fill="#1a1a18"/>
    `,
  },

  // ─── STRUKTURER ──────────────────────────────────────────────────────────

  {
    id: 'trabro',
    label: 'Träbro',
    w: 5, h: 2,
    entry: { x: -2, y: 0 },
    exit:  { x:  2, y: 0 },
    viewBox: '-50 -20 100 40',
    svg: `
      <rect x="-40" y="-14" width="80" height="28" rx="2" fill="none" stroke="#1a1a18" stroke-width="2.5"/>
      <line x1="-30" y1="-14" x2="-16" y2="14" stroke="#1a1a18" stroke-width="1" stroke-dasharray="3 2"/>
      <line x1="-14" y1="-14" x2="0"   y2="14" stroke="#1a1a18" stroke-width="1" stroke-dasharray="3 2"/>
      <line x1="2"   y1="-14" x2="16"  y2="14" stroke="#1a1a18" stroke-width="1" stroke-dasharray="3 2"/>
      <line x1="18"  y1="-14" x2="32"  y2="14" stroke="#1a1a18" stroke-width="1" stroke-dasharray="3 2"/>
      <polygon points="-40,-14 -32,-22 -32,-14" fill="#1a1a18"/>
      <polygon points="40,-14 32,-22 32,-14"    fill="#1a1a18"/>
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
    id: 'falla-6m',
    label: 'Fålla',
    variantGroup: 'Fålla',
    variantLabel: '6m',
    w: 7, h: 7,
    entry: { x: 0, y: -3 },
    exit:  { x: 0, y: -3 },
    viewBox: '-70 -70 140 140',
    svg: `
      <circle cx="0" cy="0" r="60" fill="none" stroke="#1a1a18" stroke-width="2.5"
              stroke-dasharray="248 68"/>
      <circle cx="0" cy="0" r="38" fill="none" stroke="#1a1a18" stroke-width="1.5"/>
    `,
  },

  {
    id: 'falla',
    label: 'Fålla',
    variantGroup: 'Fålla',
    variantLabel: '8m',
    w: 9, h: 9,
    entry: { x: 0, y: -4 },
    exit:  { x: 0, y: -4 },
    viewBox: '-90 -90 180 180',
    svg: `
      <circle cx="0" cy="0" r="80" fill="none" stroke="#1a1a18" stroke-width="2.5"
              stroke-dasharray="330 90"/>
      <circle cx="0" cy="0" r="50" fill="none" stroke="#1a1a18" stroke-width="1.5"/>
    `,
  },

  {
    id: 'falla-10m',
    label: 'Fålla',
    variantGroup: 'Fålla',
    variantLabel: '10m',
    w: 11, h: 11,
    entry: { x: 0, y: -5 },
    exit:  { x: 0, y: -5 },
    viewBox: '-110 -110 220 220',
    svg: `
      <circle cx="0" cy="0" r="100" fill="none" stroke="#1a1a18" stroke-width="2.5"
              stroke-dasharray="413 113"/>
      <circle cx="0" cy="0" r="63" fill="none" stroke="#1a1a18" stroke-width="1.5"/>
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
    variantGroup: 'Lans och ring',
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

export const MIN_OBSTACLE_SPACING = 6; // metres, centre-to-centre

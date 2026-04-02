import type { PlacedObstacle } from '../types';
import type { ViewMode } from '../types';
import { OBSTACLES } from '../data/obstacles';
import useStore from '../store/useStore';

const CANVAS_MARGIN = 60; // matches Canvas.tsx MARGIN constant
// Extra padding around the arena in the snapshot so grid labels are included.
// Labels sit ~28px to the left and ~15px below the arena border.
const SNAPSHOT_PADDING = 38;

function arenaScreenBounds(
  stageW: number,
  stageH: number,
  arenaW: number,
  arenaH: number,
  viewMode: ViewMode,
  panX: number,
  panY: number,
  zoom: number,
): { x: number; y: number; width: number; height: number } {
  const effectiveW = viewMode === 'side' ? arenaW : arenaH;
  const effectiveH = viewMode === 'side' ? arenaH : arenaW;
  const baseScale = Math.min(
    (stageW - CANVAS_MARGIN) / effectiveW,
    (stageH - CANVAS_MARGIN) / effectiveH,
  );
  const scale = baseScale * zoom;
  return {
    x: panX - SNAPSHOT_PADDING,
    y: panY - SNAPSHOT_PADDING,
    width: effectiveW * scale + 2 * SNAPSHOT_PADDING,
    height: effectiveH * scale + 2 * SNAPSHOT_PADDING,
  };
}

function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

function buildObstacleRows(placed: PlacedObstacle[]): string {
  const numbered = placed
    .filter((p) => !!p.sequenceNum)
    .sort((a, b) => naturalCompare(a.sequenceNum, b.sequenceNum));
  const unnumbered = placed.filter((p) => !p.sequenceNum);
  const sorted = [...numbered, ...unnumbered];

  return sorted
    .map((p) => {
      const def = OBSTACLES.find((o) => o.id === p.type);
      const label = def?.label ?? p.type;
      const num = p.sequenceNum ? `${p.sequenceNum}.` : '–';
      const note = p.note ? ` ${p.note}` : '';
      return `<div style="margin-bottom:4px;font-size:10px;line-height:1.4;">${num} <strong>${label}</strong>${note}</div>`;
    })
    .join('');
}

function buildPrintHtml(dataUrl: string, obstacleRows: string, arenaW: number, arenaH: number): string {
  return `<!DOCTYPE html>
<html lang="sv">
<head>
<meta charset="utf-8">
<title>WE Course Sheet</title>
<style>
  @page { size: A4 portrait; margin: 10mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    display: block;
    width: 190mm;
    font-family: Arial, sans-serif;
    font-size: 11px;
    color: #111;
  }
  .top {
    display: flex;
    gap: 12mm;
    padding-bottom: 4mm;
    margin-bottom: 4mm;
    border-bottom: 1px solid #ccc;
  }
  .header-block {
    flex-shrink: 0;
    font-size: 10px;
    line-height: 1.8;
  }
  .header-block strong {
    font-size: 12px;
    display: block;
    margin-bottom: 2px;
  }
  .obstacle-list { flex: 1; }
  .obstacle-list h3 {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #555;
    margin-bottom: 4px;
    border-bottom: 1px solid #eee;
    padding-bottom: 2px;
  }
  .map {
    display: block;
    width: 190mm;
    height: auto;
  }
  .footer {
    font-size: 9px;
    color: #666;
    margin-top: 3mm;
  }
</style>
</head>
<body>
  <div class="top">
    <div class="header-block">
      <strong>Tävlingsplats</strong>
      Klass<br>
      Datum<br>
      Domare
    </div>
    <div class="obstacle-list">
      <h3>Hinder</h3>
      ${obstacleRows}
    </div>
  </div>
  <img class="map" src="${dataUrl}" alt="Course map">
  <div class="footer">${arenaW} × ${arenaH} m</div>
</body>
</html>`;
}

export function printCourse(): void {
  const { stageRef, placed, arenaW, arenaH, panX, panY, zoom, viewMode } = useStore.getState();
  if (!stageRef) {
    console.warn('printCourse: stageRef not set');
    return;
  }

  // Capture the arena rectangle exactly, regardless of current pan/zoom
  const bounds = arenaScreenBounds(
    stageRef.width(),
    stageRef.height(),
    arenaW,
    arenaH,
    viewMode,
    panX,
    panY,
    zoom,
  );
  const dataUrl = stageRef.toDataURL({ pixelRatio: 3, ...bounds });
  const obstacleRows = buildObstacleRows(placed);
  const html = buildPrintHtml(dataUrl, obstacleRows, arenaW, arenaH);

  const w = window.open('', '_blank');
  if (!w) {
    alert('Pop-up blocked. Please allow pop-ups for this site and try again.');
    return;
  }
  w.document.write(html);
  w.document.close();
}

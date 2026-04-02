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

function buildObstacleRows(placed: PlacedObstacle[]): string {
  const { visits } = useStore.getState();
  const rows: string[] = [];

  for (const p of placed) {
    const def = OBSTACLES.find((o) => o.id === p.type);
    const label = def?.label ?? p.type;
    const note = p.note ? ` ${p.note}` : '';
    const obstacleVisits = visits
      .filter((v) => v.obstacleId === p.id)
      .sort((a, b) => a.num.localeCompare(b.num, undefined, { numeric: true, sensitivity: 'base' }));

    if (obstacleVisits.length === 0) {
      rows.push(`<div style="margin-bottom:4px;font-size:10px;line-height:1.4;">– <strong>${label}</strong>${note}</div>`);
    } else {
      for (const v of obstacleVisits) {
        rows.push(`<div style="margin-bottom:4px;font-size:10px;line-height:1.4;"><strong>${v.num}.</strong> <strong>${label}</strong>${note}</div>`);
      }
    }
  }

  return rows.join('');
}

function buildPrintHtml(dataUrl: string, obstacleRows: string): string {
  return `<!DOCTYPE html>
<html lang="sv">
<head>
<meta charset="utf-8">
<title>WE Course Sheet</title>
<style>
  @page { size: A4 portrait; margin: 10mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    display: flex;
    width: 190mm;
    height: 277mm;
    font-family: Arial, sans-serif;
    font-size: 11px;
    color: #111;
    gap: 6mm;
  }
  .left {
    width: 52mm;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .right {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: flex-start;
  }
  .map {
    width: 100%;
    height: auto;
  }
  .header-block {
    font-size: 10px;
    line-height: 1.8;
    border-bottom: 1px solid #ccc;
    padding-bottom: 6px;
  }
  .header-block strong {
    font-size: 12px;
    display: block;
    margin-bottom: 2px;
  }
  .obstacle-list { flex: 1; overflow: hidden; }
  .obstacle-list h3 {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #555;
    margin-bottom: 4px;
    border-bottom: 1px solid #eee;
    padding-bottom: 2px;
  }
</style>
</head>
<body>
  <div class="left">
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
  <div class="right">
    <img class="map" src="${dataUrl}" alt="Course map">
  </div>
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
  const html = buildPrintHtml(dataUrl, obstacleRows);

  const w = window.open('', '_blank');
  if (!w) {
    alert('Pop-up blocked. Please allow pop-ups for this site and try again.');
    return;
  }
  w.document.write(html);
  w.document.close();
}

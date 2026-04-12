import type { PlacedObstacle, Visit, WEClass, Discipline } from '../types';
import type { ViewMode } from '../types';
import { OBSTACLES } from '../data/obstacles';
import useStore from '../store/useStore';

const CANVAS_MARGIN = 60;
const SNAPSHOT_PADDING = 38;

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

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

function sortedVisitRows(
  placed: PlacedObstacle[],
  visits: Visit[],
): Array<{ visit: Visit; label: string; obstacleId: string }> {
  return [...visits]
    .sort((a, b) => a.num.localeCompare(b.num, undefined, { numeric: true, sensitivity: 'base' }))
    .map((v) => {
      const p = placed.find((pl) => pl.id === v.obstacleId);
      const def = p ? OBSTACLES.find((o) => o.id === p.type) : null;
      return { visit: v, label: def?.label ?? p?.type ?? '?', obstacleId: v.obstacleId };
    });
}

function buildFallbackRows(placed: PlacedObstacle[], visits: Visit[]): string {
  const rows: string[] = [];
  for (const p of placed) {
    const def = OBSTACLES.find((o) => o.id === p.type);
    const label = def?.label ?? p.type;
    const obstacleVisits = visits
      .filter((v) => v.obstacleId === p.id)
      .sort((a, b) => a.num.localeCompare(b.num, undefined, { numeric: true, sensitivity: 'base' }));

    if (obstacleVisits.length === 0) {
      rows.push(`<div style="margin-bottom:4px;font-size:10px;line-height:1.4;">– <strong>${esc(label)}</strong></div>`);
    } else {
      for (const v of obstacleVisits) {
        rows.push(`<div style="margin-bottom:4px;font-size:10px;line-height:1.4;"><strong>${esc(v.num)}.</strong> <strong>${esc(label)}</strong></div>`);
      }
    }
  }
  return rows.join('');
}

function buildDisciplineSection(
  title: string,
  cls: WEClass,
  discipline: Discipline,
  placed: PlacedObstacle[],
  visits: Visit[],
): string {
  const rows = sortedVisitRows(placed, visits);
  const items = rows
    .map(({ visit, label, obstacleId }) => {
      const entry = cls[discipline][obstacleId];
      const inUse = entry?.inUse ?? true;
      const note = entry?.note ?? '';
      const noteHtml = inUse
        ? note ? `<span style="color:#333;"> ${esc(note)}</span>` : ''
        : `<span style="color:#aaa;font-style:italic;"> INGÅR EJ</span>`;
      return `<div style="margin-bottom:3px;font-size:10px;line-height:1.4;"><strong>${esc(visit.num)}.</strong> <strong>${esc(label)}</strong>${noteHtml}</div>`;
    })
    .join('');

  return `
    <div style="margin-bottom:10px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#555;margin-bottom:4px;padding-bottom:2px;border-bottom:1px solid #eee;">
        ${esc(title)}
      </div>
      ${items || '<div style="font-size:10px;color:#aaa;">Inga hinder i sekvensen.</div>'}
    </div>
  `;
}

function buildPrintHtml(dataUrl: string, leftContent: string): string {
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
  .map { max-width: 100%; max-height: 277mm; width: auto; height: auto; }
  .header-block {
    font-size: 10px;
    line-height: 1.8;
    border-bottom: 1px solid #ccc;
    padding-bottom: 6px;
  }
  .header-block strong { font-size: 12px; display: block; margin-bottom: 2px; }
  .obstacle-list { flex: 1; overflow: hidden; }
</style>
</head>
<body>
  <div class="left">
    ${leftContent}
  </div>
  <div class="right">
    <img class="map" src="${dataUrl}" alt="Course map">
  </div>
</body>
</html>`;
}

export function printCourse(classId?: string): void {
  const { stageRef, placed: allPlaced, arenaW, arenaH, panX, panY, zoom, viewMode, visits, classes, eventMeta } =
    useStore.getState();
  const placed = allPlaced.filter((p): p is PlacedObstacle => p.kind === 'obstacle');
  if (!stageRef) {
    console.warn('printCourse: stageRef not set');
    return;
  }

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

  const cls = classId ? classes.find((c) => c.id === classId) : undefined;

  let leftContent: string;

  if (cls) {
    const header = `
      <div class="header-block">
        <strong>${esc(cls.name)}</strong>
        Tävlingsplats: ${esc(eventMeta.venue) || '—'}<br>
        Datum: ${esc(eventMeta.date) || '—'}<br>
        ${eventMeta.judge ? `Domare: ${esc(eventMeta.judge)}<br>` : ''}
        ${eventMeta.courseBuilder ? `Banbyggare: ${esc(eventMeta.courseBuilder)}` : ''}
      </div>`;
    const teknikSection = buildDisciplineSection('Teknik', cls, 'teknik', placed, visits);
    const speedSection = buildDisciplineSection('Speed', cls, 'speed', placed, visits);
    leftContent = `${header}<div class="obstacle-list">${teknikSection}${speedSection}</div>`;
  } else {
    const header = `
      <div class="header-block">
        <strong>${esc(eventMeta.venue) || 'Tävlingsplats'}</strong>
        ${eventMeta.date ? `${esc(eventMeta.date)}<br>` : ''}
        ${eventMeta.judge ? `Domare: ${esc(eventMeta.judge)}<br>` : ''}
        ${eventMeta.courseBuilder ? `Banbyggare: ${esc(eventMeta.courseBuilder)}` : ''}
      </div>`;
    const obstacleRows = buildFallbackRows(placed, visits);
    leftContent = `${header}<div class="obstacle-list"><h3 style="font-size:9px;text-transform:uppercase;letter-spacing:0.06em;color:#555;margin-bottom:4px;border-bottom:1px solid #eee;padding-bottom:2px;">Hinder</h3>${obstacleRows}</div>`;
  }

  const html = buildPrintHtml(dataUrl, leftContent);

  const w = window.open('', '_blank');
  if (!w) {
    alert('Pop-up blocked. Please allow pop-ups for this site and try again.');
    return;
  }
  w.document.write(html);
  w.document.close();
}

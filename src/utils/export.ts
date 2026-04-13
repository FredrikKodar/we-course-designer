import type { PlacedItem, Visit, WEClass, Discipline } from '../types';
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

const ROW = (content: string) =>
  `<div style="margin-bottom:4px;font-size:10px;line-height:1.4;">${content}</div>`;

/** Unnumbered row for a start-finish gate visit, shown as "Start" or "Mål". */
function startFinishRows(allPlaced: PlacedItem[], visits: Visit[]): { start: string; finish: string } {
  let start = '';
  let finish = '';
  for (const v of visits) {
    const p = allPlaced.find((pl) => pl.id === v.obstacleId);
    if (!p || p.kind !== 'gate' || p.type !== 'start-finish') continue;
    if (v.role === 'start' || v.role === 'start-and-finish') {
      start = ROW('<strong>Start</strong>');
    }
    if (v.role === 'finish' || v.role === 'start-and-finish') {
      finish = ROW('<strong>Mål</strong>');
    }
  }
  return { start, finish };
}

/** Obstacle visits only, sorted by num, skipping unnumbered entries. */
function sortedVisitRows(
  allPlaced: PlacedItem[],
  visits: Visit[],
): Array<{ visit: Visit; label: string; obstacleId: string }> {
  return [...visits]
    .filter((v) => {
      if (v.num === '') return false;
      const p = allPlaced.find((pl) => pl.id === v.obstacleId);
      return p?.kind === 'obstacle';
    })
    .sort((a, b) => a.num.localeCompare(b.num, undefined, { numeric: true, sensitivity: 'base' }))
    .map((v) => {
      const p = allPlaced.find((pl) => pl.id === v.obstacleId)!;
      const def = OBSTACLES.find((o) => o.id === (p as { type: string }).type);
      return { visit: v, label: def?.label ?? (p as { type: string }).type, obstacleId: v.obstacleId };
    });
}

function buildFallbackRows(allPlaced: PlacedItem[], visits: Visit[]): string {
  const { start, finish } = startFinishRows(allPlaced, visits);
  const sequenced = sortedVisitRows(allPlaced, visits);
  const middle: string[] = sequenced.map(({ visit, label }) =>
    ROW(`<strong>${esc(visit.num)}.</strong> <strong>${esc(label)}</strong>`)
  );
  // append placed obstacles with no visit num
  const sequencedIds = new Set(sequenced.map((r) => r.obstacleId));
  for (const p of allPlaced) {
    if (p.kind !== 'obstacle') continue;
    if (sequencedIds.has(p.id)) continue;
    const def = OBSTACLES.find((o) => o.id === p.type);
    middle.push(ROW(`– <strong>${esc(def?.label ?? p.type)}</strong>`));
  }
  return [start, ...middle, finish].filter(Boolean).join('');
}

function buildDisciplineSection(
  title: string,
  cls: WEClass,
  discipline: Discipline,
  allPlaced: PlacedItem[],
  visits: Visit[],
): string {
  const { start, finish } = startFinishRows(allPlaced, visits);
  const rows = sortedVisitRows(allPlaced, visits);
  const middle = rows
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
  const items = [start, middle, finish].filter(Boolean).join('');

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
    const teknikSection = buildDisciplineSection('Teknik', cls, 'teknik', allPlaced, visits);
    const speedSection = buildDisciplineSection('Speed', cls, 'speed', allPlaced, visits);
    leftContent = `${header}<div class="obstacle-list">${teknikSection}${speedSection}</div>`;
  } else {
    const header = `
      <div class="header-block">
        <strong>${esc(eventMeta.venue) || 'Tävlingsplats'}</strong>
        ${eventMeta.date ? `${esc(eventMeta.date)}<br>` : ''}
        ${eventMeta.judge ? `Domare: ${esc(eventMeta.judge)}<br>` : ''}
        ${eventMeta.courseBuilder ? `Banbyggare: ${esc(eventMeta.courseBuilder)}` : ''}
      </div>`;
    const obstacleRows = buildFallbackRows(allPlaced, visits);
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

import useStore, { type PersistedState } from '../store/useStore';

function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9åäö]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildFilename(): string {
  const { eventMeta } = useStore.getState();
  const venueSlug = slugify(eventMeta.venue || '');
  const dateSlug = slugify(eventMeta.date || '');
  const parts = [venueSlug, dateSlug].filter(Boolean);
  return parts.length > 0 ? `${parts.join('-')}.json` : 'bana.json';
}

export function saveCourseToFile(): void {
  const s = useStore.getState();
  const data: PersistedState = {
    placed: s.placed,
    arenaW: s.arenaW,
    arenaH: s.arenaH,
    pathLineType: s.pathLineType,
    pathLineWeight: s.pathLineWeight,
    pathArrowSize: s.pathArrowSize,
    visits: s.visits,
    classes: s.classes,
    eventMeta: s.eventMeta,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = buildFilename();
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function migrate(data: any): PersistedState {
  return {
    ...data,
    placed: (data.placed ?? []).map((p: any) => (p.kind ? p : { ...p, kind: 'obstacle' })),
  };
}

export async function loadCourseFromFile(file: File): Promise<void> {
  let parsed: any;
  try {
    const text = await file.text();
    parsed = JSON.parse(text);
  } catch {
    window.alert('Kunde inte läsa filen — kontrollera att det är en giltig bankfil.');
    return;
  }
  useStore.getState().loadCourse(migrate(parsed));
}

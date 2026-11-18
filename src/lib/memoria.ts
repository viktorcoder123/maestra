'use client';

export type ArtifactKind = 'palacio' | 'canta' | 'frase' | 'mapa';

export async function loadArtifact<T = unknown>(kind: ArtifactKind, tema?: number, list?: string): Promise<T | null> {
  const q = new URLSearchParams({ kind });
  if (tema != null) q.set('tema', String(tema));
  if (list != null) q.set('list', list);
  const res = await fetch(`/api/memoria?${q}`);
  if (!res.ok) return null;
  const { artifacts } = await res.json();
  return (artifacts[0]?.data as T) ?? null;
}

export async function saveArtifact(kind: ArtifactKind, data: unknown, tema?: number, list?: string): Promise<void> {
  await fetch('/api/memoria', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ kind, tema_id: tema, list_key: list, data }),
  });
}

/** Debounce helper for autosave. */
export function debouncedSaver(kind: ArtifactKind, tema?: number, list?: string, delay = 500) {
  let timer: any;
  return (data: unknown) => {
    clearTimeout(timer);
    timer = setTimeout(() => saveArtifact(kind, data, tema, list), delay);
  };
}

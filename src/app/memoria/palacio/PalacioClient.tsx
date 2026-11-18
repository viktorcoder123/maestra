'use client';
import { useEffect, useMemo, useState } from 'react';
import { sfx } from '@/lib/sfx';
import { registerAnswer } from '@/lib/game-state';
import { TemaPills } from '@/components/TemaPills';
import { Button } from '@/components/Button';
import { loadArtifact, saveArtifact } from '@/lib/memoria';

type Section = { id: number; tema_id: number; number: string; title: string };
type Placement = Record<string, number>; // room -> section_id

const BASE_ROOMS = [
  { key: 'entrada',  name: 'Entrada',         area: 'entrada' },
  { key: 'pasillo',  name: 'Pasillo',         area: 'pasillo' },
  { key: 'aula',     name: 'Aula de música',  area: 'aula' },
  { key: 'biblio',   name: 'Biblioteca',      area: 'biblio' },
  { key: 'salon',    name: 'Salón de actos',  area: 'salon' },
  { key: 'comedor',  name: 'Comedor',         area: 'comedor' },
  { key: 'gim',      name: 'Gimnasio',        area: 'gim' },
  { key: 'patio',    name: 'Patio',           area: 'patio' },
];

// Walking order
const WALK_ORDER = ['entrada', 'pasillo', 'aula', 'biblio', 'salon', 'comedor', 'gim', 'patio'];

const GRID = `'aula    aula    biblio  salon'
              'pasillo pasillo pasillo salon'
              'entrada comedor gim     patio'`;

export function PalacioClient({ temas, topByTema }: { temas: any[]; topByTema: Record<number, any[]> }) {
  const [temaId, setTemaId] = useState<number>(temas[0]?.id ?? 7);
  const [placement, setPlacement] = useState<Placement>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [mode, setMode] = useState<'place' | 'walk' | 'done'>('place');
  const [step, setStep] = useState(0);
  const [log, setLog] = useState<Array<{ room: string; section_id: number; correct: boolean }>>([]);
  const [combo, setCombo] = useState(0);

  const sections: Section[] = useMemo(() => (topByTema[temaId] ?? []).filter((s: any) => !['0','99','100'].includes(s.number)), [topByTema, temaId]);
  const rooms = useMemo(() => {
    // If tema has more sections than rooms, add extra rooms
    const needed = Math.max(0, sections.length - BASE_ROOMS.length);
    const extra = Array.from({ length: needed }, (_, i) => ({ key: `extra${i}`, name: `Sala ${BASE_ROOMS.length + i + 1}`, area: `extra${i}` }));
    return [...BASE_ROOMS, ...extra];
  }, [sections.length]);

  // Load saved placement for this tema
  useEffect(() => {
    (async () => {
      const saved = await loadArtifact<Placement>('palacio', temaId);
      setPlacement(saved ?? {});
      setMode('place'); setSelected(null); setStep(0); setLog([]); setCombo(0);
    })();
  }, [temaId]);

  const placedIds = new Set(Object.values(placement));
  const unplaced = sections.filter((s) => !placedIds.has(s.id));
  const canWalk = unplaced.length === 0 && sections.length > 0;

  function tapChip(id: number) {
    if (mode !== 'place') return;
    setSelected((s) => (s === id ? null : id));
  }

  function tapRoom(roomKey: string) {
    if (mode === 'walk') return walkAnswer(roomKey);
    if (mode !== 'place') return;
    const already = placement[roomKey];
    if (selected) {
      // Place/replace. If the selected section was placed elsewhere, remove it from there first.
      const next: Placement = {};
      for (const [k, v] of Object.entries(placement)) if (v !== selected) next[k] = v;
      next[roomKey] = selected;
      setPlacement(next);
      setSelected(null);
      sfx.click();
      saveArtifact('palacio', next, temaId);
    } else if (already) {
      // Tap occupied room with nothing selected: remove
      const next = { ...placement }; delete next[roomKey];
      setPlacement(next);
      saveArtifact('palacio', next, temaId);
    }
  }

  function startWalk() {
    setMode('walk'); setStep(0); setLog([]); setCombo(0);
  }

  const occupiedWalkOrder = useMemo(() => WALK_ORDER.concat(rooms.filter((r) => r.key.startsWith('extra')).map((r) => r.key))
    .filter((k) => placement[k] != null), [placement, rooms]);

  const currentRoomKey = occupiedWalkOrder[step];
  const currentRoomObj = rooms.find((r) => r.key === currentRoomKey);
  const answeredIds = new Set(log.map((l) => l.section_id));
  const remainingSections = sections.filter((s) => !answeredIds.has(s.id)).sort((a, b) => a.title.localeCompare(b.title, 'es'));

  function walkAnswer(sectionIdOrRoom: number | string) {
    // Called with section_id when tapping a chip
    const sid = typeof sectionIdOrRoom === 'number' ? sectionIdOrRoom : null;
    if (sid == null) return;
    const trueSection = placement[currentRoomKey!];
    const correct = sid === trueSection;
    correct ? sfx.correct() : sfx.wrong();
    const res = registerAnswer('palacio', correct, 6, combo);
    setCombo(res.newCombo);
    if (correct && res.newCombo >= 3) sfx.combo(res.newCombo);
    const nextLog = [...log, { room: currentRoomKey!, section_id: trueSection, correct }];
    setLog(nextLog);
    if (step + 1 >= occupiedWalkOrder.length) setMode('done');
    else setStep(step + 1);
  }

  function reset() { setMode('place'); setLog([]); setStep(0); setSelected(null); }

  const prompt = mode === 'walk'
    ? `Estás en: ${currentRoomObj?.name}. ¿Qué sección dejaste aquí?`
    : mode === 'done'
      ? `${log.filter((l) => l.correct).length} de ${log.length} salas recordadas.`
      : canWalk
        ? 'Todo colocado. Repasa el edificio con la vista y luego recórrelo.'
        : selected
          ? 'Ahora toca la sala donde quieres dejarla. Imagina la escena: cuanto más rara, mejor.'
          : 'Elige una sección y déjala en una sala. El recorrido siempre empieza en la Entrada.';

  return (
    <div>
      <TemaPills temas={temas} value={temaId} onChange={setTemaId} />
      <p className="text-[16px] text-ink-700 max-w-[720px] mb-5">{prompt}</p>

      {sections.length === 0 ? (
        <div className="bg-sage-100 rounded-3xl p-8 text-center text-ink-500">No hay secciones cargadas para este tema.</div>
      ) : (
        <div className="bg-ink-100 rounded-3xl p-[14px] overflow-x-auto mb-6">
          <div className="min-w-[660px] grid gap-[6px]" style={{ gridTemplateAreas: GRID, gridTemplateColumns: 'repeat(4,1fr)', gridTemplateRows: 'repeat(3, minmax(118px, auto))' }}>
            {rooms.slice(0, 8).map((r) => {
              const sid = placement[r.key];
              const section = sections.find((s) => s.id === sid);
              const isCurrent = mode === 'walk' && r.key === currentRoomKey;
              const logEntry = log.find((l) => l.room === r.key);
              const showResult = (mode === 'done' || (mode === 'walk' && log.some((l) => l.room === r.key))) && logEntry;

              const base = 'w-full h-full text-left rounded-[10px] border-2 p-4 flex flex-col gap-2 transition-colors';
              let style = 'bg-white border-ink-900';
              if (showResult) style = logEntry.correct ? 'bg-sage-600 border-sage-600 text-white' : 'bg-bad border-bad text-white';
              else if (isCurrent) style = 'bg-brand-50 border-brand-500';
              else if (selected && mode === 'place') style = 'bg-white border-dashed border-brand-500';
              else if (mode === 'walk' && !isCurrent && !logEntry) style = 'bg-white border-ink-300';

              return (
                <button key={r.key} onClick={() => tapRoom(r.key)} className={base + ' ' + style} style={{ gridArea: r.area }}>
                  <div className="text-[11px] font-semibold uppercase tracking-[.06em] opacity-75">{r.name}</div>
                  <div className="font-serif text-[22px] leading-[1.12] flex-1">
                    {showResult && section ? `${section.number}. ${section.title}` :
                     isCurrent ? '¿Qué dejaste aquí?' :
                     section ? `${section.number}. ${section.title}` :
                     mode === 'walk' ? '· · ·' : ''}
                  </div>
                  <div className={`text-[13px] font-semibold ${showResult ? 'text-white/80' : 'text-brand-600'}`}>
                    {showResult ? '' : isCurrent ? 'Estás aquí' : selected && mode === 'place' ? 'Dejar aquí' : section && mode === 'place' ? 'Toca para quitar' : ''}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {mode === 'place' && (
        <>
          <div className="flex flex-wrap gap-2 mb-5">
            {unplaced.map((s) => (
              <button key={s.id} onClick={() => tapChip(s.id)} className={`px-4 py-[11px] rounded-xl bg-white border-[1.5px] text-[15px] font-medium transition-all ${selected === s.id ? 'border-brand-500 bg-brand-50 -translate-y-[3px] shadow-tile' : 'border-ink-200 hover:border-ink-900'}`}>
                {s.number}. {s.title}
              </button>
            ))}
          </div>
          <Button variant="primary" disabled={!canWalk} onClick={startWalk}>Recorrer el edificio</Button>
        </>
      )}

      {mode === 'walk' && (
        <>
          <div className="flex flex-wrap gap-2 mb-5">
            {remainingSections.map((s) => (
              <button key={s.id} onClick={() => walkAnswer(s.id)} className="px-4 py-[11px] rounded-xl bg-white border-[1.5px] border-ink-200 text-[15px] font-medium hover:border-ink-900">
                {s.title}
              </button>
            ))}
          </div>
          <Button variant="ghost" onClick={reset}>Volver a colocar</Button>
        </>
      )}

      {mode === 'done' && (
        <div className="flex gap-3 flex-wrap">
          <Button variant="primary" onClick={startWalk}>Recorrer otra vez</Button>
          <Button variant="ghost" onClick={reset}>Cambiar la colocación</Button>
        </div>
      )}
    </div>
  );
}

'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as Tone from 'tone';
import { sfx } from '@/lib/sfx';
import { registerAnswer } from '@/lib/game-state';
import { TemaPills } from '@/components/TemaPills';
import { Button } from '@/components/Button';
import { loadArtifact, saveArtifact } from '@/lib/memoria';

type Section = { id: number; tema_id: number; number: string; title: string };
type Melodies = Record<string, number[]>; // section_id -> MIDI array

const BARS = [
  { midi: 60, name: 'Do', degree: 0 },
  { midi: 62, name: 'Re', degree: 1 },
  { midi: 64, name: 'Mi', degree: 2 },
  { midi: 65, name: 'Fa', degree: 3 },
  { midi: 67, name: 'Sol', degree: 4 },
  { midi: 69, name: 'La', degree: 5 },
  { midi: 71, name: 'Si', degree: 6 },
  { midi: 72, name: 'Do', degree: 7 },
];

let synth: Tone.Synth | null = null;
async function play(midi: number, dur = '0.3') {
  await Tone.start();
  if (!synth) synth = new Tone.Synth({ oscillator: { type: 'triangle' } }).toDestination();
  synth.triggerAttackRelease(Tone.Frequency(midi, 'midi').toNote(), dur);
}

export function CantaClient({ temas, topByTema }: { temas: any[]; topByTema: Record<number, any[]> }) {
  const [temaId, setTemaId] = useState<number>(temas[0]?.id ?? 7);
  const sections: Section[] = useMemo(() => (topByTema[temaId] ?? []).filter((s: any) => !['0','99','100'].includes(s.number)), [topByTema, temaId]);
  const [melodies, setMelodies] = useState<Melodies>({});
  const [mode, setMode] = useState<'compose' | 'quiz'>('compose');
  const [selected, setSelected] = useState<number | null>(null);
  const [playingRow, setPlayingRow] = useState<number | null>(null);
  const [flashKey, setFlashKey] = useState<number | null>(null);
  const flashTimer = useRef<any>(null);

  // Quiz state
  const [quizSid, setQuizSid] = useState<number | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [combo, setCombo] = useState(0);

  useEffect(() => {
    (async () => {
      const saved = await loadArtifact<Melodies>('canta', temaId);
      setMelodies(saved ?? {});
      setSelected(null); setMode('compose'); setPlayingRow(null); setQuizSid(null); setPicked(null);
    })();
  }, [temaId]);

  function flash(midi: number) {
    play(midi);
    setFlashKey(midi);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlashKey((f) => (f === midi ? null : f)), 160);
  }

  function pressBar(midi: number) {
    flash(midi);
    if (mode === 'quiz') return; // don't record in quiz
    if (selected == null) return;
    const current = melodies[String(selected)] ?? [];
    if (current.length >= 6) return;
    const next = [...current, midi];
    const ms = { ...melodies, [String(selected)]: next };
    setMelodies(ms);
    saveArtifact('canta', ms, temaId);
  }

  function selectRow(sid: number) {
    setSelected(sid);
    if (mode === 'compose') playMelody(sid);
  }

  async function playMelody(sid: number) {
    const notes = melodies[String(sid)] ?? [];
    if (notes.length === 0) return;
    setPlayingRow(sid);
    for (let i = 0; i < notes.length; i++) {
      play(notes[i]);
      await new Promise((r) => setTimeout(r, 350));
    }
    setPlayingRow(null);
  }

  async function playAll() {
    for (const s of sections) {
      const notes = melodies[String(s.id)];
      if (!notes || notes.length === 0) continue;
      setPlayingRow(s.id);
      for (let i = 0; i < notes.length; i++) {
        play(notes[i]);
        await new Promise((r) => setTimeout(r, 350));
      }
      await new Promise((r) => setTimeout(r, 550));
    }
    setPlayingRow(null);
  }

  function clearSelected() {
    if (selected == null) return;
    const ms = { ...melodies }; delete ms[String(selected)];
    setMelodies(ms); saveArtifact('canta', ms, temaId);
  }

  function suggestAll() {
    const pool = [60, 62, 64, 67, 69, 72];
    const ms: Melodies = {};
    for (const s of sections) {
      const n = 4 + Math.floor(Math.random() * 2);
      ms[String(s.id)] = Array.from({ length: n }, () => pool[Math.floor(Math.random() * pool.length)]);
    }
    setMelodies(ms); saveArtifact('canta', ms, temaId);
  }

  const canTest = sections.every((s) => (melodies[String(s.id)] ?? []).length >= 2) && sections.length > 0;

  async function startQuiz() {
    setMode('quiz'); setPicked(null);
    nextQuestion();
  }

  async function nextQuestion() {
    const available = sections.filter((s) => s.id !== quizSid && (melodies[String(s.id)] ?? []).length >= 2);
    if (available.length === 0) return;
    const s = available[Math.floor(Math.random() * available.length)];
    setQuizSid(s.id); setPicked(null);
    setTimeout(() => playMelody(s.id), 300);
  }

  function answerQuiz(sid: number) {
    if (picked || quizSid == null) return;
    setPicked(sid);
    const correct = sid === quizSid;
    const res = registerAnswer('canta', correct, 8, combo);
    setCombo(res.newCombo);
    correct ? sfx.correct() : sfx.wrong();
  }

  const quizCurrent = quizSid != null ? sections.find((s) => s.id === quizSid) : null;

  return (
    <div>
      <TemaPills temas={temas} value={temaId} onChange={setTemaId} />
      <div className="bg-stage text-ink-50 rounded-3xl p-[clamp(20px,4vw,32px)]">
        <p className="text-[15px] text-ink-50/80 mb-5 max-w-xl">
          {mode === 'compose'
            ? 'Elige una sección y tócale una melodía de hasta seis notas en el xilófono. Luego cántalas en orden.'
            : picked == null
              ? '¿De qué sección es esta melodía?'
              : picked === quizSid ? 'Correcto.' : `No. Era la sección ${quizCurrent?.number}.`}
        </p>

        <div className="flex flex-col gap-[6px] mb-5">
          {sections.map((s) => {
            const notes = melodies[String(s.id)] ?? [];
            const isSel = selected === s.id;
            const isPlaying = playingRow === s.id;
            const isQuizTarget = mode === 'quiz' && quizSid === s.id;
            const isPicked = picked === s.id;
            const border =
              mode === 'quiz' && picked != null
                ? isQuizTarget ? 'border-ok-dark' : isPicked ? 'border-bad-dark' : 'border-ink-50/20'
                : isSel || isPlaying ? 'border-brand-400' : 'border-ink-50/20';
            const bg = isPlaying ? 'bg-[rgba(235,122,58,0.18)]' : 'bg-ink-50/[0.07]';
            return (
              <button key={s.id} onClick={() => selectRow(s.id)} className={`flex items-center gap-[14px] p-[10px_16px] rounded-[14px] border-2 min-h-[64px] text-left transition-colors ${bg} ${border}`}>
                <span className="font-serif text-[30px] text-brand-400 w-[26px] flex-none">{s.number}</span>
                <span className="flex-1 text-[16px] font-medium">{s.title}</span>
                {mode === 'quiz' && !isQuizTarget && !isPicked ? (
                  <span className="text-[13px] text-ink-300">¿?</span>
                ) : notes.length === 0 ? (
                  <span className="text-[13px] text-ink-300">sin melodía</span>
                ) : (
                  <svg viewBox="0 0 150 46" width="150" height="46" className="flex-none">
                    <line x1="0" x2="0" y1="0" y2="46" stroke="rgba(250,250,247,0.2)" strokeWidth="0.5" />
                    {notes.map((m, i) => {
                      const bar = BARS.find((b) => b.midi === m);
                      const d = bar?.degree ?? 0;
                      const x = 12 + i * 22;
                      const y = 36 - d * 5;
                      return <ellipse key={i} cx={x} cy={y} rx={7} ry={5} transform={`rotate(-18 ${x} ${y})`}
                        fill={isPlaying ? '#eb7a3a' : '#fafaf7'} />;
                    })}
                  </svg>
                )}
              </button>
            );
          })}
        </div>

        {/* Xylophone */}
        <div className="flex gap-[6px] items-start justify-center max-w-[640px] mx-auto mb-6">
          {BARS.map((b, i) => {
            const flash = flashKey === b.midi;
            return (
              <button key={b.midi} onPointerDown={(e) => { e.preventDefault(); pressBar(b.midi); }}
                className={`flex-1 rounded-lg flex items-end justify-center transition-colors ${flash ? 'bg-brand-400' : 'bg-ink-50 hover:bg-ink-100'}`}
                style={{ height: 190 - i * 11 }}>
                <span className="text-[13px] font-semibold text-ink-900 pb-2">{b.name}</span>
              </button>
            );
          })}
        </div>

        {mode === 'compose' ? (
          <div className="flex gap-2 flex-wrap">
            <Button variant="primary" onClick={playAll} disabled={!Object.values(melodies).some((n) => n?.length > 0)}>Cantar todo</Button>
            <Button variant="ghost-dark" onClick={startQuiz} disabled={!canTest}>Ponme a prueba</Button>
            <Button variant="ghost-dark" onClick={clearSelected} disabled={selected == null}>Borrar esta melodía</Button>
            <Button variant="ghost-dark" onClick={suggestAll}>Sugerir melodías</Button>
          </div>
        ) : (
          <div className="flex gap-2 flex-wrap">
            <Button variant="ghost-dark" onClick={() => quizSid && playMelody(quizSid)}>Escuchar otra vez</Button>
            <Button variant="primary" onClick={nextQuestion} disabled={picked == null}>Siguiente →</Button>
            <Button variant="ghost-dark" onClick={() => { setMode('compose'); setPicked(null); setQuizSid(null); }}>Volver a componer</Button>
          </div>
        )}
      </div>
    </div>
  );
}

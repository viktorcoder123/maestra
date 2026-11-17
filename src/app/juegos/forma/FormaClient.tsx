'use client';
import { useState } from 'react';
import * as Tone from 'tone';
import { sfx } from '@/lib/sfx';
import { registerAnswer } from '@/lib/game-state';
import { Button } from '@/components/Button';

const FORMS: Array<[string, string, string]> = [
  ['Binaria', 'Dos secciones contrastantes.', 'AB'],
  ['Ternaria', 'Exposición, contraste y retorno.', 'ABA'],
  ['Forma canción (AABA)', 'Dos secciones A, puente B y retorno.', 'AABA'],
  ['Rondó', 'Tema principal alterna con episodios.', 'ABACA'],
];

const MOTIF: Record<string, number[]> = { A: [60, 64, 67], B: [65, 69, 72], C: [67, 71, 74] };

let synth: Tone.Synth | null = null;
async function play(block: 'A' | 'B' | 'C') {
  await Tone.start();
  if (!synth) synth = new Tone.Synth({ oscillator: { type: 'triangle' } }).toDestination();
  const t = Tone.now();
  MOTIF[block].forEach((n, i) => synth!.triggerAttackRelease(Tone.Frequency(n, 'midi').toNote(), '8n', t + i * 0.18));
}

export function FormaClient() {
  const [combo, setCombo] = useState(0);
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * FORMS.length));
  const [seq, setSeq] = useState<Array<'A' | 'B' | 'C'>>([]);
  const [checked, setChecked] = useState(false);
  const [name, desc, target] = FORMS[idx];

  function add(b: 'A' | 'B' | 'C') {
    if (checked) return;
    if (seq.length >= 7) return;
    play(b);
    setSeq((s) => [...s, b]);
  }
  function undo() { if (!checked) setSeq((s) => s.slice(0, -1)); }
  function check() {
    setChecked(true);
    const ok = seq.join('') === target;
    const res = registerAnswer('forma', ok, 10, combo);
    setCombo(res.newCombo);
    ok ? sfx.correct() : sfx.wrong();
  }
  function next() {
    setIdx((i) => (i + 1) % FORMS.length);
    setSeq([]); setChecked(false);
  }
  const ok = checked && seq.join('') === target;

  return (
    <div className="bg-brand-50 rounded-3xl p-[clamp(24px,4vw,40px)]">
      <div className="text-[12px] font-semibold uppercase tracking-[.06em] text-brand-600">Forma</div>
      <div className="font-serif text-[clamp(32px,5vw,52px)] leading-none mt-2">{name}</div>
      <p className="text-sm text-ink-500 mt-2 mb-6">{desc}</p>

      <div className={`flex gap-2 flex-wrap p-3 rounded-2xl border-2 min-h-[84px] ${checked ? (ok ? 'border-sage-600' : 'border-bad') : 'border-dashed border-ink-300'} bg-white`}>
        {seq.map((b, i) => (
          <span key={i} className={`w-[64px] h-[64px] rounded-xl flex items-center justify-center font-serif text-[26px] ${b === 'A' ? 'bg-ink-900 text-white' : b === 'B' ? 'bg-brand-500 text-white' : 'bg-sage-600 text-white'}`}>{b}</span>
        ))}
        {seq.length === 0 && <span className="text-ink-500 text-sm self-center">Añade bloques A, B y C</span>}
      </div>

      <div className="flex gap-2 mt-4 flex-wrap">
        {(['A','B','C'] as const).map((b) => (
          <button key={b} onClick={() => add(b)} className={`w-[72px] h-[72px] rounded-2xl font-serif text-[30px] ${b === 'A' ? 'bg-ink-900 text-white' : b === 'B' ? 'bg-brand-500 text-white' : 'bg-sage-600 text-white'} hover:brightness-110`}>
            {b}
          </button>
        ))}
        <Button variant="ghost" size="sm" onClick={undo}>Borrar último</Button>
        {!checked ? <Button variant="primary" size="sm" onClick={check}>Comprobar</Button> : <Button variant="dark" size="sm" onClick={next}>Otra forma →</Button>}
      </div>
      {checked && !ok && <div className="text-sm text-bad mt-3">La forma es {target.split('').join(' ')}.</div>}
    </div>
  );
}

'use client';
import { useState } from 'react';
import * as Tone from 'tone';
import { sfx } from '@/lib/sfx';
import { registerAnswer } from '@/lib/game-state';
import { Button } from '@/components/Button';

type Layer = { id: 'mel' | 'ch' | 'mel2' | 'arp'; label: string; notes: number[] };
const LAYERS: Layer[] = [
  { id: 'mel',  label: 'Melodía',              notes: [67, 69, 71, 72, 74, 72, 71, 69] },
  { id: 'ch',   label: 'Acordes',              notes: [48, 52, 55, 60] },
  { id: 'mel2', label: 'Imitación (polifónica)', notes: [71, 72, 74, 76, 77, 76, 74, 72] },
  { id: 'arp',  label: 'Arpegios',              notes: [48, 52, 55, 60] },
];
// Target sets by texture
const TSETS: Array<[string, Array<Layer['id']>, string]> = [
  ['Monodia',           ['mel'],            'Una sola línea melódica, sin acompañamiento.'],
  ['Homofonía',         ['mel', 'ch'],      'Melodía principal con acompañamiento armónico subordinado.'],
  ['Polifonía',         ['mel', 'mel2'],    'Varias líneas melódicas independientes (contrapunto).'],
  ['Melodía acompañada', ['mel', 'arp'],    'Voz principal con acompañamiento arpegiado.'],
];

let synth: Tone.PolySynth | null = null;
async function ensure() { await Tone.start(); if (!synth) synth = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'triangle' } }).toDestination(); }

export function CapasClient() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * TSETS.length));
  const [on, setOn] = useState<Record<Layer['id'], boolean>>({ mel: false, ch: false, mel2: false, arp: false });
  const [checked, setChecked] = useState(false);
  const [combo, setCombo] = useState(0);

  const [name, correctSet, def] = TSETS[idx];

  function toggle(id: Layer['id']) { if (checked) return; sfx.click(); setOn((s) => ({ ...s, [id]: !s[id] })); }

  async function play() {
    await ensure();
    const t0 = Tone.now();
    if (on.mel) LAYERS[0].notes.forEach((n, i) => synth!.triggerAttackRelease(Tone.Frequency(n, 'midi').toNote(), '8n', t0 + i * 0.4));
    if (on.ch)  LAYERS[1].notes.forEach((n, i) => synth!.triggerAttackRelease([Tone.Frequency(n, 'midi').toNote(), Tone.Frequency(n+4, 'midi').toNote(), Tone.Frequency(n+7, 'midi').toNote()], '4n', t0 + i * 0.8));
    if (on.mel2) LAYERS[2].notes.forEach((n, i) => synth!.triggerAttackRelease(Tone.Frequency(n, 'midi').toNote(), '8n', t0 + 0.5 + i * 0.4));
    if (on.arp) { for (let r = 0; r < 4; r++) LAYERS[3].notes.forEach((n, i) => synth!.triggerAttackRelease(Tone.Frequency(n, 'midi').toNote(), '16n', t0 + r * 0.8 + i * 0.2)); }
  }

  function check() {
    setChecked(true);
    const ok = LAYERS.every((l) => on[l.id] === correctSet.includes(l.id));
    const res = registerAnswer('capas', ok, 10, combo);
    setCombo(res.newCombo);
    ok ? sfx.correct() : sfx.wrong();
  }
  function next() {
    setIdx((i) => (i + 1) % TSETS.length);
    setOn({ mel: false, ch: false, mel2: false, arp: false });
    setChecked(false);
  }

  return (
    <div className="bg-stage text-ink-50 rounded-3xl p-[clamp(24px,4vw,40px)]">
      <div className="text-[12px] font-semibold uppercase tracking-[.06em] text-brand-400">Enciende las capas que forman</div>
      <div className="font-serif text-[clamp(36px,6vw,64px)] leading-none mt-2 mb-5">{name}</div>
      <div className="flex gap-2 mb-5">
        <Button variant="primary" size="sm" onClick={play}>Escuchar mezcla</Button>
        {!checked ? <Button variant="ghost-dark" size="sm" onClick={check}>Comprobar</Button> : <Button variant="primary" size="sm" onClick={next}>Otra textura →</Button>}
      </div>
      <div className="space-y-3">
        {LAYERS.map((L) => {
          const isOn = on[L.id];
          const correct = correctSet.includes(L.id);
          const border = checked
            ? isOn === correct ? 'border-ok-dark' : 'border-bad-dark'
            : 'border-ink-50/15';
          return (
            <button key={L.id} onClick={() => toggle(L.id)} className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-colors ${border} ${isOn ? 'bg-ink-50/[0.07]' : 'bg-ink-50/[0.02]'}`}>
              <span className={`w-11 h-[26px] rounded-full relative transition-colors ${isOn ? 'bg-brand-500' : 'bg-ink-50/20'}`}>
                <span className={`absolute top-[2px] w-[22px] h-[22px] rounded-full bg-white transition-all ${isOn ? 'left-[22px]' : 'left-[2px]'}`} />
              </span>
              <span className="flex-1 font-medium">{L.label}</span>
              <span className="flex gap-[2px]">
                {Array.from({ length: 16 }).map((_, i) => {
                  const h = L.id === 'mel' ? (L.notes[i >> 1] - 58) * 3 : L.id === 'mel2' ? (i === 0 ? 4 : (L.notes[(i - 1) >> 1] - 52) * 3) : L.id === 'ch' ? (i % 2 ? 6 : 44) : [14, 24, 34, 48][i % 4];
                  return <span key={i} className={`w-[6px] rounded-sm ${isOn ? 'bg-brand-400' : 'bg-ink-50/20'}`} style={{ height: Math.max(3, h) }} />;
                })}
              </span>
            </button>
          );
        })}
      </div>
      {checked && <div className="text-sm text-ink-50/70 mt-4">{def}</div>}
    </div>
  );
}

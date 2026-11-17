'use client';
import { useState } from 'react';
import * as Tone from 'tone';
import { sfx } from '@/lib/sfx';
import { registerAnswer } from '@/lib/game-state';
import { Button } from '@/components/Button';

const IVN: Array<[string, number]> = [
  ['', 0],
  ['2ª mayor', 2],
  ['3ª mayor', 4],
  ['4ª justa', 5],
  ['5ª justa', 7],
  ['6ª mayor', 9],
  ['7ª mayor', 11],
  ['8ª justa', 12],
];
// Note heads for white-key diatonic positions D4..C5
// diatonic steps above E4 (y=124, step 8px up)
// D4 is below E4 → stepsFromE4 = -1 (but we treat starting from D4 as k=1)
// Use the staff model: E4=0 steps (y=124). Each step up = 8px.
function yFor(midi: number) {
  // Use diatonic-only mapping for white keys
  const DIATONIC_FROM_C: Record<number, number> = { 0: 0, 2: 1, 4: 2, 5: 3, 7: 4, 9: 5, 11: 6 };
  const d = midi - 60;
  const step = DIATONIC_FROM_C[((d % 12) + 12) % 12] + 7 * Math.floor(d / 12);
  const stepsFromE4 = step - 2;
  return 124 - stepsFromE4 * 8;
}

let synth: Tone.Synth | null = null;
async function note(midi: number, delay = 0) {
  await Tone.start();
  if (!synth) synth = new Tone.Synth({ oscillator: { type: 'triangle' } }).toDestination();
  synth.triggerAttackRelease(Tone.Frequency(midi, 'midi').toNote(), '0.5', Tone.now() + delay);
}

export function IntervaloClient() {
  const [step, setStep] = useState<number>(() => 1 + Math.floor(Math.random() * 7));
  const [picked, setPicked] = useState<number | null>(null);
  const [combo, setCombo] = useState(0);
  const target = 60 + IVN[step][1];

  async function play() { await note(60); await note(target, 0.6); }
  function reset() {
    setStep(1 + Math.floor(Math.random() * 7));
    setPicked(null);
  }

  function choose(k: number) {
    if (picked !== null) return;
    note(60 + IVN[k][1]);
    setPicked(k);
    const good = k === step;
    const res = registerAnswer('intervalo', good, 10, combo);
    setCombo(res.newCombo);
    good ? sfx.correct() : sfx.wrong();
    if (good && res.newCombo >= 3) sfx.combo(res.newCombo);
  }

  const done = picked !== null;
  const ok = picked === step;

  return (
    <div>
      <div className="bg-stage text-ink-50 rounded-3xl p-5">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
          <div className="text-sm text-ink-50/80">
            {done ? (ok ? 'Correcto.' : 'No era esa. La verde es la buena.') : 'Do es la nota grave. Escucha y coloca la segunda nota.'}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost-dark" size="sm" onClick={play}>Escuchar</Button>
            {done && <Button variant="primary" size="sm" onClick={reset}>Siguiente →</Button>}
          </div>
        </div>
        <div className="relative" style={{ height: 180 }}>
          <svg viewBox="0 0 100 160" preserveAspectRatio="none" className="w-full h-full" style={{ overflow: 'visible' }}>
            {[60, 76, 92, 108, 124].map((y) => <line key={y} x1="5" x2="95" y1={y} y2={y} stroke="rgba(250,250,247,0.5)" strokeWidth="0.3" />)}
            {/* C4 ledger line + notehead at x=14% */}
            <line x1="11" x2="17" y1="140" y2="140" stroke="rgba(250,250,247,0.6)" strokeWidth="0.4" />
            <ellipse cx="14" cy="140" rx="3.3" ry="2.2" transform="rotate(-18 14 140)" fill="#fafaf7" />
            <text x="14" y="154" fontSize="4" textAnchor="middle" fill="#fafaf7">Do</text>
            {[1,2,3,4,5,6,7].map((k) => {
              const x = 26 + (k - 1) * 9.5;
              const y = yFor(60 + IVN[k][1]);
              let fill = 'transparent', stroke = 'rgba(250,250,247,.6)', strokeDasharray = '1 0.6';
              if (done) {
                strokeDasharray = undefined as any;
                if (k === step) { fill = '#9cc294'; stroke = '#9cc294'; }
                else if (k === picked) { fill = '#f08a6c'; stroke = '#f08a6c'; }
                else { fill = 'transparent'; stroke = 'rgba(250,250,247,.25)'; }
              }
              return (
                <g key={k} style={{ cursor: done ? 'default' : 'pointer' }} onClick={() => choose(k)}>
                  <rect x={x - 3.5} y={y - 3} width={7} height={6} fill="transparent" />
                  <ellipse cx={x} cy={y} rx={3.3} ry={2.2} transform={`rotate(-18 ${x} ${y})`} fill={fill} stroke={stroke} strokeWidth={0.6} strokeDasharray={strokeDasharray} />
                </g>
              );
            })}
          </svg>
        </div>
        {done && <div className="text-center font-serif text-[clamp(28px,4vw,34px)] mt-3">{IVN[step][0]}</div>}
      </div>
    </div>
  );
}

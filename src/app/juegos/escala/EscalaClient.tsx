'use client';
import { useState } from 'react';
import * as Tone from 'tone';
import { sfx } from '@/lib/sfx';
import { registerAnswer } from '@/lib/game-state';
import { Button } from '@/components/Button';
import { Piano, PianoKeyState } from '@/components/Piano';

type Mode = { id: string; nombre: string; intervalos: number[] };

let synth: Tone.Synth | null = null;
async function note(midi: number, delay = 0) {
  await Tone.start();
  if (!synth) synth = new Tone.Synth({ oscillator: { type: 'triangle' } }).toDestination();
  synth.triggerAttackRelease(Tone.Frequency(midi, 'midi').toNote(), '0.3', Tone.now() + delay);
}

export function EscalaClient({ modes }: { modes: Mode[] }) {
  const [combo, setCombo] = useState(0);
  const [modeIdx, setModeIdx] = useState(() => Math.floor(Math.random() * modes.length));
  const mode = modes[modeIdx];
  const requiredSteps = new Set<number>(mode.intervalos);
  // Pre-select Do and Do (0, 12), lock them
  const [selected, setSelected] = useState<Set<number>>(() => new Set([0, 12]));
  const [checked, setChecked] = useState(false);

  const WHITES = [60, 62, 64, 65, 67, 69, 71, 72];
  const locked = [60, 72];

  function toggle(midi: number) {
    if (checked) return;
    const step = midi - 60;
    if (step === 0 || step === 12) return;
    note(midi);
    setSelected((s) => {
      const n = new Set(s);
      n.has(step) ? n.delete(step) : n.add(step);
      return n;
    });
  }

  async function play() {
    const notes = [...selected].sort((a, b) => a - b);
    for (let i = 0; i < notes.length; i++) await note(60 + notes[i], i * 0.3);
  }

  function check() {
    const correct = [...requiredSteps].every((s) => selected.has(s)) && [...selected].every((s) => requiredSteps.has(s));
    setChecked(true);
    const res = registerAnswer('escala', correct, 15, combo);
    setCombo(res.newCombo);
    correct ? sfx.correct() : sfx.wrong();
  }

  function next() {
    setModeIdx((i) => (i + 1) % modes.length);
    setSelected(new Set([0, 12]));
    setChecked(false);
  }

  const inMode = (midi: number) => requiredSteps.has(midi - 60);

  const state: Record<number, PianoKeyState> = {};
  for (const midi of [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72]) {
    const step = midi - 60;
    const on = selected.has(step);
    if (!checked) state[midi] = on ? 'on' : 'idle';
    else if (on && inMode(midi)) state[midi] = 'correct';
    else if (on && !inMode(midi)) state[midi] = 'wrong';
    else if (!on && inMode(midi)) state[midi] = 'missing';
    else state[midi] = 'idle';
  }

  const statusText = checked
    ? ([...requiredSteps].every((s) => selected.has(s)) && [...selected].every((s) => requiredSteps.has(s)))
      ? 'Escala correcta.'
      : 'Rojo: sobra. Verde claro: faltaba.'
    : 'Do grave y Do agudo ya están puestos. Pulsa el resto.';

  return (
    <div className="bg-stage text-ink-50 rounded-3xl p-5">
      <div className="text-[12px] font-semibold uppercase tracking-[.06em] text-brand-400">Construye desde Do</div>
      <div className="font-serif text-[clamp(32px,5.5vw,56px)] leading-none mt-2">{mode.nombre}</div>
      <div className="text-sm text-ink-50/80 mt-3 mb-5">{statusText}</div>
      <div className="flex gap-2 mb-5">
        <Button variant="ghost-dark" size="sm" onClick={play}>Escuchar mi escala</Button>
        {!checked ? (
          <Button variant="primary" size="sm" onClick={check}>Comprobar</Button>
        ) : (
          <Button variant="primary" size="sm" onClick={next}>Otra escala →</Button>
        )}
      </div>
      <Piano whites={WHITES} state={state} onPress={toggle} height={200} lockedKeys={locked} showNames={true} />
    </div>
  );
}

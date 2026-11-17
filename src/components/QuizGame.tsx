'use client';
import { useMemo, useState } from 'react';
import { sfx } from '@/lib/sfx';
import { registerAnswer } from '@/lib/game-state';
import { ChoiceButton } from './ChoiceButton';
import { ProgressDots } from './ProgressDots';
import { Button } from './Button';

export interface QuizQuestion {
  tag?: string;
  text: string;
  sub?: string;
  long?: boolean;
  clues?: string[];
  choices: string[];
  answer: string;
  after?: string;
  base?: number;
}

export type QuizTheme = {
  bg: string;       // tailwind class for bg
  fg: 'light' | 'dark';
  eyebrow: string;  // tailwind class for eyebrow
};

const THEMES: Record<string, QuizTheme> = {
  tema:    { bg: 'bg-sage-100', fg: 'dark',  eyebrow: 'text-sage-700' },
  mentira: { bg: 'bg-brand-100', fg: 'dark', eyebrow: 'text-brand-700' },
  aula:    { bg: 'bg-stage',    fg: 'light', eyebrow: 'text-brand-400' },
  lomloe:  { bg: 'bg-white border border-ink-200', fg: 'dark', eyebrow: 'text-brand-600' },
  'quien-soy': { bg: 'bg-stage', fg: 'light', eyebrow: 'text-brand-400' },
  reto:    { bg: 'bg-brand-700', fg: 'light', eyebrow: 'text-brand-100' },
};

export function QuizGame({ game, questions, base = 8, verdictPerfect = 'Ronda perfecta.', verdictMixed = 'Ronda terminada. Los fallos vuelven a salir en la siguiente.' }: {
  game: string;
  questions: QuizQuestion[];
  base?: number;
  verdictPerfect?: string;
  verdictMixed?: string;
}) {
  const theme = THEMES[game] ?? THEMES.lomloe;
  const stage = theme.fg === 'light';
  const [idx, setIdx] = useState(0);
  const [log, setLog] = useState<boolean[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [combo, setCombo] = useState(0);
  const [cluesShown, setCluesShown] = useState(1);

  const current = questions[idx];
  const states = useMemo(() => {
    const out: Array<'done-right' | 'done-wrong' | 'current' | 'upcoming'> = [];
    for (let i = 0; i < questions.length; i++) {
      if (i < log.length) out.push(log[i] ? 'done-right' : 'done-wrong');
      else if (i === idx) out.push('current');
      else out.push('upcoming');
    }
    return out;
  }, [questions.length, log, idx]);

  if (!current) {
    const perfect = log.every(Boolean) && log.length === questions.length;
    return (
      <div className="bg-ink-900 text-ink-50 rounded-3xl p-10 text-center">
        <div className="text-[12px] font-semibold uppercase tracking-[.06em] text-brand-400 mb-3">Resultado</div>
        <div className="font-serif text-[clamp(44px,6vw,64px)] leading-none">{log.filter(Boolean).length} de {questions.length}</div>
        <p className="text-ink-50/80 mt-4 max-w-md mx-auto">{perfect ? verdictPerfect : verdictMixed}</p>
        <div className="mt-6 flex gap-3 justify-center flex-wrap">
          <Button variant="primary" onClick={() => { setIdx(0); setLog([]); setPicked(null); setCluesShown(1); }}>Otra vez</Button>
          <a href="/juegos"><Button variant="ghost-dark">Más juegos</Button></a>
        </div>
      </div>
    );
  }

  function pick(c: string) {
    if (picked) return;
    setPicked(c);
    const good = c === current.answer;
    const effectiveBase = current.clues
      ? Math.max(4, 20 - 4 * (cluesShown - 1))
      : (current.base ?? base);
    const res = registerAnswer(game, good, effectiveBase, combo);
    setCombo(res.newCombo);
    setLog((l) => [...l, good]);
    good ? sfx.correct() : sfx.wrong();
    if (good && res.newCombo >= 3) sfx.combo(res.newCombo);
  }
  function next() {
    setPicked(null);
    setCluesShown(1);
    setIdx((i) => i + 1);
  }

  const promptSize = current.long ? 'clamp(26px,3.8vw,40px)' : 'clamp(38px,6vw,64px)';

  return (
    <div>
      <ProgressDots states={states} stage={stage} />
      <div className={`${theme.bg} ${stage ? 'text-ink-50' : 'text-ink-900'} rounded-3xl p-[clamp(28px,5vw,48px)] mt-5`}>
        {current.tag && <div className={`text-[12px] font-semibold uppercase tracking-[.06em] ${theme.eyebrow} mb-4`}>{current.tag}</div>}
        <div className="font-serif leading-[1.08] font-serif-balance" style={{ fontSize: promptSize }}>{current.text}</div>
        {current.sub && <div className="text-[15px] mt-3 opacity-80">{current.sub}</div>}

        {current.clues && (
          <div className="mt-6 divide-y divide-ink-50/10">
            {current.clues.slice(0, cluesShown).map((t, i) => (
              <div key={i} className="py-3 flex items-baseline gap-3">
                <span className="font-serif text-brand-400 w-6 flex-none">{i + 1}</span>
                <span className="text-[16px]">{t}</span>
              </div>
            ))}
            {!picked && cluesShown < current.clues.length && (
              <div className="pt-3">
                <button onClick={() => setCluesShown((n) => n + 1)} className="text-[13px] px-4 py-2 rounded-full border border-ink-50/30 hover:bg-ink-50/10">
                  Otra pista · vale {Math.max(4, 20 - 4 * cluesShown)} XP
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[10px] mt-5">
        {current.choices.map((c) => {
          const isCorrect = c === current.answer; const isPicked = picked === c;
          const state = picked ? (isCorrect ? 'correct' : isPicked ? 'wrong' : 'dim') : 'idle';
          return <ChoiceButton key={c} stage={stage} state={state as any} disabled={!!picked} onClick={() => pick(c)}>{c}</ChoiceButton>;
        })}
      </div>

      {picked && (
        <div className="mt-6 flex items-center justify-between gap-4 flex-wrap">
          <div className={stage ? 'text-ink-50/80' : 'text-ink-700'}>
            {picked === current.answer ? 'Correcto.' : <>Era: <strong>{current.answer}</strong>.</>} {current.after && <span>· {current.after}</span>}
          </div>
          <Button variant={stage ? 'primary' : 'dark'} onClick={next}>Siguiente →</Button>
        </div>
      )}
    </div>
  );
}

'use client';
import { useEffect, useMemo, useState } from 'react';
import { QuizGame, QuizQuestion } from '@/components/QuizGame';

function shuffle<T>(a: T[]): T[] { const x = [...a]; for (let i = x.length-1; i>0; i--) { const j = Math.floor(Math.random()*(i+1)); [x[i], x[j]] = [x[j], x[i]]; } return x; }
function pick<T>(a: T[]): T { return a[Math.floor(Math.random() * a.length)]; }

function todayKey() { return new Date().toISOString().slice(0, 10); }

export function RetoClient({ pedagogos, scenes, lomloe, intervalos }: { pedagogos: any[]; scenes: any[]; lomloe: any[]; intervalos: any[] }) {
  const [done, setDone] = useState<null | { date: string; score?: number }>(null);
  useEffect(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('maestra:reto') : null;
    if (!raw) return;
    try { const d = JSON.parse(raw); if (d.date === todayKey()) setDone(d); } catch {}
  }, []);

  const questions = useMemo<QuizQuestion[]>(() => {
    // 1 aula
    const sc = pick(scenes);
    const correctSc = pedagogos.find((p) => p.id === sc.pedagogo)!;
    const aula: QuizQuestion = {
      tag: 'Aula', text: sc.text, long: true,
      choices: shuffle([correctSc.nombre, ...shuffle(pedagogos.filter((p) => p.id !== correctSc.id)).slice(0, 3).map((p) => p.nombre)]),
      answer: correctSc.nombre, base: 10, after: `Método: ${correctSc.metodo}.`,
    };
    // 1 mentira
    const mp = pick(pedagogos.filter((p) => (p.principios ?? []).length >= 3));
    const other = pick(pedagogos.filter((p) => p.id !== mp.id && (p.principios ?? []).length));
    const mentiraChoices = shuffle([...shuffle(mp.principios).slice(0, 2), other.principios[0]]);
    const mentira: QuizQuestion = { tag: `${mp.nombre} dice…`, text: '¿Cuál NO es suya?', long: true, choices: mentiraChoices, answer: other.principios[0], base: 8, after: `Eso es de ${other.nombre}.` };
    // 1 lomloe
    const lq = pick(lomloe);
    const lomQ: QuizQuestion = { tag: 'LOMLOE', text: lq.text, long: true, choices: shuffle(lq.choices), answer: lq.answer, base: 8, after: lq.after };
    // 1 tema
    const tp = pick(pedagogos.filter((p) => p.aparece_en_temas?.length));
    const temas = tp.aparece_en_temas as number[];
    const tAns = temas.length > 1 ? 'Temas 6 y 7' : temas[0] === 6 ? 'Tema 6' : 'Tema 7';
    const tQ: QuizQuestion = { tag: 'Temario', text: tp.nombre, sub: tp.metodo, choices: ['Tema 6', 'Tema 7', 'Temas 6 y 7'], answer: tAns, base: 6 };
    // 1 intervalo
    const iv = pick(intervalos);
    const ivQ: QuizQuestion = { tag: 'Intervalos', text: `¿Cuántos semitonos tiene una ${iv.nombre}?`, long: false, choices: shuffle([iv.semitonos, iv.semitonos + 1, iv.semitonos - 1, iv.semitonos + 2]).map(String), answer: String(iv.semitonos), base: 7, after: iv.ejemplo ? `Ej.: ${iv.ejemplo}.` : '' };
    return [aula, mentira, lomQ, tQ, ivQ];
  }, [pedagogos, scenes, lomloe, intervalos]);

  if (done) {
    return (
      <div className="bg-brand-700 text-white rounded-3xl p-10 text-center">
        <div className="text-[12px] font-semibold uppercase tracking-[.06em] text-brand-100 mb-2">Reto diario</div>
        <div className="font-serif text-[clamp(32px,5vw,48px)] leading-none">Reto de hoy completado.</div>
        <p className="text-white/80 mt-3">Mañana hay otro.</p>
        {done.score != null && <div className="mt-4 text-sm">Puntuación: <strong>{done.score}</strong> / 5</div>}
      </div>
    );
  }

  return (
    <QuizGame
      game="reto"
      questions={questions}
      base={7}
      verdictPerfect="Reto perfecto. Guarda la racha."
      verdictMixed="Reto completado. Mañana hay otro."
    />
  );
}

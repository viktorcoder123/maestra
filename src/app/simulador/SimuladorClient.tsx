'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface Tema { id: number; title: string; full_title: string; }

const PHASE_SECS = { outline: 10 * 60, body: 90 * 60 } as const;

export function SimuladorClient({ temas }: { temas: Tema[] }) {
  const sp = useSearchParams();
  const initialTema = sp.get('tema');
  const [tema, setTema] = useState<Tema | null>(initialTema ? temas.find((t) => t.id === Number(initialTema)) ?? null : null);
  const [runId, setRunId] = useState<number | null>(null);
  const [phase, setPhase] = useState<'select' | 'outline' | 'body' | 'result'>('select');
  const [outline, setOutline] = useState('');
  const [body, setBody] = useState('');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [coverage, setCoverage] = useState<any>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  const elapsed = startedAt ? Math.floor((now - startedAt) / 1000) : 0;
  const remain = phase === 'outline' ? PHASE_SECS.outline - elapsed
    : phase === 'body' ? PHASE_SECS.body - (elapsed - PHASE_SECS.outline)
    : 0;

  function fmt(s: number) {
    const sign = s < 0 ? '-' : '';
    const a = Math.abs(s);
    return `${sign}${Math.floor(a/60)}:${String(a%60).padStart(2,'0')}`;
  }

  async function startRandom() {
    const pick = temas[Math.floor(Math.random() * temas.length)];
    await start(pick);
  }

  async function start(t: Tema) {
    setTema(t);
    const res = await fetch('/api/simulator/start', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ tema_id: t.id }),
    });
    const { run } = await res.json();
    setRunId(run.id);
    setPhase('outline');
    setStartedAt(Date.now());
  }

  async function submit() {
    const res = await fetch('/api/simulator/submit', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ run_id: runId, outline, body, elapsed_seconds: elapsed }),
    });
    const { coverage } = await res.json();
    setCoverage(coverage);
    setPhase('result');
  }

  if (phase === 'select') {
    return (
      <div className="space-y-6">
        <div>
          <button onClick={startRandom} className="w-full md:w-auto px-6 py-4 rounded-full bg-brand-500 text-white font-medium hover:bg-brand-600">
            🎲 Elegir un tema al azar
          </button>
        </div>
        <div>
          <h3 className="font-serif text-lg mb-3">…o elige uno concreto</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {temas.map((t) => (
              <button key={t.id} onClick={() => start(t)}
                className="text-left border rounded-2xl p-4 bg-white hover:border-brand-400">
                <div className="text-xs uppercase text-brand-600">TEMA {t.id}</div>
                <div className="font-serif">{t.title}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'result' && coverage) {
    return <ResultView tema={tema!} coverage={coverage} elapsed={elapsed} onRetry={() => { setPhase('select'); setOutline(''); setBody(''); setCoverage(null); }} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur py-3 -mx-4 px-4 border-b z-10">
        <div>
          <div className="text-xs uppercase text-brand-600">TEMA {tema!.id} — {phase === 'outline' ? 'Esquema' : 'Desarrollo'}</div>
          <div className="font-serif text-sm">{tema!.title}</div>
        </div>
        <div className={`font-mono text-3xl tabular-nums ${remain < 60 ? 'text-red-600' : ''}`}>{fmt(remain)}</div>
      </div>

      {phase === 'outline' ? (
        <>
          <p className="text-sm text-ink-800/60">Escribe el esquema del tema con todas las secciones y subsecciones que recuerdes.</p>
          <textarea
            value={outline}
            onChange={(e) => setOutline(e.target.value)}
            placeholder={'1. Introducción - Justificación\n2. ...\n  2.1. ...'}
            className="w-full h-72 p-4 border rounded-xl font-mono text-sm"
          />
          <button onClick={() => setPhase('body')} className="px-5 py-3 rounded-full bg-ink-900 text-white hover:bg-ink-800">
            Pasar al desarrollo →
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-ink-800/60">Desarrolla el tema en prosa. Cita autores y normativa cuando corresponda.</p>
          <div className="text-xs text-ink-800/40">Esquema (referencia):</div>
          <pre className="whitespace-pre-wrap text-xs bg-ink-50 p-3 rounded-lg border">{outline}</pre>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Desarrollo del tema…"
            className="w-full h-[460px] p-4 border rounded-xl text-sm prose-tema"
          />
          <div className="flex items-center justify-between">
            <div className="text-xs text-ink-800/60">{body.trim().split(/\s+/).filter(Boolean).length} palabras</div>
            <button onClick={submit} className="px-5 py-3 rounded-full bg-brand-500 text-white hover:bg-brand-600">
              Entregar y ver cobertura →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ResultView({ tema, coverage, elapsed, onRetry }: any) {
  const topPct = Math.round(coverage.top_pct * 100);
  const subPct = Math.round(coverage.sub_pct * 100);
  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <div className="text-5xl mb-2">{topPct >= 80 ? '🏆' : topPct >= 50 ? '💪' : '📚'}</div>
        <div className="font-serif text-2xl">Informe de cobertura</div>
        <div className="text-sm text-ink-800/60">TEMA {tema.id} — {tema.title}</div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <Stat label="Secciones principales" value={`${topPct}%`} color={topPct >= 80 ? 'emerald' : topPct >= 50 ? 'amber' : 'red'} />
        <Stat label="Subsecciones" value={`${subPct}%`} color={subPct >= 60 ? 'emerald' : subPct >= 30 ? 'amber' : 'red'} />
        <Stat label="Palabras" value={coverage.word_count} />
      </div>

      <div className="border rounded-2xl bg-white p-5">
        <div className="font-serif text-lg mb-3">Secciones principales</div>
        <ul className="space-y-1 text-sm">
          {coverage.top_sections.map((s: any) => (
            <li key={s.number} className="flex items-center gap-2">
              <span className={s.covered ? 'text-emerald-600' : 'text-red-500'}>{s.covered ? '✓' : '✗'}</span>
              <span className="text-ink-800/50 w-8 text-right tabular-nums">{s.number}</span>
              <span className={s.covered ? '' : 'text-ink-800/60'}>{s.title}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="border rounded-2xl bg-white p-5">
        <div className="font-serif text-lg mb-3">Subsecciones</div>
        <ul className="grid md:grid-cols-2 gap-1 text-sm">
          {coverage.sub_sections.map((s: any) => (
            <li key={s.number} className="flex items-center gap-2">
              <span className={s.covered ? 'text-emerald-600' : 'text-red-500'}>{s.covered ? '✓' : '✗'}</span>
              <span className="text-ink-800/50 w-12 text-right tabular-nums">{s.number}</span>
              <span className={s.covered ? '' : 'text-ink-800/60'}>{s.title}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-3">
        <button onClick={onRetry} className="px-5 py-3 rounded-full border hover:border-brand-400">Otro tema</button>
        <a href={`/ensayos/nuevo?tema=${tema.id}`} className="px-5 py-3 rounded-full bg-brand-500 text-white hover:bg-brand-600">
          ✍️ Enviar este desarrollo para feedback
        </a>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: any; color?: string }) {
  const c = color === 'emerald' ? 'text-emerald-600' : color === 'amber' ? 'text-amber-600' : color === 'red' ? 'text-red-500' : '';
  return (
    <div className="border rounded-2xl bg-white p-4">
      <div className={`font-serif text-3xl ${c}`}>{value}</div>
      <div className="text-xs text-ink-800/60">{label}</div>
    </div>
  );
}

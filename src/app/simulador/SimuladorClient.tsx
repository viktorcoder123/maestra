'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/Button';

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

  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(id); }, []);

  const elapsed = startedAt ? Math.floor((now - startedAt) / 1000) : 0;
  const remain = phase === 'outline' ? PHASE_SECS.outline - elapsed
    : phase === 'body' ? PHASE_SECS.body - (elapsed - PHASE_SECS.outline) : 0;

  const fmt = (s: number) => `${s < 0 ? '−' : ''}${Math.floor(Math.abs(s)/60)}:${String(Math.abs(s)%60).padStart(2,'0')}`;

  async function start(t: Tema) {
    setTema(t);
    const res = await fetch('/api/simulator/start', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ tema_id: t.id }) });
    const { run } = await res.json();
    setRunId(run.id); setPhase('outline'); setStartedAt(Date.now());
  }
  async function startRandom() { await start(temas[Math.floor(Math.random() * temas.length)]); }
  async function submit() {
    const res = await fetch('/api/simulator/submit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ run_id: runId, outline, body, elapsed_seconds: elapsed }) });
    const { coverage } = await res.json();
    setCoverage(coverage); setPhase('result');
  }

  if (phase === 'select') {
    return (
      <div className="space-y-8">
        <div className="bg-ink-900 text-ink-50 rounded-3xl p-10">
          <h1 className="font-serif text-[clamp(44px,6vw,64px)] leading-none mb-4 font-serif-balance">Simulador de oposición</h1>
          <p className="text-ink-50/80 max-w-xl mb-6 leading-[1.6]">10 minutos de esquema y 90 de desarrollo. Al terminar, un informe de cobertura sobre el que trabajar.</p>
          <Button variant="primary" onClick={startRandom}>Tema al azar</Button>
        </div>
        <div>
          <h2 className="font-serif text-[22px] mb-4">…o elige uno concreto</h2>
          <div className="grid gap-[1px] bg-ink-200 border border-ink-200 rounded-2xl overflow-hidden">
            {temas.map((t) => (
              <button key={t.id} onClick={() => start(t)} className="flex items-baseline gap-4 bg-white hover:bg-ink-100 text-left px-5 py-4 transition-colors">
                <span className="font-serif text-[22px] text-brand-500 w-6">{t.id}</span>
                <span className="flex-1"><span className="block text-[17px] font-semibold">{t.title}</span></span>
                <span className="text-sm text-ink-500">→</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'result' && coverage) {
    return <ResultView tema={tema!} coverage={coverage} onRetry={() => { setPhase('select'); setOutline(''); setBody(''); setCoverage(null); }} />;
  }

  const total = phase === 'outline' ? PHASE_SECS.outline : PHASE_SECS.body;
  const pct = Math.max(0, Math.min(1, remain / total));

  return (
    <div>
      <div className="sticky top-2 z-10 bg-ink-900 text-ink-50 rounded-3xl p-4 sm:p-6 mb-5">
        <div className="flex items-center justify-between gap-3 sm:gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-semibold uppercase tracking-[.06em] text-brand-400">TEMA {tema!.id} · {phase === 'outline' ? 'Esquema' : 'Desarrollo'}</div>
            <div className="font-serif text-[clamp(16px,2.6vw,22px)] mt-1 leading-tight truncate">{tema!.title}</div>
          </div>
          <div className={`font-serif text-[clamp(36px,8vw,56px)] leading-none tabular-nums ${remain < 60 ? 'text-bad-dark' : ''}`}>{fmt(remain)}</div>
        </div>
        <div className="h-[5px] rounded-full bg-ink-50/20 overflow-hidden mt-4">
          <div className={`h-full ${remain < 60 ? 'bg-bad-dark' : 'bg-brand-500'} rounded-full`} style={{ width: `${pct * 100}%`, transition: 'width .5s linear' }} />
        </div>
      </div>

      {phase === 'outline' ? (
        <>
          <p className="text-sm text-ink-500 mb-3">Escribe el esquema del tema con todas las secciones y subsecciones que recuerdes.</p>
          <textarea value={outline} onChange={(e) => setOutline(e.target.value)}
            placeholder={'1. Introducción - Justificación\n2. ...\n  2.1. ...'}
            className="w-full h-[320px] p-4 border border-ink-200 rounded-2xl mono-outline" />
          <div className="mt-4"><Button variant="dark" onClick={() => setPhase('body')}>Pasar al desarrollo →</Button></div>
        </>
      ) : (
        <>
          <p className="text-sm text-ink-500 mb-3">Desarrolla el tema en prosa. Cita autores y normativa.</p>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-[1_1_240px] bg-ink-100 rounded-2xl p-4">
              <div className="text-[12px] text-ink-500 uppercase tracking-[.06em] font-semibold mb-2">Esquema</div>
              <pre className="whitespace-pre-wrap text-sm leading-[1.5]">{outline}</pre>
            </div>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Desarrollo del tema…"
              className="flex-[3_1_420px] h-[440px] p-5 border border-ink-200 rounded-2xl prose-essay" />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-ink-500">{body.trim().split(/\s+/).filter(Boolean).length} palabras</div>
            <Button variant="primary" onClick={submit}>Entregar y ver cobertura →</Button>
          </div>
        </>
      )}
    </div>
  );
}

function ResultView({ tema, coverage, onRetry }: any) {
  const topPct = Math.round(coverage.top_pct * 100);
  const subPct = Math.round(coverage.sub_pct * 100);
  const color = (p: number, hi: number, mid: number) => p >= hi ? 'text-sage-600' : p >= mid ? 'text-brand-600' : 'text-bad';
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-[clamp(40px,6vw,56px)] leading-none">Informe de cobertura</h1>
        <p className="text-ink-500 mt-2">TEMA {tema.id} — {tema.title}</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Secciones principales" value={`${topPct}%`} color={color(topPct, 80, 50)} />
        <Stat label="Subsecciones" value={`${subPct}%`} color={color(subPct, 60, 30)} />
        <Stat label="Palabras" value={coverage.word_count} />
      </div>
      <div className="bg-white border border-ink-200 rounded-2xl p-6" style={{ columns: '280px 2' }}>
        {coverage.top_sections.map((s: any) => (
          <div key={s.number} className="break-inside-avoid flex items-start gap-2 mb-2">
            <span className={`w-3 h-3 rounded-full mt-[6px] flex-none ${s.covered ? 'bg-sage-600' : 'border-2 border-bad'}`} />
            <span className={s.covered ? 'text-ink-900' : 'text-ink-500'}><strong>{s.number}.</strong> {s.title}</span>
          </div>
        ))}
        {coverage.sub_sections.map((s: any) => (
          <div key={s.number} className="break-inside-avoid pl-5 text-sm flex items-start gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full mt-[6px] flex-none ${s.covered ? 'bg-sage-600' : 'border border-bad'}`} />
            <span className={s.covered ? 'text-ink-700' : 'text-ink-500'}><strong>{s.number}.</strong> {s.title}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-3 flex-wrap">
        <Button variant="dark" onClick={onRetry}>Otro tema</Button>
        <a href={`/ensayos/nuevo?tema=${tema.id}`}><Button variant="primary">Enviar este desarrollo para feedback</Button></a>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: any; color?: string }) {
  return (
    <div className="border border-ink-200 rounded-2xl bg-white p-5">
      <div className={`font-serif text-[56px] leading-none ${color ?? ''}`}>{value}</div>
      <div className="text-xs text-ink-500 mt-2 uppercase tracking-[.06em] font-semibold">{label}</div>
    </div>
  );
}

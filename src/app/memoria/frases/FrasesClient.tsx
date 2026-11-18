'use client';
import { useEffect, useMemo, useState } from 'react';
import { sfx } from '@/lib/sfx';
import { registerAnswer } from '@/lib/game-state';
import { Pill } from '@/components/Pill';
import { Button } from '@/components/Button';
import { loadArtifact, saveArtifact } from '@/lib/memoria';

type L = { key: string; label: string; items: string[] };

function stripAccent(s: string) { return s.normalize('NFD').replace(/[̀-ͯ]/g, ''); }
function initial(s: string) { return stripAccent(s).replace(/[^A-Za-zÑñ]/g, '')[0]?.toUpperCase() ?? '?'; }

export function FrasesClient({ lists }: { lists: L[] }) {
  const [listIdx, setListIdx] = useState(0);
  const list = lists[listIdx];
  const acronym = useMemo(() => list.items.map((i) => initial(i)).join(''), [list]);

  const [phrase, setPhrase] = useState('');
  const [mode, setMode] = useState<'write' | 'train' | 'done'>('write');
  const [step, setStep] = useState(0);
  const [log, setLog] = useState<Array<{ picked: string; correct: boolean }>>([]);
  const [combo, setCombo] = useState(0);

  useEffect(() => {
    (async () => {
      const saved = await loadArtifact<{ phrase: string }>('frase', undefined, list.key);
      setPhrase(saved?.phrase ?? '');
      setMode('write'); setStep(0); setLog([]); setCombo(0);
    })();
  }, [listIdx, list.key]);

  const words = phrase.trim().split(/\s+/).filter(Boolean);
  const matchFlags = list.items.map((item, i) => {
    const w = words[i];
    if (!w) return false;
    return initial(w) === initial(item);
  });
  const matchCount = matchFlags.filter(Boolean).length;
  const extra = Math.max(0, words.length - list.items.length);
  const canSave = words.length === list.items.length && matchFlags.every(Boolean);

  function save() {
    saveArtifact('frase', { phrase }, undefined, list.key);
    setMode('train'); setStep(0); setLog([]); setCombo(0);
  }

  function pick(answer: string) {
    if (mode !== 'train') return;
    const correct = answer === list.items[step];
    const res = registerAnswer('frases', correct, 5, combo);
    setCombo(res.newCombo);
    correct ? sfx.correct() : sfx.wrong();
    const nextLog = [...log, { picked: answer, correct }];
    setLog(nextLog);
    if (step + 1 >= list.items.length) setTimeout(() => setMode('done'), 600);
    else setTimeout(() => setStep(step + 1), 500);
  }

  const answered = log.length;
  const hits = log.filter((l) => l.correct).length;
  const remaining = list.items.filter((it, i) => i >= answered || !log[i] ? i >= answered : false).filter((_, i) => i >= answered);
  // Choice pool: items not yet assigned in current session (i.e. not already answered), sorted alphabetically
  const used = new Set(log.map((l, i) => list.items[i]));
  const choices = [...list.items].filter((it) => !used.has(it)).sort((a, b) => a.localeCompare(b, 'es'));

  const currentWord = mode === 'train' ? words[step] : '';
  const currentItem = mode === 'train' ? list.items[step] : '';

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-5">
        {lists.map((l, i) => <Pill key={l.key} selected={listIdx === i} onClick={() => setListIdx(i)}>{l.label}</Pill>)}
      </div>

      <div className="bg-brand-50 border border-brand-100 rounded-3xl p-[clamp(22px,4vw,40px)]">
        <div className="text-[12px] font-semibold uppercase tracking-[.06em] text-brand-700 mb-4">{list.label} · {acronym}</div>

        <div className="flex flex-wrap gap-2 mb-5">
          {list.items.map((item, i) => {
            const letter = initial(item);
            const answered = mode === 'train' && i < log.length;
            const correct = answered && log[i].correct;
            const current = mode === 'train' && i === step;
            const show = (mode as string) !== 'train' || answered;
            const bg = answered ? (correct ? 'bg-sage-600 text-white border-sage-600' : 'bg-bad text-white border-bad') :
                       current ? 'bg-white border-brand-500' :
                       'bg-white border-ink-200';
            return (
              <div key={i} className={`min-w-[74px] px-3 pt-2 pb-[10px] rounded-[14px] border-2 ${bg}`}>
                <div className={`font-serif text-[42px] leading-none ${answered ? 'text-white' : 'text-brand-500'}`}>{letter}</div>
                <div className="text-[13px] font-medium mt-[6px] max-w-[150px]">{show ? item : '¿?'}</div>
              </div>
            );
          })}
        </div>

        {mode === 'write' && (
          <>
            <p className="text-[16px] text-ink-700 mb-4">Inventa una frase en la que cada palabra empiece por la inicial de cada elemento, en orden. Cuanto más absurda, mejor se recuerda.</p>
            <input value={phrase} onChange={(e) => setPhrase(e.target.value)}
              placeholder="Escribe tu frase: una palabra por inicial"
              className="w-full border border-ink-200 rounded-xl p-4 text-[18px]" />
            {phrase.length > 0 && (
              <div className="font-serif leading-[1.2] my-4 font-serif-balance" style={{ fontSize: 'clamp(26px,4.4vw,42px)' }}>
                {words.map((w, i) => {
                  const ok = matchFlags[i];
                  const col = ok ? '#4f6a4a' : '#c8402f';
                  return (
                    <span key={i} className="inline-block mr-[14px]">
                      <span style={{ color: col }}>{w[0]}</span>{w.slice(1)}
                    </span>
                  );
                })}
              </div>
            )}
            <div className="text-sm text-ink-500 mb-3">{matchCount} de {list.items.length} iniciales encajan{extra > 0 ? ' · sobran palabras' : ''}</div>
            <Button variant="primary" onClick={save} disabled={!canSave}>Guardar y entrenar</Button>
          </>
        )}

        {mode === 'train' && currentItem && (
          <>
            <div className="font-serif font-serif-balance mb-5" style={{ fontSize: 'clamp(28px,4.6vw,46px)', lineHeight: 1.2 }}>
              {words.map((w, i) => {
                const past = i < step;
                const cur = i === step;
                const future = i > step;
                const logEntry = log[i];
                const col = cur ? '#dd5f1b' : past && logEntry ? (logEntry.correct ? '#4f6a4a' : '#c8402f') : '#171717';
                return (
                  <span key={i} className={`inline-block mr-[14px] ${future ? 'opacity-40' : ''} ${cur ? 'border-b-[3px] border-brand-500' : ''}`}>
                    <span style={{ color: col }}>{w[0]}</span>{w.slice(1)}
                  </span>
                );
              })}
            </div>
            <p className="text-[16px] text-ink-700 mb-3">¿Qué elemento va con la palabra subrayada?</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {choices.map((c) => (
                <button key={c} onClick={() => pick(c)} className="px-4 py-[11px] rounded-xl bg-white border-[1.5px] border-ink-200 text-[15px] hover:border-brand-500">
                  {c}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-sm text-ink-500">Palabra {step + 1} de {list.items.length}</span>
              <Button variant="ghost" onClick={() => setMode('write')}>Cambiar frase</Button>
            </div>
          </>
        )}

        {mode === 'done' && (
          <>
            <p className="text-[16px] text-ink-700 mb-3">Recorrido terminado. Tu frase:</p>
            <div className="font-serif mb-5 font-serif-balance" style={{ fontSize: 'clamp(28px,4.6vw,46px)', lineHeight: 1.2 }}>{phrase}</div>
            <div className="text-sm text-ink-500 mb-4">{hits} de {list.items.length} a la primera</div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="primary" onClick={() => { setMode('train'); setStep(0); setLog([]); }}>Otra vez</Button>
              <Button variant="ghost" onClick={() => setMode('write')}>Cambiar frase</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

'use client';
import { useMemo, useState } from 'react';
import { geoNaturalEarth1, geoMercator, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import { sfx } from '@/lib/sfx';
import { registerAnswer, bumpCounter } from '@/lib/game-state';

type P = { id: string; nombre: string; pais: string; metodo: string; anios: string };

// ISO numeric ids
const ISO: Record<string, number[]> = {
  'Suiza': [756], 'Hungría': [348], 'Alemania': [276], 'Bélgica': [56], 'Bélgica/Suiza': [56, 756],
  'Francia': [250], 'Estados Unidos': [840], 'Japón': [392], 'España': [724],
  'Italia': [380], 'Canadá': [124], 'Argentina': [32],
};

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

export function MapaClient({ pedagogos, world }: { pedagogos: P[]; world: any }) {
  const countries: any = useMemo(() => feature(world, world.objects.countries), [world]);
  const [current, setCurrent] = useState<P>(() => pick(pedagogos));
  const [attempts, setAttempts] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [combo, setCombo] = useState(0);
  const [score, setScore] = useState({ good: 0, bad: 0 });

  const correctIds = ISO[current.pais] ?? [];

  function next() {
    const n = pick(pedagogos.filter((p) => p.id !== current.id));
    setCurrent(n); setPicked(null); setAttempts(0);
  }

  function choose(id: number) {
    if (picked !== null) return;
    const correct = correctIds.includes(id);
    setPicked(id);
    if (correct) {
      const base = attempts === 0 ? 15 : 7;
      const res = registerAnswer('mapa', true, base, combo);
      setCombo(res.newCombo);
      setScore((s) => ({ ...s, good: s.good + 1 }));
      sfx.correct();
      if (res.newCombo >= 3) sfx.combo(res.newCombo);
      bumpCounter('mapa_hits');
      setTimeout(next, 1200);
    } else if (attempts >= 1) {
      const res = registerAnswer('mapa', false, 0, combo);
      setCombo(res.newCombo);
      setScore((s) => ({ ...s, bad: s.bad + 1 }));
      sfx.wrong();
      setTimeout(next, 1600);
    } else {
      sfx.wrong();
      setAttempts(1);
      setTimeout(() => setPicked(null), 500);
    }
  }

  return (
    <div>
      <div className="bg-stage text-ink-50 rounded-t-3xl p-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[13px] font-semibold uppercase tracking-[.06em] text-brand-400">¿De dónde es?</div>
          <div className="font-serif text-[clamp(34px,5vw,54px)] leading-none mt-2">{current.nombre}</div>
          <div className="text-sm text-ink-50/70 mt-2">{current.metodo} · {current.anios}</div>
        </div>
        <div className="text-sm text-ink-50/80">
          <span className="font-serif text-[36px] leading-none">{score.good}</span> aciertos · <span className="font-serif text-[36px] leading-none">{score.bad}</span> fallos
          {attempts > 0 && <div className="text-brand-400 text-xs mt-1">Segundo intento</div>}
        </div>
      </div>

      <div className="bg-sage-100 rounded-b-3xl p-4 grid gap-4 md:grid-cols-[3fr_2fr]">
        <MapView projection={geoNaturalEarth1()} countries={countries.features} correctIds={correctIds} picked={picked} onPick={choose} label="Mundo" />
        <MapView projection={geoMercator().fitExtent([[0,0], [500, 400]], { type: 'FeatureCollection', features: countries.features.filter((f: any) => {
          const n = Number(f.id); return n !== 10 && n !== 260 && n !== 304 && n !== 334; // drop Antarctica fragments
        }).filter((f: any) => {
          // rough Europe-only clip via bbox
          try {
            const [x0, y0, x1, y1] = geoPath(geoMercator()).bounds(f) as any;
            return x1 > -20 && x0 < 60 && y1 > 30 && y0 < 75;
          } catch { return false; }
        }) } as any)} countries={countries.features} correctIds={correctIds} picked={picked} onPick={choose} label="Europa" clipEurope />
      </div>
    </div>
  );
}

function MapView({ projection, countries, correctIds, picked, onPick, label, clipEurope }: any) {
  const path = useMemo(() => geoPath(projection), [projection]);
  // compute viewBox from projection (if fitted) or use defaults
  const view = clipEurope ? '0 0 500 400' : '0 0 960 500';
  const proj = useMemo(() => clipEurope ? projection : projection.fitExtent([[0,0], [960, 500]], { type: 'Sphere' }), [projection, clipEurope]);
  const pathGen = useMemo(() => geoPath(proj), [proj]);
  const antarctica = 10;
  return (
    <div className="relative rounded-2xl bg-sage-100 overflow-hidden">
      <div className="absolute left-3 top-2 text-[11px] font-semibold uppercase tracking-[.06em] text-sage-700 z-10">{label}</div>
      <svg viewBox={view} className="w-full h-auto" style={{ aspectRatio: clipEurope ? '5/4' : '96/50' }}>
        {countries.filter((c: any) => Number(c.id) !== antarctica).map((c: any) => {
          const id = Number(c.id);
          const isCorrect = correctIds.includes(id);
          const isPicked = id === picked;
          let fill = '#dfe7dc';
          if (picked !== null) {
            if (isCorrect) fill = '#4f6a4a';
            else if (isPicked) fill = '#c8402f';
          }
          return (
            <path key={c.id} d={pathGen(c) ?? ''} fill={fill} stroke="#fafaf7" strokeWidth={0.6}
              onClick={() => onPick(id)}
              style={{ cursor: picked === null ? 'pointer' : 'default', transition: 'fill .15s' }}
              onMouseEnter={(e) => { if (picked === null) (e.target as SVGPathElement).setAttribute('fill', '#fde3d4'); }}
              onMouseLeave={(e) => { if (picked === null) (e.target as SVGPathElement).setAttribute('fill', '#dfe7dc'); }}
            />
          );
        })}
      </svg>
    </div>
  );
}

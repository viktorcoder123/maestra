import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase-server';
import { HoyStats } from './HoyStats';
import { Button } from '@/components/Button';

export const dynamic = 'force-dynamic';

async function getStats() {
  const sb = supabaseAdmin();
  const defaults = {
    temasCount: 0, cardsCount: 0, dueCount: 0, streak: 0, reviewsByDay: [] as number[],
    reviewsToday: 0, essaysPending: 0, configured: true,
  };
  try {
    const [{ count: t }, { count: c }, { count: d }, { count: ep }] = await Promise.all([
      sb.from('temas').select('*', { count: 'exact', head: true }),
      sb.from('cards').select('*', { count: 'exact', head: true }),
      sb.from('card_state').select('*', { count: 'exact', head: true }).lte('due_at', new Date().toISOString()),
      sb.from('essays').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
    ]);
    defaults.temasCount = t ?? 0;
    defaults.cardsCount = c ?? 0;
    defaults.dueCount = d ?? 0;
    defaults.essaysPending = ep ?? 0;

    const start = new Date(); start.setHours(0, 0, 0, 0);
    const { count: todayN } = await sb.from('reviews').select('*', { count: 'exact', head: true }).gte('reviewed_at', start.toISOString());
    defaults.reviewsToday = todayN ?? 0;

    const { data: rows } = await sb.from('reviews')
      .select('reviewed_at')
      .gte('reviewed_at', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString())
      .order('reviewed_at', { ascending: false });

    const perDay = new Map<string, number>();
    for (const r of rows ?? []) {
      const k = new Date(r.reviewed_at).toDateString();
      perDay.set(k, (perDay.get(k) ?? 0) + 1);
    }
    const today = new Date();
    let streak = 0;
    for (let i = 0; i < 60; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      if (perDay.has(d.toDateString())) streak++;
      else if (i > 0) break;
    }
    defaults.streak = streak;
    const last7: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      last7.push(perDay.get(d.toDateString()) ?? 0);
    }
    defaults.reviewsByDay = last7;
  } catch { defaults.configured = false; }

  return defaults;
}

export default async function Home() {
  const s = await getStats();

  if (!s.configured || s.temasCount === 0) {
    return (
      <div className="pt-6 max-w-3xl">
        <section className="bg-ink-900 text-ink-50 rounded-3xl p-10 relative overflow-hidden min-h-[280px]">
          <div className="absolute inset-x-0 bottom-11 flex flex-col gap-[14px] opacity-[.14]">
            {Array.from({ length: 5 }).map((_, i) => <span key={i} className="h-px bg-ink-50" />)}
          </div>
          <div className="text-xs uppercase tracking-[.08em] text-brand-400 font-semibold mb-4">Antes de empezar</div>
          <h1 className="font-serif text-[clamp(40px,6vw,64px)] leading-none mb-5">Configura la base de datos para cargar el temario.</h1>
          <Link href="/setup"><Button variant="primary">Ir al asistente</Button></Link>
        </section>
      </div>
    );
  }

  const heroText = s.dueCount > 0
    ? `Tienes ${s.dueCount} tarjetas listas para repasar.`
    : 'Todo repasado por ahora.';

  const today = [
    { n: 1, href: '/repaso',      title: 'Repaso inteligente',       desc: 'Tarjetas priorizadas por lo que te cuesta más.', meta: `${s.dueCount} pendientes` },
    { n: 2, href: '/simulador',   title: 'Simulador de oposición',   desc: 'Reloj real y un informe de cobertura al terminar.', meta: '10 + 90 min' },
    { n: 3, href: '/temas',       title: 'Mapa del temario',         desc: 'La estructura del temario en árbol plegable.', meta: `${s.temasCount} temas` },
    { n: 4, href: '/juegos',      title: 'Juegos',                    desc: 'Cinco minutos cuentan como repaso.', meta: '23 juegos' },
    { n: 5, href: '/oido',        title: 'Educación del oído',       desc: 'Intervalos, modos y texturas con audio.', meta: 'Tema 2 · 5' },
    { n: 6, href: '/ensayos',     title: 'Ensayos con revisión',     desc: 'Escribe y recibe feedback revisado.', meta: s.essaysPending > 0 ? `${s.essaysPending} en revisión` : 'Listo' },
  ];

  return (
    <div className="space-y-11">
      <section className="grid [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))] gap-5 items-stretch">
        <div className="bg-ink-900 text-ink-50 rounded-3xl p-9 flex flex-col gap-[18px] relative overflow-hidden min-h-[280px]">
          <div className="absolute inset-x-0 bottom-11 flex flex-col gap-[14px] opacity-[.14]">
            {Array.from({ length: 5 }).map((_, i) => <span key={i} className="h-px bg-ink-50" />)}
          </div>
          <div className="text-[13px] font-semibold uppercase tracking-[.08em] text-brand-400">Hoy</div>
          <h1 className="font-serif text-[clamp(40px,6vw,64px)] leading-none m-0 font-serif-balance">{heroText}</h1>
          <div className="mt-auto flex gap-[10px] flex-wrap relative">
            <Link href="/repaso"><Button variant="primary">Empezar repaso</Button></Link>
            <Link href="/juegos"><Button variant="ghost-dark">Jugar cinco minutos</Button></Link>
          </div>
        </div>
        <HoyStats streak={s.streak} reviewsByDay={s.reviewsByDay} reviewsToday={s.reviewsToday} />
      </section>

      <section>
        <h2 className="font-serif text-[30px] mb-2">Hoy puedes…</h2>
        <div className="grid [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))] gap-x-7">
          {today.map((t) => (
            <Link key={t.n} href={t.href} className="group flex items-baseline gap-4 text-left border-t border-ink-200 py-[18px] px-1 hover:bg-ink-100 transition-colors">
              <span className="font-serif text-[22px] text-brand-600 w-6 flex-none">{t.n}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-[17px] font-semibold text-ink-900">{t.title}</span>
                <span className="block text-sm text-ink-500 mt-[3px] leading-[1.45]">{t.desc}</span>
              </span>
              <span className="text-[13px] text-ink-500 flex-none">{t.meta}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

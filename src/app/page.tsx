import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase-server';
import { Card } from '@/components/Card';
import { XPWidget } from '@/components/XPWidget';

export const dynamic = 'force-dynamic';

async function getStats() {
  const sb = supabaseAdmin();

  let temasCount = 0;
  let cardsCount = 0;
  let dueCount = 0;
  let streak = 0;
  let reviewsToday = 0;
  let essaysPending = 0;
  let configured = true;

  try {
    const [{ count: t }, { count: c }, { count: d }, { count: ep }] = await Promise.all([
      sb.from('temas').select('*', { count: 'exact', head: true }),
      sb.from('cards').select('*', { count: 'exact', head: true }),
      sb.from('card_state').select('*', { count: 'exact', head: true }).lte('due_at', new Date().toISOString()),
      sb.from('essays').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
    ]);
    temasCount = t ?? 0;
    cardsCount = c ?? 0;
    dueCount = d ?? 0;
    essaysPending = ep ?? 0;

    const start = new Date(); start.setHours(0, 0, 0, 0);
    const { count: todayN } = await sb.from('reviews').select('*', { count: 'exact', head: true })
      .gte('reviewed_at', start.toISOString());
    reviewsToday = todayN ?? 0;

    // streak = consecutive days (up to 60) with ≥1 review ending today
    const { data: rows } = await sb.from('reviews')
      .select('reviewed_at')
      .gte('reviewed_at', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString())
      .order('reviewed_at', { ascending: false });
    const daySet = new Set<string>();
    for (const r of rows ?? []) daySet.add(new Date(r.reviewed_at).toDateString());
    const today = new Date();
    for (let i = 0; i < 60; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      if (daySet.has(d.toDateString())) streak++;
      else if (i > 0) break;
    }
  } catch (e: any) {
    configured = false;
  }

  return { temasCount, cardsCount, dueCount, streak, reviewsToday, essaysPending, configured };
}

export default async function Home() {
  const s = await getStats();

  if (!s.configured || s.temasCount === 0) {
    return (
      <div className="pt-12 max-w-2xl mx-auto">
        <h1 className="font-serif text-3xl mb-4">¡Bienvenida! 🎼</h1>
        <p className="text-ink-800/70 mb-6">
          Antes de empezar hay que configurar la base de datos y cargar los temas.
          Sigue el <Link href="/setup" className="text-brand-600 underline">asistente de configuración</Link>.
        </p>
        <Link href="/setup" className="inline-block px-5 py-3 rounded-full bg-brand-500 text-white hover:bg-brand-600">
          Ir al asistente →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="pt-4">
        <h1 className="font-serif text-4xl tracking-tight mb-1">Hola 🎵</h1>
        <p className="text-ink-800/70">
          {s.dueCount > 0 ? (
            <>Tienes <strong>{s.dueCount}</strong> tarjetas listas para repasar.</>
          ) : (
            <>Todo repasado por ahora. Buen momento para un simulador o un juego.</>
          )}
        </p>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile icon="🔥" value={s.streak} label={s.streak === 1 ? 'día de racha' : 'días de racha'} highlight />
        <StatTile icon="📚" value={s.temasCount} label="temas cargados" />
        <StatTile icon="🎴" value={s.cardsCount} label="tarjetas" />
        <StatTile icon="⏰" value={s.dueCount} label="pendientes hoy" />
      </section>

      <section>
        <XPWidget />
      </section>

      <section>
        <h2 className="font-serif text-xl mb-3">Hoy puedes…</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Card href="/repaso" accent="brand" icon="🧠"
            title="Repaso inteligente"
            description="Tarjetas con repetición espaciada, priorizando lo que te cuesta más."
            footer={`${s.dueCount} pendientes · ${s.reviewsToday} hoy`}
          />
          <Card href="/simulador" accent="sage" icon="⏱️"
            title="Simulador de oposición"
            description="Elige un tema al azar y escribe su esquema con el reloj corriendo."
          />
          <Card href="/temas" accent="ink" icon="📚"
            title="Mapa del temario"
            description="Vista en árbol de cada tema para entrenar la estructura de memoria."
          />
          <Card href="/juegos" accent="brand" icon="🎮"
            title="¿Quién lo dijo?"
            description="Mini-juegos sobre pedagogos del s.XX, texturas y formas."
          />
          <Card href="/oido" accent="sage" icon="🎧"
            title="Educación del oído"
            description="Intervalos, modos y texturas. Puro Tema 2 y Tema 5."
          />
          <Card href="/ensayos" accent="ink" icon="✍️"
            title="Ensayos con revisión"
            description="Escribe un tema completo. Marido + Claude te devolverán feedback."
            footer={s.essaysPending > 0 ? `${s.essaysPending} esperando revisión` : 'Listo cuando quieras'}
          />
        </div>
      </section>
    </div>
  );
}

function StatTile({ icon, value, label, highlight }: { icon: string; value: number; label: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 border ${highlight ? 'border-brand-400 bg-brand-50' : 'border-ink-200 bg-white'}`}>
      <div className={`text-2xl ${highlight ? 'flame-pulse' : ''}`}>{icon}</div>
      <div className="font-serif text-2xl tabular-nums">{value}</div>
      <div className="text-xs text-ink-800/60">{label}</div>
    </div>
  );
}

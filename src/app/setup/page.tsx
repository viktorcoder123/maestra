import fs from 'node:fs';
import path from 'node:path';

export default function Setup() {
  const sql = fs.readFileSync(path.join(process.cwd(), 'supabase', 'schema.sql'), 'utf-8');
  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      <h1 className="font-serif text-3xl">Configuración inicial</h1>
      <p className="text-ink-800/70">Solo hace falta una vez. Tres pasos.</p>

      <Step n={1} title="Crear las tablas en Supabase">
        <p>Abre el <a className="underline text-brand-600" target="_blank" rel="noreferrer"
          href="https://supabase.com/dashboard/project/wmsjnpxrozwpimdjlfwn/sql/new">SQL editor de Supabase</a> y
          pega todo esto:</p>
        <details className="mt-3">
          <summary className="cursor-pointer text-sm underline">Ver SQL (ya está en <code>supabase/schema.sql</code>)</summary>
          <pre className="mt-2 text-xs bg-ink-100 p-3 rounded-xl overflow-auto max-h-80">{sql}</pre>
        </details>
      </Step>

      <Step n={2} title="Cargar los PDFs">
        <p>Desde la carpeta <code>maestra/</code>, en terminal:</p>
        <pre className="mt-2 bg-ink-900 text-ink-50 text-sm p-3 rounded-xl">pnpm run setup</pre>
        <p className="text-sm text-ink-800/60 mt-2">
          Esto parsea los 6 PDFs y genera ~200 tarjetas automáticas + pedagogos + audio.
        </p>
      </Step>

      <Step n={3} title="¡Listo!">
        <p>Vuelve a <a className="underline text-brand-600" href="/">Inicio</a>.</p>
      </Step>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="border rounded-2xl p-5 bg-white">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-full bg-brand-500 text-white grid place-items-center font-semibold">{n}</div>
        <div className="font-serif text-lg">{title}</div>
      </div>
      <div className="text-ink-800/80 space-y-2">{children}</div>
    </div>
  );
}

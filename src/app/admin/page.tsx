import { AdminClient } from './AdminClient';

export const dynamic = 'force-dynamic';

export default function AdminPage() {
  return (
    <div className="py-6">
      <h1 className="font-serif text-3xl mb-1">Panel de revisor</h1>
      <p className="text-ink-800/70 mb-6 text-sm">
        Copia el ensayo a tu chat con Claude, pega aquí la respuesta, publica. Ella lo verá al refrescar.
      </p>
      <AdminClient />
    </div>
  );
}

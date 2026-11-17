import { GameShell } from '@/components/GameShell';
import { IntervaloClient } from './IntervaloClient';

export default function Page() {
  return (
    <GameShell title="Intervalo en el pentagrama" tag="Tema 2 · Oído">
      <IntervaloClient />
    </GameShell>
  );
}

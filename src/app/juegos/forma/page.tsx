import { GameShell } from '@/components/GameShell';
import { FormaClient } from './FormaClient';

export default function Page() {
  return (
    <GameShell title="Arma la forma" tag="Formas">
      <FormaClient />
    </GameShell>
  );
}

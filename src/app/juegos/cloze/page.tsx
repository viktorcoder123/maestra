import { GameShell } from '@/components/GameShell';
import { ClozeClient } from './ClozeClient';

export default function Page() {
  return (
    <GameShell title="Rellena el hueco" tag="Temario">
      <ClozeClient />
    </GameShell>
  );
}

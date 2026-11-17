import { GameShell } from '@/components/GameShell';
import { DictritmoClient } from './DictritmoClient';

export default function Page() {
  return (
    <GameShell title="Dictado rítmico" tag="Tema 6 · Ritmo">
      <DictritmoClient />
    </GameShell>
  );
}

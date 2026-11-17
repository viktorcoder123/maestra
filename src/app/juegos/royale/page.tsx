import { GameShell } from '@/components/GameShell';
import { RoyaleClient } from './RoyaleClient';

export default function Page() {
  return (
    <GameShell title="Oposición Royale" tag="Supervivencia">
      <RoyaleClient />
    </GameShell>
  );
}

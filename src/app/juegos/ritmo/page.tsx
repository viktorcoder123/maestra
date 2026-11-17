import { GameShell } from '@/components/GameShell';
import { RitmoClient } from './RitmoClient';

export default function Page() {
  return (
    <GameShell title="Ritmo-Tap" tag="Tema 6 · Ritmo">
      <RitmoClient />
    </GameShell>
  );
}

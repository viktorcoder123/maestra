import { GameShell } from '@/components/GameShell';
import { DictadoClient } from './DictadoClient';

export default function Page() {
  return (
    <GameShell title="Dicta la melodía" tag="Tema 2 · Oído">
      <DictadoClient />
    </GameShell>
  );
}

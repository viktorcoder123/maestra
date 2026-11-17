import { GameShell } from '@/components/GameShell';
import { QuienLoDijoClient } from './QuienLoDijoClient';

export default function Page() {
  return (
    <GameShell title="¿Quién lo dijo?" tag="Tema 7 · Citas">
      <QuienLoDijoClient />
    </GameShell>
  );
}

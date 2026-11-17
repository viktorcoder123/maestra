import fs from 'node:fs';
import path from 'node:path';
import { GameShell } from '@/components/GameShell';
import { EscalaClient } from './EscalaClient';

export default function Page() {
  const audio = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'audio-bank.json'), 'utf-8'));
  const modes = audio.modos.filter((m: any) => m.intervalos.length === 8).slice(0, 8);
  return (
    <GameShell title="Construye la escala" tag="Tema 2 · Escalas">
      <EscalaClient modes={modes} />
    </GameShell>
  );
}

import fs from 'node:fs';
import path from 'node:path';
import { GameShell } from '@/components/GameShell';
import { TimelineClient } from './TimelineClient';

export default function Page() {
  const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'pedagogos.json'), 'utf-8'));
  return (
    <GameShell title="Línea del tiempo" tag="Tema 7 · Pedagogos">
      <TimelineClient pedagogos={raw.pedagogos} />
    </GameShell>
  );
}

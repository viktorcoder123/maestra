import fs from 'node:fs';
import path from 'node:path';
import { GameShell } from '@/components/GameShell';
import { MemoryClient } from './MemoryClient';

export default function Page() {
  const peds = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'pedagogos.json'), 'utf-8')).pedagogos;
  return (
    <GameShell title="Memory de parejas" tag="Tema 7">
      <MemoryClient pedagogos={peds} />
    </GameShell>
  );
}

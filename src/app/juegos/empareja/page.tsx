import fs from 'node:fs';
import path from 'node:path';
import { GameShell } from '@/components/GameShell';
import { EmparejaClient } from './EmparejaClient';

export default function Page() {
  const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'pedagogos.json'), 'utf-8'));
  return (
    <GameShell title="Empareja método" tag="Tema 7 · Métodos">
      <EmparejaClient pedagogos={raw.pedagogos} />
    </GameShell>
  );
}

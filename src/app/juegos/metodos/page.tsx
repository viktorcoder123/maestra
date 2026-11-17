import fs from 'node:fs';
import path from 'node:path';
import { GameShell } from '@/components/GameShell';
import { RelampagoClient } from './RelampagoClient';

export default function Page() {
  const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'pedagogos.json'), 'utf-8'));
  return (
    <GameShell title="Método → autor relámpago" tag="Contrarreloj">
      <RelampagoClient pedagogos={raw.pedagogos} />
    </GameShell>
  );
}

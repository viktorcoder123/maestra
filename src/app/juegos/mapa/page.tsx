import fs from 'node:fs';
import path from 'node:path';
import { GameShell } from '@/components/GameShell';
import { MapaClient } from './MapaClient';

export default function Page() {
  const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'pedagogos.json'), 'utf-8'));
  const countries = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'node_modules', 'world-atlas', 'countries-110m.json'), 'utf-8'),
  );
  return (
    <GameShell title="Atlas pedagógico" tag="Tema 7 · Geografía">
      <MapaClient pedagogos={raw.pedagogos} world={countries} />
    </GameShell>
  );
}

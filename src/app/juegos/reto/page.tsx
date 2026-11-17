import fs from 'node:fs';
import path from 'node:path';
import { GameShell } from '@/components/GameShell';
import { RetoClient } from './RetoClient';

export default function Page() {
  const pedagogos = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'pedagogos.json'), 'utf-8')).pedagogos;
  const scenes = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'aula-scenes.json'), 'utf-8')).scenes;
  const lom = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'lomloe-bank.json'), 'utf-8')).questions;
  const audio = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'audio-bank.json'), 'utf-8'));

  return (
    <GameShell title="Reto diario" tag="Una vez al día">
      <RetoClient pedagogos={pedagogos} scenes={scenes} lomloe={lom} intervalos={audio.intervalos} />
    </GameShell>
  );
}

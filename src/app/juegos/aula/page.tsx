import fs from 'node:fs';
import path from 'node:path';
import { GameShell } from '@/components/GameShell';
import { QuizGame, QuizQuestion } from '@/components/QuizGame';

function shuffle<T>(a: T[]): T[] { const x = [...a]; for (let i = x.length-1; i>0; i--) { const j = Math.floor(Math.random()*(i+1)); [x[i], x[j]] = [x[j], x[i]]; } return x; }

export default function Page() {
  const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'pedagogos.json'), 'utf-8'));
  const scenes = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'aula-scenes.json'), 'utf-8')).scenes;
  const pedagogos: any[] = raw.pedagogos;
  const byId = Object.fromEntries(pedagogos.map((p) => [p.id, p]));

  const picks = shuffle(scenes).slice(0, 6);
  const questions: QuizQuestion[] = picks.map((s: any) => {
    const correct = byId[s.pedagogo];
    const wrongs = shuffle(pedagogos.filter((p) => p.id !== s.pedagogo)).slice(0, 3).map((p) => p.nombre);
    const choices = shuffle([...wrongs, correct.nombre]);
    return {
      tag: 'Escena de aula',
      text: s.text,
      long: true,
      choices,
      answer: correct.nombre,
      base: 10,
      after: `Método: ${correct.metodo}.`,
    };
  });

  return (
    <GameShell title="Aula en práctica" tag="Práctica">
      <QuizGame game="aula" questions={questions} base={10} />
    </GameShell>
  );
}

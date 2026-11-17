import fs from 'node:fs';
import path from 'node:path';
import { GameShell } from '@/components/GameShell';
import { QuizGame, QuizQuestion } from '@/components/QuizGame';

function shuffle<T>(a: T[]): T[] { const x = [...a]; for (let i = x.length-1; i>0; i--) { const j = Math.floor(Math.random()*(i+1)); [x[i], x[j]] = [x[j], x[i]]; } return x; }

export default function Page() {
  const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'pedagogos.json'), 'utf-8'));
  const pedagogos: any[] = raw.pedagogos;
  const choices = ['Tema 6', 'Tema 7', 'Temas 6 y 7'];
  const picks = shuffle(pedagogos.filter((p) => p.aparece_en_temas?.length)).slice(0, 8);

  const questions: QuizQuestion[] = picks.map((p) => {
    const temas = p.aparece_en_temas as number[];
    const answer = temas.length > 1 ? 'Temas 6 y 7' : temas[0] === 6 ? 'Tema 6' : 'Tema 7';
    return {
      tag: 'Temario',
      text: p.nombre,
      sub: p.metodo,
      choices, answer,
      base: 6,
      after: temas.length > 1 ? 'Aparece tanto en Tema 6 (ritmo) como en Tema 7 (corrientes pedagógicas).' : `Aparece en Tema ${temas[0]}.`,
    };
  });

  return (
    <GameShell title="¿En qué tema sale?" tag="Temas 6 y 7">
      <QuizGame game="tema" questions={questions} base={6} />
    </GameShell>
  );
}

import fs from 'node:fs';
import path from 'node:path';
import { GameShell } from '@/components/GameShell';
import { QuizGame, QuizQuestion } from '@/components/QuizGame';

function shuffle<T>(a: T[]): T[] { const x = [...a]; for (let i = x.length-1; i>0; i--) { const j = Math.floor(Math.random()*(i+1)); [x[i], x[j]] = [x[j], x[i]]; } return x; }

export default function Page() {
  const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'pedagogos.json'), 'utf-8'));
  const pedagogos: any[] = raw.pedagogos.filter((p: any) => (p.principios ?? []).length >= 3);

  const rounds = shuffle(pedagogos).slice(0, 6);
  const questions: QuizQuestion[] = rounds.map((p) => {
    const principios = shuffle(p.principios as string[]).slice(0, 2);
    const others = pedagogos.filter((o: any) => o.id !== p.id);
    const mole = shuffle(others)[0];
    const outsider = shuffle(mole.principios as string[])[0];
    const choices = shuffle([...principios, outsider]);
    return {
      tag: `${p.nombre} dice…`,
      text: '¿Cuál NO es suya?',
      long: true,
      choices,
      answer: outsider,
      base: 8,
      after: `Eso es de ${mole.nombre}.`,
    };
  });

  return (
    <GameShell title="Dos verdades y una mentira" tag="Tema 7">
      <QuizGame game="mentira" questions={questions} base={8} />
    </GameShell>
  );
}

import fs from 'node:fs';
import path from 'node:path';
import { GameShell } from '@/components/GameShell';
import { QuizGame, QuizQuestion } from '@/components/QuizGame';

function shuffle<T>(a: T[]): T[] { const x = [...a]; for (let i = x.length-1; i>0; i--) { const j = Math.floor(Math.random()*(i+1)); [x[i], x[j]] = [x[j], x[i]]; } return x; }

export default function Page() {
  const bank = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'lomloe-bank.json'), 'utf-8'));
  const picks = shuffle(bank.questions).slice(0, 6);
  const questions: QuizQuestion[] = picks.map((q: any) => ({
    tag: 'LOMLOE',
    text: q.text,
    long: true,
    choices: shuffle(q.choices),
    answer: q.answer,
    base: 8,
    after: q.after,
  }));

  return (
    <GameShell title="LOMLOE exprés" tag="Normativa">
      <QuizGame game="lomloe" questions={questions} base={8} />
    </GameShell>
  );
}

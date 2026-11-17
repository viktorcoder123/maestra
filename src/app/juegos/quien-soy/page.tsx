import fs from 'node:fs';
import path from 'node:path';
import { GameShell } from '@/components/GameShell';
import { QuizGame, QuizQuestion } from '@/components/QuizGame';

function shuffle<T>(a: T[]): T[] { const x = [...a]; for (let i = x.length-1; i>0; i--) { const j = Math.floor(Math.random()*(i+1)); [x[i], x[j]] = [x[j], x[i]]; } return x; }

function birthDecade(a: string) { const m = a.match(/^(\d{4})/); return m ? Math.floor(parseInt(m[1],10)/10)*10 : 1900; }

export default function Page() {
  const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'pedagogos.json'), 'utf-8'));
  const pedagogos: any[] = raw.pedagogos.filter((p: any) => (p.palabras_clave ?? []).length >= 2);
  const picks = shuffle(pedagogos).slice(0, 5);

  const questions: QuizQuestion[] = picks.map((p) => {
    const wrongs = shuffle(pedagogos.filter((o) => o.id !== p.id)).slice(0, 3).map((o) => o.nombre);
    return {
      tag: '¿Quién soy?',
      text: '¿Quién es?',
      long: true,
      clues: [
        `Nació en los ${birthDecade(p.anios)}s.`,
        `País: ${p.pais}.`,
        `Palabra clave: ${p.palabras_clave[1] ?? p.palabras_clave[0]}.`,
        `Palabra clave: ${p.palabras_clave[0]}.`,
        `Método: ${p.metodo}.`,
      ],
      choices: shuffle([...wrongs, p.nombre]),
      answer: p.nombre,
      base: 20,
      after: `Método: ${p.metodo}.`,
    };
  });

  return (
    <GameShell title="¿Quién soy?" tag="Tema 7">
      <QuizGame game="quien-soy" questions={questions} base={20} />
    </GameShell>
  );
}

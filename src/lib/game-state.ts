'use client';
// Lightweight gamification: XP, level, combo, achievements.
// Persists to localStorage so dashboard can read it.

const KEY = 'maestra:gamestate';

export type Achievement = {
  id: string;
  name: string;
  desc: string;
  icon: string;
  threshold: number; // xp or combo level required
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_blood',   name: 'Primera sangre',        desc: 'Primer acierto en un juego.',       icon: '',  threshold: 1 },
  { id: 'combo_5',       name: 'En racha',               desc: 'Cadena de 5 aciertos seguidos.',    icon: '',  threshold: 5 },
  { id: 'combo_10',      name: 'Imparable',              desc: 'Cadena de 10 aciertos seguidos.',  icon: '',  threshold: 10 },
  { id: 'xp_100',        name: 'Centenaria',             desc: '100 XP acumulados.',                icon: '',  threshold: 100 },
  { id: 'xp_500',        name: 'Media maratón',          desc: '500 XP acumulados.',                icon: '',  threshold: 500 },
  { id: 'xp_1000',       name: 'Maratonista',            desc: '1000 XP acumulados.',               icon: '',  threshold: 1000 },
  { id: 'survivor',      name: 'Superviviente',          desc: 'Supera 10 rondas en Royale.',      icon: '',  threshold: 10 },
  { id: 'pentagrama',    name: 'Dictado perfecto',       desc: 'Dictado de 7 notas sin fallos.',   icon: '',  threshold: 7 },
  { id: 'cartografa',    name: 'Cartógrafa',             desc: '15 países acertados en el mapa.',   icon: '',  threshold: 15 },
  { id: 'cronista',      name: 'Cronista del siglo XX',  desc: 'Línea del tiempo completada.',      icon: '',  threshold: 14 },
];

export type GameState = {
  xp: number;
  bestCombo: number;
  totalCorrect: number;
  totalWrong: number;
  perGame: Record<string, { xp: number; best: number; plays: number }>;
  achievements: string[];
  counters: Record<string, number>; // per-achievement counters (e.g. "royale_rounds")
};

function empty(): GameState {
  return { xp: 0, bestCombo: 0, totalCorrect: 0, totalWrong: 0, perGame: {}, achievements: [], counters: {} };
}

export function load(): GameState {
  if (typeof window === 'undefined') return empty();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    return { ...empty(), ...JSON.parse(raw) };
  } catch { return empty(); }
}

export function save(s: GameState, detail?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent('maestra:gamestate', { detail }));
}

export function level(xp: number): { level: number; progress: number; next: number } {
  // Levels grow: 50, 150, 300, 500, 750, 1050, …
  // threshold(n) = n*(n+1)*25
  let lvl = 1;
  while (lvl * (lvl + 1) * 25 <= xp) lvl++;
  const prev = (lvl - 1) * lvl * 25;
  const next = lvl * (lvl + 1) * 25;
  return { level: lvl, progress: (xp - prev) / (next - prev), next: next - xp };
}

export interface RewardResult {
  xpGained: number;
  newCombo: number;
  levelUp: boolean;
  newAchievements: Achievement[];
}

/**
 * Register a game answer. Returns xp gained and side-effects.
 * @param game      stable id of the game (e.g. 'royale', 'timeline')
 * @param correct   whether the answer was right
 * @param basePoints base XP for a correct answer (combos multiply on top)
 * @param currentCombo combo count BEFORE this answer (caller tracks per round)
 */
export function registerAnswer(
  game: string,
  correct: boolean,
  basePoints: number,
  currentCombo: number,
): RewardResult {
  const s = load();
  const prevLevel = level(s.xp).level;
  let gained = 0;
  let newCombo = currentCombo;

  if (correct) {
    newCombo = currentCombo + 1;
    const multiplier = 1 + Math.min(0.5, Math.max(0, newCombo - 1) * 0.1); // +10% per combo, cap +50%
    gained = Math.round(basePoints * multiplier);
    s.xp += gained;
    s.totalCorrect += 1;
    if (newCombo > s.bestCombo) s.bestCombo = newCombo;
  } else {
    newCombo = 0;
    s.totalWrong += 1;
  }

  // Per-game stats
  s.perGame[game] = s.perGame[game] ?? { xp: 0, best: 0, plays: 0 };
  s.perGame[game].xp += gained;
  s.perGame[game].best = Math.max(s.perGame[game].best, newCombo);

  // Achievements
  const newAchievements: Achievement[] = [];
  for (const a of ACHIEVEMENTS) {
    if (s.achievements.includes(a.id)) continue;
    let unlocked = false;
    if (a.id === 'first_blood' && s.totalCorrect >= 1) unlocked = true;
    else if (a.id === 'combo_5' && s.bestCombo >= 5) unlocked = true;
    else if (a.id === 'combo_10' && s.bestCombo >= 10) unlocked = true;
    else if (a.id === 'xp_100' && s.xp >= 100) unlocked = true;
    else if (a.id === 'xp_500' && s.xp >= 500) unlocked = true;
    else if (a.id === 'xp_1000' && s.xp >= 1000) unlocked = true;
    if (unlocked) { s.achievements.push(a.id); newAchievements.push(a); }
  }

  const newLevel = level(s.xp).level;
  const result: RewardResult = { xpGained: gained, newCombo, levelUp: newLevel > prevLevel, newAchievements };
  save(s, { xpGained: gained, combo: newCombo, levelUp: result.levelUp, game });
  return result;
}

/** Increment a named counter (e.g. royale_rounds, dictado_perfect) and unlock
 *  counter-driven achievements. */
export function bumpCounter(key: string, inc = 1): Achievement[] {
  const s = load();
  s.counters[key] = (s.counters[key] ?? 0) + inc;
  const newOnes: Achievement[] = [];
  for (const a of ACHIEVEMENTS) {
    if (s.achievements.includes(a.id)) continue;
    if (a.id === 'survivor' && key === 'royale_rounds' && s.counters[key] >= a.threshold) {
      s.achievements.push(a.id); newOnes.push(a);
    }
    if (a.id === 'pentagrama' && key === 'dictado_perfect' && s.counters[key] >= a.threshold) {
      s.achievements.push(a.id); newOnes.push(a);
    }
    if (a.id === 'cartografa' && key === 'mapa_hits' && s.counters[key] >= a.threshold) {
      s.achievements.push(a.id); newOnes.push(a);
    }
    if (a.id === 'cronista' && key === 'timeline_completed' && s.counters[key] >= a.threshold) {
      s.achievements.push(a.id); newOnes.push(a);
    }
  }
  save(s);
  return newOnes;
}

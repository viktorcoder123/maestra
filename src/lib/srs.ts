// SM-2-ish spaced repetition
// quality: 0 (again), 1 (hard), 2 (good), 3 (easy)
export type Quality = 0 | 1 | 2 | 3;

export interface CardState {
  ease: number;
  interval_days: number;
  reps: number;
  lapses: number;
  due_at: number;
  last_reviewed_at: number | null;
}

const MIN_EASE = 1.3;
const DAY = 24 * 60 * 60 * 1000;

export function review(state: CardState, quality: Quality, now: number = Date.now()): CardState {
  let { ease, interval_days, reps, lapses } = state;

  if (quality === 0) {
    lapses += 1;
    reps = 0;
    interval_days = 10 / (24 * 60); // 10 minutes
    ease = Math.max(MIN_EASE, ease - 0.2);
  } else {
    reps += 1;
    if (reps === 1) {
      interval_days = quality === 1 ? 0.5 : quality === 2 ? 1 : 3;
    } else if (reps === 2) {
      interval_days = quality === 1 ? 2 : quality === 2 ? 4 : 7;
    } else {
      const mult = quality === 1 ? 1.2 : quality === 2 ? ease : ease * 1.3;
      interval_days = Math.min(365, interval_days * mult);
    }
    const easeDelta = quality === 1 ? -0.15 : quality === 2 ? 0 : 0.15;
    ease = Math.max(MIN_EASE, Math.min(2.8, ease + easeDelta));
  }

  return {
    ease,
    interval_days,
    reps,
    lapses,
    due_at: now + interval_days * DAY,
    last_reviewed_at: now,
  };
}

export function initialState(now: number = Date.now()): CardState {
  return { ease: 2.5, interval_days: 0, reps: 0, lapses: 0, due_at: now, last_reviewed_at: null };
}

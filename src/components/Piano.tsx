'use client';
import clsx from 'clsx';

const BLACKS: Record<number, number> = { 60: 61, 62: 63, 65: 66, 67: 68, 69: 70, 72: 73, 74: 75 };
const NAMES: Record<number, string> = {
  60: 'Do', 61: 'Do♯', 62: 'Re', 63: 'Re♯', 64: 'Mi', 65: 'Fa', 66: 'Fa♯',
  67: 'Sol', 68: 'Sol♯', 69: 'La', 70: 'La♯', 71: 'Si',
  72: 'Do', 73: 'Do♯', 74: 'Re', 75: 'Re♯', 76: 'Mi',
};

export type PianoKeyState = 'idle' | 'flash' | 'on' | 'correct' | 'wrong' | 'missing';

export interface PianoProps {
  whites: number[];                         // e.g. [60, 62, 64, 65, 67, 69, 71, 72]
  state?: Record<number, PianoKeyState>;    // per-midi state
  onPress: (midi: number) => void;
  height?: number;
  lockedKeys?: number[];
  showNames?: boolean;
}

export function Piano({ whites, state = {}, onPress, height = 180, lockedKeys = [], showNames = true }: PianoProps) {
  const whiteBg = (m: number) => {
    const s = state[m];
    if (s === 'flash') return 'bg-brand-400';
    if (s === 'on')     return 'bg-brand-500';
    if (s === 'correct')return 'bg-ok-fillDark';
    if (s === 'wrong')  return 'bg-bad';
    if (s === 'missing')return 'bg-sage-300';
    return 'bg-white hover:bg-ink-100';
  };
  const blackBg = (m: number) => {
    const s = state[m];
    if (s === 'flash') return 'bg-brand-400';
    if (s === 'on')     return 'bg-brand-500';
    if (s === 'correct')return 'bg-ok-fillDark';
    if (s === 'wrong')  return 'bg-bad';
    if (s === 'missing')return 'bg-sage-300';
    return 'bg-ink-900 hover:bg-ink-700';
  };

  return (
    <div className="relative select-none">
      <div className="flex gap-[1px]">
        {whites.map((m) => (
          <button
            key={m}
            type="button"
            disabled={lockedKeys.includes(m)}
            onPointerDown={(e) => { e.preventDefault(); onPress(m); }}
            className={clsx('relative flex-1 rounded-b-lg border border-ink-900/20 transition-colors', whiteBg(m), ['correct','wrong','on'].includes(state[m] ?? '') ? 'text-white' : 'text-ink-500')}
            style={{ height }}
          >
            {showNames && (
              <span className="absolute bottom-[8px] left-1/2 -translate-x-1/2 text-[13px] font-medium">{NAMES[m]}</span>
            )}
          </button>
        ))}
      </div>
      <div className="absolute top-0 left-0 w-full flex pointer-events-none">
        {whites.map((m) => {
          const black = BLACKS[m];
          if (!black) return <div key={m} className="flex-1" />;
          return (
            <div key={m} className="flex-1 relative">
              <button
                type="button"
                disabled={lockedKeys.includes(black)}
                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); onPress(black); }}
                className={clsx('pointer-events-auto absolute -right-[18%] w-[36%] rounded-b-md border border-ink-900/30 transition-colors z-10', blackBg(black))}
                style={{ height: Math.round(height * 0.6) }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { NAMES as PIANO_NAMES };

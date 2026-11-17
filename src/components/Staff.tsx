/**
 * Five-line musical staff used in Dictado and Intervalo.
 * Full-width SVG; viewBox 100 × 160. Lines at y 60/76/92/108/124.
 * MIDI 64 (E4) sits ON the bottom line; each diatonic step = 8px.
 * C4 (MIDI 60) shows a 38px ledger line at y 140.
 */
import clsx from 'clsx';
import { ReactNode } from 'react';

export function Staff({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 100 160" preserveAspectRatio="none" className={clsx('w-full', className)} style={{ overflow: 'visible' }}>
      {[60, 76, 92, 108, 124].map((y) => (
        <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="rgba(250,250,247,0.5)" strokeWidth="0.3" />
      ))}
      {children}
    </svg>
  );
}

// Semitone-based staff step for white-keys reference (diatonic steps up from C4)
const DIATONIC_FROM_C = { 0: 0, 1: 0.5, 2: 1, 3: 1.5, 4: 2, 5: 3, 6: 3.5, 7: 4, 8: 4.5, 9: 5, 10: 5.5, 11: 6, 12: 7 } as Record<number, number>;

export function noteheadY(midi: number): number {
  // E4 (MIDI 64) is bottom line y=124. Step up 8px per diatonic step.
  const diffFromC4 = midi - 60;
  const step = DIATONIC_FROM_C[((diffFromC4 % 12) + 12) % 12] + 7 * Math.floor(diffFromC4 / 12);
  // diatonic steps from E4:
  const stepsFromE4 = step - 2;
  return 124 - stepsFromE4 * 8;
}

export function isSharp(midi: number): boolean {
  return [1, 3, 6, 8, 10].includes(((midi % 12) + 12) % 12);
}

export function Notehead({ x, y, fill = '#fafaf7', dashed = false }: { x: number; y: number; fill?: string; dashed?: boolean }) {
  return (
    <ellipse
      cx={x} cy={y} rx={3.3} ry={2.2}
      transform={`rotate(-18 ${x} ${y})`}
      fill={dashed ? 'none' : fill}
      stroke={fill}
      strokeWidth={dashed ? '0.6' : '0.2'}
      strokeDasharray={dashed ? '1 0.6' : undefined}
    />
  );
}

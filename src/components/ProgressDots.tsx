type Status = 'done-right' | 'done-wrong' | 'current' | 'upcoming';

export function ProgressDots({ states, stage }: { states: Status[]; stage?: boolean }) {
  return (
    <div className="flex gap-2 w-full">
      {states.map((s, i) => {
        const bg =
          s === 'done-right' ? (stage ? 'bg-ok-dark' : 'bg-sage-600') :
          s === 'done-wrong' ? (stage ? 'bg-bad-dark' : 'bg-bad') :
          s === 'current'     ? (stage ? 'bg-ink-50' : 'bg-ink-900') :
                                (stage ? 'bg-ink-50/25' : 'bg-ink-900/15');
        return <span key={i} className={`flex-1 h-[5px] rounded-full ${bg}`} />;
      })}
    </div>
  );
}

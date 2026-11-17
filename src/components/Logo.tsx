import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-[10px] text-ink-900">
      <span className="flex flex-col gap-[3px] w-[22px]">
        <span className="h-[1.5px] bg-ink-900 block" />
        <span className="h-[1.5px] bg-ink-900 block" />
        <span className="h-[1.5px] bg-brand-500 block" />
        <span className="h-[1.5px] bg-ink-900 block" />
        <span className="h-[1.5px] bg-ink-900 block" />
      </span>
      <span className="font-serif text-[26px] leading-none">Maestra</span>
    </Link>
  );
}

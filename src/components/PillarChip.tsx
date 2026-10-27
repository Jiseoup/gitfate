/** A pillar's color-and-animal name ("흰 돼지" / "White Pig") as a small chip; `title` gives the saju term. */
export function PillarChip({ text, title }: { text: string; title?: string }) {
  return (
    <span
      title={title}
      className="inline-flex items-center rounded-full bg-stone-100 px-2 py-px align-middle text-xs font-medium leading-tight text-stone-600 ring-1 ring-stone-200"
    >
      {text}
    </span>
  );
}

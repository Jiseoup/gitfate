/** "Today's role" / "This year's role" label and the role name; hover shows the traditional ten-god term. */
export function RoleTag({ label, role, saju }: { label: string; role: string; saju: string }) {
  return (
    <span className="mr-2 inline-flex items-center gap-1.5 align-middle text-xs">
      <span className="text-stone-500">{label}</span>
      <span title={saju} className="rounded-full bg-stone-800 px-2 py-0.5 font-semibold text-white">
        {role}
      </span>
    </span>
  );
}

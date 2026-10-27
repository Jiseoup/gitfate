'use client';

import { useId } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/** Language picker: swaps the first path segment and keeps the rest of the path and the query string. */
export function LanguageSwitcher({ locale, locales, label }: {
  locale: string;
  locales: { code: string; name: string }[];
  label: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const id = useId();

  return (
    <div>
      <label htmlFor={id} className="sr-only">{label}</label>
      <select
        id={id}
        value={locale}
        onChange={(e) => {
          const rest = (pathname ?? '').split('/').slice(2);
          // Read the query at click time (not useSearchParams) so the shared layout stays statically renderable.
          router.push(`/${[e.target.value, ...rest].join('/')}${window.location.search}`);
        }}
        className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-sm"
      >
        {locales.map((l) => (
          <option key={l.code} value={l.code}>{l.name}</option>
        ))}
      </select>
    </div>
  );
}

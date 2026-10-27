'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { CountryChoice } from '@/reading/countries';
import { CountryPicker } from './CountryPicker';

/** Why this timezone was used, a birth-country changer, and the profile-location suggestion. */
export function TimezoneBar({ basePath, sourceText, changeLabel, cityLabel, suggestion, countries }: {
  /** `/{locale}/{login}`; the picked zone is added as `?tz=`. */
  basePath: string;
  sourceText: string;
  changeLabel: string;
  cityLabel: string;
  suggestion: { text: string; iana: string } | null;
  countries: CountryChoice[];
}) {
  const router = useRouter();
  const withTz = (iana: string) => `${basePath}?tz=${encodeURIComponent(iana)}`;
  return (
    <div className="space-y-2 rounded-xl bg-stone-100 p-3 text-sm text-stone-700">
      <p>{sourceText}</p>
      {suggestion && (
        <p>
          <Link href={withTz(suggestion.iana)} className="text-red-700 underline underline-offset-2">
            {suggestion.text}
          </Link>
        </p>
      )}
      <details>
        <summary className="cursor-pointer select-none font-medium text-stone-900">{changeLabel} ▾</summary>
        <div className="mt-2">
          <CountryPicker
            countries={countries}
            label={changeLabel}
            cityLabel={cityLabel}
            onSelect={(iana) => router.push(withTz(iana))}
          />
        </div>
      </details>
    </div>
  );
}

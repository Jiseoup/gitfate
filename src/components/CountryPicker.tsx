'use client';

import { useId, useState } from 'react';
import type { CountryChoice } from '@/reading/countries';

/** Country select; countries spanning several UTC offsets ask for a city before `onSelect(iana)`. */
export function CountryPicker({ countries, label, cityLabel, onSelect }: {
  countries: CountryChoice[];
  label: string;
  cityLabel: string;
  onSelect: (iana: string) => void;
}) {
  const id = useId();
  const [code, setCode] = useState('');
  const country = countries.find((c) => c.code === code);
  const needsCity = country !== undefined && country.zones.length > 1;
  const selectClass = 'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm';

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <label htmlFor={`${id}-country`} className="sr-only">{label}</label>
      <select
        id={`${id}-country`}
        className={selectClass}
        value={code}
        onChange={(e) => {
          const next = countries.find((c) => c.code === e.target.value);
          setCode(e.target.value);
          if (next?.zones.length === 1) onSelect(next.zones[0].iana);
        }}
      >
        <option value="" disabled>{label}</option>
        {countries.map((c) => (
          <option key={c.code} value={c.code}>{c.name}</option>
        ))}
      </select>
      {needsCity && (
        <>
          <label htmlFor={`${id}-city`} className="sr-only">{cityLabel}</label>
          <select
            id={`${id}-city`}
            key={code}
            className={selectClass}
            defaultValue=""
            onChange={(e) => e.target.value && onSelect(e.target.value)}
          >
            <option value="" disabled>{cityLabel}</option>
            {country.zones.map((z) => (
              <option key={z.iana} value={z.iana}>{z.city}</option>
            ))}
          </select>
        </>
      )}
    </div>
  );
}

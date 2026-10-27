'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isValidLogin } from '@/lib/login';

/**
 * Partner username input; goes to `/{locale}/{login}/vs/{other}`, carrying `tz` (the `?tz=` the user's
 * reading used) over as `?tzA=` so the compat reading uses the same chart.
 */
export function CompatInput({ locale, login, tz, placeholder, cta, invalidText }: {
  locale: string;
  login: string;
  tz?: string;
  placeholder: string;
  cta: string;
  invalidText: string;
}) {
  const router = useRouter();
  const id = useId();
  const [value, setValue] = useState('');
  const [invalid, setInvalid] = useState(false);

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        const other = value.trim();
        if (!isValidLogin(other)) {
          setInvalid(true);
          return;
        }
        const query = tz ? `?${new URLSearchParams({ tzA: tz })}` : '';
        router.push(`/${locale}/${login}/vs/${other}${query}`);
      }}
    >
      <div className="flex gap-2">
        <label htmlFor={id} className="sr-only">{placeholder}</label>
        <input
          id={id}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setInvalid(false);
          }}
          placeholder={placeholder}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={invalid}
          className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white">
          {cta}
        </button>
      </div>
      {invalid && <p className="text-sm text-red-700">{invalidText}</p>}
    </form>
  );
}

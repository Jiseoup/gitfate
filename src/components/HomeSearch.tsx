'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isValidLogin } from '@/lib/login';

/** Home username input; goes to `/{locale}/{login}`. */
export function HomeSearch({ locale, label, placeholder, cta, invalidText }: {
  locale: string;
  label: string;
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
      className="w-full space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        const login = value.trim();
        if (!isValidLogin(login)) {
          setInvalid(true);
          return;
        }
        router.push(`/${locale}/${login}`);
      }}
    >
      <div className="flex gap-2">
        <label htmlFor={id} className="sr-only">{label}</label>
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
          className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2"
        />
        <button type="submit" className="rounded-lg bg-stone-900 px-4 py-2 font-medium text-white">
          {cta}
        </button>
      </div>
      {invalid && <p role="alert" className="text-sm text-red-700">{invalidText}</p>}
    </form>
  );
}

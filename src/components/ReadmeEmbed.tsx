'use client';

import { useId, useState } from 'react';
import { EMBED_CARD_TYPES, EMBED_THEMES, embedCardUrl, embedSnippet, type EmbedCardType, type EmbedTheme } from '@/lib/embed';

/** Pick a card and a theme, preview it, and copy the README code. */
export function ReadmeEmbed({ origin, locale, login, tz, labels }: {
  /** Absolute site origin, so the copied code works outside this site. */
  origin: string;
  locale: string;
  login: string;
  tz?: string;
  labels: {
    card: string;
    theme: string;
    types: Record<EmbedCardType, string>;
    themes: Record<EmbedTheme, string>;
    hint: string;
    copy: string;
    copied: string;
    copyFailed: string;
  };
}) {
  const id = useId();
  const [type, setType] = useState<EmbedCardType>('natal');
  const [theme, setTheme] = useState<EmbedTheme>('auto');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const code = embedSnippet({ origin, type, locale, login, theme, tz });
  // Previews load from this site, so the page also works before SITE_URL points here.
  const preview = (th: Exclude<EmbedTheme, 'auto'>) => embedCardUrl('', type, locale, login, th, tz);
  const select = 'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm';

  const copy = () => {
    if (!navigator.clipboard) {
      setCopyState('failed');
      return;
    }
    navigator.clipboard.writeText(code).then(
      () => setCopyState('copied'),
      () => setCopyState('failed'),
    );
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${id}-type`} className="mb-1 block text-xs text-stone-500">{labels.card}</label>
          <select
            id={`${id}-type`}
            className={select}
            value={type}
            onChange={(e) => {
              setType(e.target.value as EmbedCardType);
              setCopyState('idle');
            }}
          >
            {EMBED_CARD_TYPES.map((v) => <option key={v} value={v}>{labels.types[v]}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-theme`} className="mb-1 block text-xs text-stone-500">{labels.theme}</label>
          <select
            id={`${id}-theme`}
            className={select}
            value={theme}
            onChange={(e) => {
              setTheme(e.target.value as EmbedTheme);
              setCopyState('idle');
            }}
          >
            {EMBED_THEMES.map((v) => <option key={v} value={v}>{labels.themes[v]}</option>)}
          </select>
        </div>
      </div>
      {theme === 'auto' ? (
        <picture className="block">
          <source media="(prefers-color-scheme: dark)" srcSet={preview('github-dark')} />
          <img src={preview('github-light')} alt="" width={1200} height={630} className="h-auto w-full rounded-lg ring-1 ring-stone-200" />
        </picture>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- a live card image, not a static asset
        <img src={preview(theme)} alt="" width={1200} height={630} className="h-auto w-full rounded-lg ring-1 ring-stone-200" />
      )}
      <pre className="overflow-x-auto rounded-lg bg-stone-900 p-3 text-xs leading-relaxed text-stone-100"><code>{code}</code></pre>
      <p className="text-xs text-stone-500">{labels.hint}</p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={copy}
          className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
        >
          {labels.copy}
        </button>
        <p role="status" className={`text-sm ${copyState === 'failed' ? 'text-red-700' : 'text-green-700'}`}>
          {copyState === 'copied' ? labels.copied : copyState === 'failed' ? labels.copyFailed : ''}
        </p>
      </div>
    </div>
  );
}

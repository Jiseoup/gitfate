'use client';

import { useState, useSyncExternalStore } from 'react';

const noSubscribe = () => () => {};

/** Copy link, card image download and X share. */
export function ShareButtons({ labels, cardHref, sharePath, shareText }: {
  labels: { copy: string; copied: string; copyFailed: string; download: string; x: string };
  cardHref: string;
  /** Canonical page path shared on X. */
  sharePath: string;
  shareText: string;
}) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const origin = useSyncExternalStore(noSubscribe, () => window.location.origin, () => '');
  const xHref = `https://x.com/intent/post?${new URLSearchParams({ text: shareText, url: origin + sharePath })}`;
  const button =
    'inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium hover:bg-stone-100';

  const copy = () => {
    if (!navigator.clipboard) {
      setCopyState('failed');
      return;
    }
    navigator.clipboard.writeText(window.location.href).then(
      () => setCopyState('copied'),
      () => setCopyState('failed'),
    );
  };

  return (
    <div className="flex flex-wrap justify-center gap-2">
      <button type="button" className={button} onClick={copy}>{labels.copy}</button>
      <a className={button} href={cardHref} download>{labels.download}</a>
      <a className={button} href={xHref} target="_blank" rel="noopener noreferrer">{labels.x}</a>
      <p
        role="status"
        className={`w-full text-center text-sm ${copyState === 'failed' ? 'text-red-700' : 'text-green-700'}`}
      >
        {copyState === 'copied' ? labels.copied : copyState === 'failed' ? labels.copyFailed : ''}
      </p>
    </div>
  );
}

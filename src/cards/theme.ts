import type { Element } from '@/core/types';
import { DEFAULT_CARD_THEME, type CardThemeName } from '@/lib/card-url';

/** Every color a share card uses. Element colors keep the five-element scheme; dark themes only lift what would vanish. */
export interface CardTheme {
  paper: string;
  panel: string;
  ink: string;
  muted: string;
  line: string;
  seal: string;
  luck: string;
  commits: string;
  star: string;
  starOff: string;
  /** Avatar ring and shadow. */
  ring: string;
  shadow: string;
  element: Record<Element, { bg: string; fg: string; border: string; stripe: string }>;
}

const LIGHT_ELEMENTS: CardTheme['element'] = {
  wood: { bg: '#16a34a', fg: '#ffffff', border: '#15803d', stripe: '#16a34a' },
  fire: { bg: '#dc2626', fg: '#ffffff', border: '#b91c1c', stripe: '#dc2626' },
  earth: { bg: '#facc15', fg: '#1c1917', border: '#eab308', stripe: '#facc15' },
  metal: { bg: '#ffffff', fg: '#57534e', border: '#a8a29e', stripe: '#d6d3d1' },
  water: { bg: '#0f172a', fg: '#ffffff', border: '#0f172a', stripe: '#0f172a' },
};

/** On a dark background, black water needs a visible edge and stripe. */
function darkElements(water: { bg: string; border: string }): CardTheme['element'] {
  return {
    ...LIGHT_ELEMENTS,
    metal: { bg: '#e7e5e4', fg: '#44403c', border: '#a8a29e', stripe: '#d6d3d1' },
    water: { bg: water.bg, fg: '#ffffff', border: water.border, stripe: water.border },
  };
}

export const CARD_THEMES: Record<CardThemeName, CardTheme> = {
  light: {
    paper: '#f7f2e8',
    panel: '#eee5d3',
    ink: '#1c1917',
    muted: '#78716c',
    line: '#e2d9c6',
    seal: '#b91c1c',
    luck: '#dc2626',
    commits: '#16a34a',
    star: '#f59e0b',
    starOff: '#d6d3d1',
    ring: '#ffffff',
    shadow: 'rgba(28, 25, 23, 0.18)',
    element: LIGHT_ELEMENTS,
  },
  dark: {
    paper: '#1c1917',
    panel: '#292524',
    ink: '#f5f5f4',
    muted: '#a8a29e',
    line: '#44403c',
    seal: '#f87171',
    luck: '#ef4444',
    commits: '#22c55e',
    star: '#fbbf24',
    starOff: '#57534e',
    ring: '#44403c',
    shadow: 'rgba(0, 0, 0, 0.45)',
    element: darkElements({ bg: '#1e293b', border: '#64748b' }),
  },
  'github-light': {
    paper: '#ffffff',
    panel: '#f6f8fa',
    ink: '#1f2328',
    muted: '#59636e',
    line: '#d1d9e0',
    seal: '#cf222e',
    luck: '#cf222e',
    commits: '#1a7f37',
    star: '#d4a72c',
    starOff: '#d1d9e0',
    ring: '#ffffff',
    shadow: 'rgba(31, 35, 40, 0.15)',
    element: { ...LIGHT_ELEMENTS, metal: { ...LIGHT_ELEMENTS.metal, border: '#d1d9e0' } },
  },
  'github-dark': {
    paper: '#0d1117',
    panel: '#161b22',
    ink: '#f0f6fc',
    muted: '#9198a1',
    line: '#30363d',
    seal: '#f85149',
    luck: '#f85149',
    commits: '#3fb950',
    star: '#e3b341',
    starOff: '#30363d',
    ring: '#30363d',
    shadow: 'rgba(1, 4, 9, 0.6)',
    element: darkElements({ bg: '#1c2b4a', border: '#4b6a9b' }),
  },
};

export function cardTheme(name: CardThemeName = DEFAULT_CARD_THEME): CardTheme {
  return CARD_THEMES[name];
}

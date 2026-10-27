import type { Element } from '@/core/types';

/**
 * Five-element colors: wood green, fire red, earth yellow, metal white/gray, water black/navy.
 * `chip` is a filled tile (its text color is the icon color), `bar` a filled bar, `ink` an icon or
 * text color that stays readable on the light page background.
 */
export const ELEMENT_STYLE: Record<Element, { chip: string; bar: string; ink: string }> = {
  wood: { chip: 'bg-green-600 text-white', bar: 'bg-green-600', ink: 'text-green-600' },
  fire: { chip: 'bg-red-600 text-white', bar: 'bg-red-600', ink: 'text-red-600' },
  earth: { chip: 'bg-yellow-400 text-stone-900', bar: 'bg-yellow-400', ink: 'text-yellow-600' },
  metal: { chip: 'bg-white text-stone-600 ring-1 ring-inset ring-stone-300', bar: 'bg-stone-300', ink: 'text-stone-500' },
  water: { chip: 'bg-slate-900 text-white', bar: 'bg-slate-900', ink: 'text-slate-900' },
};

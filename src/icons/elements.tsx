import type { ReactElement } from 'react';
import type { Element } from '@/core/types';
import { frame, type Icon, type IconProps } from './frame';

/*
 * The five element icons: wood = leaf, fire = flame, earth = stone, metal = gear, water = droplet.
 * Same grid and style as the Sign icons; cut-outs use fillRule="evenodd" so they stay one color.
 */

const SOFT = 0.45;

/** Wood: a leaf with a cut-out midrib and a short stem. */
export const LeafIcon: Icon = (p) =>
  frame(p, (c) => (
    <>
      <path
        fillRule="evenodd"
        d="M4.5 19.5C4.5 10 10 3.5 20.5 3.5c0 10.5-6.5 16-16 16zM7.2 17.6l10.6-10.6-.8-.8L6.4 16.8z"
        fill={c}
      />
      <path d="M2.5 21.5l3-3" stroke={c} strokeWidth="2" strokeLinecap="round" />
    </>
  ));

/** Fire: a flame with a cut-out inner tongue. */
export const FlameIcon: Icon = (p) =>
  frame(p, (c) => (
    <path
      fillRule="evenodd"
      d="M12 1.5c.6 3.8 6.8 6.4 6.8 13a6.8 6.8 0 0 1-13.6 0c0-3.2 1.6-5.4 3.4-7 .2 2.2 1 3.6 2.4 4.4C10.6 8.6 10.8 4.6 12 1.5zM12 20.2a2.6 2.6 0 0 1-2.6-2.6c0-1.6 1.1-2.8 2.6-4.4 1.5 1.6 2.6 2.8 2.6 4.4a2.6 2.6 0 0 1-2.6 2.6z"
      fill={c}
    />
  ));

/** Earth: a boulder with a cut-out facet, and a pebble beside it. */
export const StoneIcon: Icon = (p) =>
  frame(p, (c) => (
    <>
      <path
        fillRule="evenodd"
        d="M2.6 17.6 4.8 10.4Q5 9.8 5.5 9.4l4.6-3.8q.5-.4 1.1-.3l5.4 1.4q.6.2.8.7l2.3 5.6q.2.5 0 1l-1.3 4.4q-.2.6-.8.7l-7.4 1.4q-.4.1-.8-.1l-4.3-2.3q-.6-.4-.5-.9zM7.2 12.6l3.6-3.2 1.1 1.2-3.6 3.2z"
        fill={c}
      />
      <ellipse cx="19.5" cy="19.2" rx="3" ry="2.3" fill={c} fillOpacity={SOFT} />
    </>
  ));

/** Eight-tooth gear outline with a round hole (evenodd), built once. */
const GEAR_PATH = (() => {
  const pt = (r: number, deg: number) => {
    const a = (deg * Math.PI) / 180;
    return `${(12 + r * Math.cos(a)).toFixed(2)} ${(12 + r * Math.sin(a)).toFixed(2)}`;
  };
  const outline = Array.from({ length: 8 }, (_, i) => {
    const t = i * 45 - 90;
    return [pt(8, t - 15), pt(10.8, t - 9), pt(10.8, t + 9), pt(8, t + 15)];
  }).flat();
  const hole = 'M15.4 12a3.4 3.4 0 1 0-6.8 0 3.4 3.4 0 1 0 6.8 0z';
  return `M${outline.join('L')}z${hole}`;
})();

/** Metal: a gear. */
export const GearIcon: Icon = (p) =>
  frame(p, (c) => <path fillRule="evenodd" d={GEAR_PATH} fill={c} strokeLinejoin="round" />);

/** Water: a single droplet with a cut-out highlight. */
export const DropletIcon: Icon = (p) =>
  frame(p, (c) => (
    <path
      fillRule="evenodd"
      d="M12 2c3.8 4.6 7 8.4 7 12.2a7 7 0 0 1-14 0C5 10.4 8.2 6.6 12 2zM8.4 14.2c0 1.9 1.2 3.4 3 3.9l.4-1.3c-1.2-.4-2-1.4-2-2.6z"
      fill={c}
    />
  ));

export const ELEMENT_ICONS: Record<Element, Icon> = {
  wood: LeafIcon,
  fire: FlameIcon,
  earth: StoneIcon,
  metal: GearIcon,
  water: DropletIcon,
};

/** The icon of one of the five elements. */
export function ElementIcon({ element, ...props }: IconProps & { element: Element }): ReactElement {
  return ELEMENT_ICONS[element](props);
}

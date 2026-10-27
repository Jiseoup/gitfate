import type { ReactElement } from 'react';
import type { Stem } from '@/core/types';
import { frame, STROKE, type Icon, type IconProps } from './frame';

/*
 * The ten Dev Sign icons, one per heavenly stem.
 * Flat silhouettes on a 24-unit grid in one color; a lighter tone (fillOpacity) marks secondary parts.
 * They avoid the element icons' shapes (leaf, flame, stone, gear, droplet) so the two sets never blur.
 */

const SOFT = 0.45;

/** 甲 The Oak: a broad canopy on a sturdy trunk. */
export const OakIcon: Icon = (p) =>
  frame(p, (c) => (
    <>
      <rect x="10.5" y="12" width="3" height="8.5" rx="1" fill={c} />
      <circle cx="12" cy="8" r="5.5" fill={c} />
      <circle cx="7" cy="11" r="4" fill={c} />
      <circle cx="17" cy="11" r="4" fill={c} />
      <rect x="5" y="20" width="14" height="2" rx="1" fill={c} fillOpacity={SOFT} />
    </>
  ));

/** 乙 The Vine: a curling stem climbing with leaves on both sides. */
export const VineIcon: Icon = (p) =>
  frame(p, (c) => (
    <>
      <path
        d="M8 22c0-4 6-4.5 6-8.5S9 9 10 5.5 15 2 15 2"
        stroke={c}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M13.6 14.5c2.6-1.6 5.6-1 7 1.2-2.6 1.6-5.6 1-7-1.2z" fill={c} />
      <path d="M10.6 9.6c-2.4-1.9-5.4-1.7-7 .3 2.4 1.9 5.4 1.7 7-.3z" fill={c} />
      <path d="M11.8 5.2c1-2.6 3.5-3.9 6-3.2-1 2.6-3.5 3.9-6 3.2z" fill={c} fillOpacity={SOFT} />
      <path d="M9.4 18.6c-2.3-.9-4.4-.1-5.3 1.9 2.3.9 4.4.1 5.3-1.9z" fill={c} fillOpacity={SOFT} />
    </>
  ));

const SUN_RAYS = [0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
  const a = (deg * Math.PI) / 180;
  const at = (r: number) => [12 + r * Math.cos(a), 12 + r * Math.sin(a)].map((n) => Number(n.toFixed(2)));
  const [x1, y1] = at(7.2);
  const [x2, y2] = at(10.2);
  return { x1, y1, x2, y2 };
});

/** 丙 The Sun: a full disc with eight rays. */
export const SunIcon: Icon = (p) =>
  frame(p, (c) => (
    <>
      <circle cx="12" cy="12" r="4.8" fill={c} />
      {SUN_RAYS.map((r, i) => (
        <line key={i} {...r} stroke={c} strokeWidth={STROKE} strokeLinecap="round" />
      ))}
    </>
  ));

/** 丁 The Candle: a candle with a small steady flame. */
export const CandleIcon: Icon = (p) =>
  frame(p, (c) => (
    <>
      <path d="M12 1.8c2.1 2.6 3.1 4.3 3.1 5.8a3.1 3.1 0 0 1-6.2 0c0-1.5 1-3.2 3.1-5.8z" fill={c} />
      <rect x="11.2" y="10" width="1.6" height="2" fill={c} fillOpacity={SOFT} />
      <rect x="8" y="12" width="8" height="10" rx="1.4" fill={c} />
      <rect x="5.5" y="20.5" width="13" height="2" rx="1" fill={c} fillOpacity={SOFT} />
    </>
  ));

/** 戊 The Mountain: a tall peak with a smaller one behind it. */
export const MountainIcon: Icon = (p) =>
  frame(p, (c) => (
    <>
      <polygon points="11,21 16.5,10.5 23,21" fill={c} fillOpacity={SOFT} strokeLinejoin="round" />
      <polygon points="1,21 9.5,4 18,21" fill={c} stroke={c} strokeWidth="1" strokeLinejoin="round" />
    </>
  ));

/** 己 The Garden: a two-leaf sprout coming out of a mound of soil. */
export const GardenIcon: Icon = (p) =>
  frame(p, (c) => (
    <>
      <path d="M12 18.5V10" stroke={c} strokeWidth={STROKE} strokeLinecap="round" />
      <path d="M12 12.5C12 8.4 9 5.8 4.2 5.8c0 4.1 3 6.7 7.8 6.7z" fill={c} />
      <path d="M12 10c0-4.1 3-6.7 7.8-6.7 0 4.1-3 6.7-7.8 6.7z" fill={c} />
      <path d="M3 22c1.2-3.4 4.7-4.8 9-4.8s7.8 1.4 9 4.8z" fill={c} fillOpacity={SOFT} />
    </>
  ));

/** 庚 The Blade: a straight sword, point up-right (drawn upright, then turned 45°). */
const TURN = 'rotate(45 12 12)';
export const BladeIcon: Icon = (p) =>
  frame(p, (c) => (
    <>
      <polygon points="12,0.6 14,3.4 14,15 10,15 10,3.4" fill={c} transform={TURN} />
      <rect x="6.6" y="15" width="10.8" height="2.6" rx="1.3" fill={c} transform={TURN} />
      <rect x="10.9" y="17.6" width="2.2" height="3.8" fill={c} transform={TURN} />
      <circle cx="12" cy="22.4" r="1.7" fill={c} fillOpacity={SOFT} transform={TURN} />
    </>
  ));

/** 辛 The Jewel: a cut gem, bright crown over a faceted pavilion. */
export const JewelIcon: Icon = (p) =>
  frame(p, (c) => (
    <>
      <polygon points="7,3.5 17,3.5 21.5,9 2.5,9" fill={c} />
      <polygon points="2.5,10 21.5,10 12,21.5" fill={c} fillOpacity={SOFT} />
      <polygon points="8,10 16,10 12,21.5" fill={c} />
    </>
  ));

/** 壬 The Ocean: three rolling waves. */
export const OceanIcon: Icon = (p) =>
  frame(p, (c) => (
    <>
      {[6.5, 12, 17.5].map((y, i) => (
        <path
          key={y}
          d={`M2 ${y}c2.5-2.4 5-2.4 7.5 0s5 2.4 7.5 0 3.7-2.2 5-1.6`}
          stroke={c}
          strokeOpacity={i === 2 ? SOFT : 1}
          strokeWidth={STROKE + 0.3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </>
  ));

/** 癸 The Rain: a small cloud letting three drops fall. */
export const RainIcon: Icon = (p) =>
  frame(p, (c) => (
    <>
      <circle cx="8.5" cy="9" r="3.6" fill={c} />
      <circle cx="13.5" cy="7" r="4.6" fill={c} />
      <circle cx="17.6" cy="10" r="3.1" fill={c} />
      <rect x="5" y="9" width="15.6" height="4.1" rx="2.05" fill={c} />
      {[
        [7.5, 15.2],
        [12.5, 16.8],
        [17.5, 15.2],
      ].map(([x, y]) => (
        <path
          key={x}
          d={`M${x} ${y}c1.1 1.5 1.7 2.4 1.7 3.2a1.7 1.7 0 0 1-3.4 0c0-.8.6-1.7 1.7-3.2z`}
          fill={c}
          fillOpacity={x === 12.5 ? 1 : SOFT}
        />
      ))}
    </>
  ));

export const SIGN_ICONS: Record<Stem, Icon> = {
  甲: OakIcon,
  乙: VineIcon,
  丙: SunIcon,
  丁: CandleIcon,
  戊: MountainIcon,
  己: GardenIcon,
  庚: BladeIcon,
  辛: JewelIcon,
  壬: OceanIcon,
  癸: RainIcon,
};

/** The Dev Sign icon of a stem. */
export function SignIcon({ stem, ...props }: IconProps & { stem: Stem }): ReactElement {
  return SIGN_ICONS[stem](props);
}

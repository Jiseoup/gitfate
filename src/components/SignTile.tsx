import { stemElement } from '@/core/ganzhi';
import type { Stem } from '@/core/types';
import { SignIcon } from '@/icons/signs';
import { ELEMENT_STYLE } from './element-style';

const BOX = {
  sm: { box: 'h-9 w-9 rounded-lg', icon: 22 },
  md: { box: 'h-12 w-12 rounded-xl sm:h-14 sm:w-14', icon: 32 },
  lg: { box: 'h-16 w-16 rounded-2xl sm:h-20 sm:w-20', icon: 48 },
} as const;

/** A stem's Dev Sign icon on its element color. `title` names the Sign (and the saju term). */
export function SignTile({ stem, title, size = 'md' }: { stem: Stem; title: string; size?: keyof typeof BOX }) {
  const { box, icon } = BOX[size];
  return (
    <span
      role="img"
      aria-label={title}
      title={title}
      className={`inline-flex shrink-0 items-center justify-center ${box} ${ELEMENT_STYLE[stemElement(stem)].chip}`}
    >
      <SignIcon stem={stem} size={icon} />
    </span>
  );
}

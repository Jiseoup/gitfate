import { ELEMENTS, type Element } from '@/core/types';
import { ElementIcon } from '@/icons/elements';
import type { T } from '@/i18n/messages';
import { ELEMENT_STYLE } from './element-style';

/** Element counts across the eight characters (hidden stems are not counted). */
export function ElementBars({ counts, t }: { counts: Record<Element, number>; t: T }) {
  return (
    <ul className="space-y-2">
      {ELEMENTS.map((e) => (
        <li key={e} className="flex items-center gap-3 text-sm">
          <span className="flex w-28 shrink-0 items-center gap-1.5 text-stone-700">
            <span className={ELEMENT_STYLE[e].ink}>
              <ElementIcon element={e} size={20} />
            </span>
            {t(`terms.element.${e}`)}
          </span>
          <span className="h-3 flex-1 overflow-hidden rounded-full bg-stone-200">
            <span
              className={`block h-full rounded-full ${ELEMENT_STYLE[e].bar}`}
              style={{ width: `${(counts[e] / 8) * 100}%` }}
            />
          </span>
          <span className="w-4 text-right tabular-nums text-stone-600">{counts[e]}</span>
        </li>
      ))}
    </ul>
  );
}
